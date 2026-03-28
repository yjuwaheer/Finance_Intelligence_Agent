// ─────────────────────────────────────────────────────────────────────────────
// server.ts — Express app entry point
//
// Thin route-wiring file. All business logic lives in lib/:
//   lib/env.ts    — .env loader
//   lib/data.ts   — JSON file I/O + holdings sync
//   lib/ticker.ts — live price fetching + server-side cache
//   lib/agent.ts  — system prompt builder + conversation history
// ─────────────────────────────────────────────────────────────────────────────

import express              from "express";
import { query }            from "@anthropic-ai/claude-code";
import { fileURLToPath }    from "url";
import path                 from "path";

import { loadEnv }                          from "./lib/env.js";
import { ARRAY_FILES, readData, writeData,
         syncHoldingsFromTrade }            from "./lib/data.js";
import { getTickerData, invalidateTickerCache } from "./lib/ticker.js";
import { MODEL, MAX_TURNS, MCP_SERVERS,
         buildSystemPrompt, getSession,
         deleteSession }                    from "./lib/agent.js";

// ── Bootstrap ─────────────────────────────────────────────────────────────────

loadEnv();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, "..");

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

// ── Data management page ──────────────────────────────────────────────────────

app.get("/data", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "data.html"));
});

// ── Profile (single-object file) ──────────────────────────────────────────────

app.put("/api/data/profile", (req, res) => {
  try {
    writeData("profile.json", req.body);
    res.json(req.body);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Trades (POST only — auto-syncs holdings.json) ─────────────────────────────

app.post("/api/data/trades", (req, res) => {
  try {
    const trades = (readData("trades.json") ?? []) as unknown[];
    trades.push(req.body);
    writeData("trades.json", trades);
    syncHoldingsFromTrade(req.body as Record<string, unknown>);
    res.json(trades);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Generic array resource CRUD ───────────────────────────────────────────────

app.post("/api/data/:resource", (req, res) => {
  const file = `${req.params.resource}.json`;
  if (!ARRAY_FILES.includes(file as any)) {
    res.status(400).json({ error: "Invalid resource" }); return;
  }
  try {
    const arr = (readData(file) ?? []) as unknown[];
    arr.push(req.body);
    writeData(file, arr);
    if (file === "watchlist.json") invalidateTickerCache();
    res.json(arr);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.put("/api/data/:resource/:index", (req, res) => {
  const file = `${req.params.resource}.json`;
  const idx  = parseInt(req.params.index, 10);
  if (!ARRAY_FILES.includes(file as any)) {
    res.status(400).json({ error: "Invalid resource" }); return;
  }
  try {
    const arr = (readData(file) ?? []) as unknown[];
    if (idx < 0 || idx >= arr.length) {
      res.status(404).json({ error: "Not found" }); return;
    }
    arr[idx] = req.body;
    writeData(file, arr);
    if (file === "watchlist.json") invalidateTickerCache();
    res.json(arr);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.delete("/api/data/:resource/:index", (req, res) => {
  const file = `${req.params.resource}.json`;
  const idx  = parseInt(req.params.index, 10);
  if (!ARRAY_FILES.includes(file as any)) {
    res.status(400).json({ error: "Invalid resource" }); return;
  }
  try {
    const arr = (readData(file) ?? []) as unknown[];
    if (idx < 0 || idx >= arr.length) {
      res.status(404).json({ error: "Not found" }); return;
    }
    arr.splice(idx, 1);
    writeData(file, arr);
    if (file === "watchlist.json") invalidateTickerCache();
    res.json(arr);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Ticker prices (cached, no LLM) ────────────────────────────────────────────

app.get("/api/ticker", async (_req, res) => {
  try {
    res.json(await getTickerData());
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── All data snapshot (used by ticker init + data widgets) ────────────────────

app.get("/api/data", (_req, res) => {
  res.json({
    profile:      readData("profile.json"),
    holdings:     readData("holdings.json"),
    watchlist:    readData("watchlist.json"),
    transactions: readData("transactions.json"),
    properties:   readData("properties.json"),
    trades:       readData("trades.json"),
  });
});

// ── Chat (SSE streaming) ──────────────────────────────────────────────────────

app.post("/api/chat", async (req, res) => {
  const { message, sessionId } = req.body as { message: string; sessionId: string };

  if (!message?.trim()) {
    res.status(400).json({ error: "Message required" }); return;
  }

  res.setHeader("Content-Type",    "text/event-stream");
  res.setHeader("Cache-Control",   "no-cache");
  res.setHeader("Connection",      "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const emit = (d: object) => res.write(`data: ${JSON.stringify(d)}\n\n`);

  const sid  = sessionId ?? "default";
  const hist = getSession(sid);

  // History is injected via the system prompt; user message stays clean
  hist.push({ role: "user", content: message });
  let reply = "";

  try {
    for await (const msg of query({
      prompt:  message,
      options: {
        cwd:              ROOT,
        permissionMode:   "bypassPermissions",
        mcpServers:       MCP_SERVERS,
        maxTurns:         MAX_TURNS,
        model:            MODEL,
        customSystemPrompt: buildSystemPrompt(hist.slice(0, -1)),
      },
    })) {
      if (msg.type === "assistant") {
        for (const block of msg.message.content) {
          if (block.type === "tool_use") {
            emit({ type: "tool_start", id: block.id, name: block.name });
          } else if (block.type === "text" && block.text) {
            reply += block.text;
            emit({ type: "text", content: block.text });
          }
        }
      } else if (msg.type === "user") {
        for (const block of msg.message.content as { type: string; tool_use_id?: string }[]) {
          if (block.type === "tool_result" && block.tool_use_id) {
            emit({ type: "tool_end", id: block.tool_use_id });
          }
        }
      } else if (msg.type === "result") {
        const r = msg as any;
        if (r.subtype === "success" && r.result && !reply) {
          // Fallback: use result text if no streaming text blocks were emitted
          reply = r.result;
          emit({ type: "text", content: r.result });
        } else if (r.subtype === "error_max_turns") {
          emit({ type: "error", message: "The agent reached the maximum number of steps. Try a more specific question." });
        }
      }
    }

    hist.push({ role: "assistant", content: reply });
    emit({ type: "done" });
  } catch (err) {
    emit({ type: "error", message: err instanceof Error ? err.message : String(err) });
  }

  res.end();
});

// ── Session cleanup ───────────────────────────────────────────────────────────

app.delete("/api/session/:id", (req, res) => {
  deleteSession(req.params.id);
  res.json({ ok: true });
});

// ── Start ─────────────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.UI_PORT ?? "3000", 10);
app.listen(PORT, () => {
  console.log(`\n  Finance Agent UI  →  http://localhost:${PORT}\n`);
});
