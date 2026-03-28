// ─────────────────────────────────────────────────────────────────────────────
// lib/ticker.ts — Live price fetching + server-side cache
//
// Fetches prices by running a short Python script in the yahoo-finance-mcp venv
// via `uv run`. This bypasses MCP and the LLM entirely — zero Claude tokens.
//
// The cache is module-level so it survives across requests and resets cleanly
// when watchlist data changes (routes call invalidateTickerCache()).
// ─────────────────────────────────────────────────────────────────────────────

import { execFile }      from "child_process";
import { promisify }     from "util";
import { fileURLToPath } from "url";
import path              from "path";
import { readData }      from "./data.js";

const execFileAsync = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export const TICKER_TTL_MS = 2 * 60 * 1000; // 2-minute cache lifetime

export type TickerItem = {
  symbol:        string;
  price:         number | null;
  changePercent: number | null;
  alertState:    "triggered" | "near" | null;
};

let tickerCache: { data: TickerItem[]; ts: number } | null = null;

/** Clears the cache so the next /api/ticker request fetches fresh data. */
export function invalidateTickerCache(): void {
  tickerCache = null;
}

// ── Price fetching ────────────────────────────────────────────────────────────

type RawPrice = { symbol: string; price: number | null; changePercent: number | null };

/**
 * Fetches current price + day-change % for each symbol using yfinance.
 * Runs an inline Python script in the existing yahoo-finance-mcp venv.
 */
async function fetchTickerPrices(symbols: string[]): Promise<RawPrice[]> {
  const script = `
import sys, json
try:
    import yfinance as yf
    result = []
    for sym in sys.argv[1:]:
        try:
            fi    = yf.Ticker(sym).fast_info
            price = fi.last_price
            prev  = getattr(fi, 'regular_market_previous_close', None) or getattr(fi, 'previous_close', None)
            pct   = ((price - prev) / prev * 100) if (price and prev) else None
            result.append({
                'symbol':        sym,
                'price':         round(float(price), 2) if price else None,
                'changePercent': round(float(pct),   2) if pct is not None else None,
            })
        except Exception:
            result.append({'symbol': sym, 'price': None, 'changePercent': None})
    print(json.dumps(result))
except Exception:
    print(json.dumps([]))
`;
  try {
    const { stdout } = await execFileAsync(
      "uv",
      ["run", "--directory", path.join(ROOT, "mcp-servers", "yahoo-finance-mcp"),
       "python", "-c", script, ...symbols],
      { timeout: 20_000 },
    );
    return JSON.parse(stdout.trim()) as RawPrice[];
  } catch {
    return symbols.map(s => ({ symbol: s, price: null, changePercent: null }));
  }
}

// ── Public cache-aware getter ─────────────────────────────────────────────────

/**
 * Returns enriched ticker data for the current watchlist.
 * Serves from cache when fresh; otherwise fetches and caches.
 */
export async function getTickerData(): Promise<TickerItem[]> {
  if (tickerCache && Date.now() - tickerCache.ts < TICKER_TTL_MS) {
    return tickerCache.data;
  }

  const watchlist = (readData("watchlist.json") ?? []) as Record<string, unknown>[];
  if (!watchlist.length) return [];

  const symbols = watchlist.map(w => String(w.symbol));
  const prices  = await fetchTickerPrices(symbols);

  const data: TickerItem[] = prices.map(p => {
    const w = watchlist.find(w => String(w.symbol) === p.symbol);
    let alertState: TickerItem["alertState"] = null;
    if (w && p.price != null) {
      const target    = Number(w.target_price);
      const cond      = String(w.alert_condition ?? "");
      const triggered = (cond === "below" && p.price <= target) ||
                        (cond === "above" && p.price >= target);
      const near      = !triggered && Math.abs(p.price - target) / target <= 0.03;
      alertState = triggered ? "triggered" : near ? "near" : null;
    }
    return { symbol: p.symbol, price: p.price, changePercent: p.changePercent, alertState };
  });

  tickerCache = { data, ts: Date.now() };
  return data;
}
