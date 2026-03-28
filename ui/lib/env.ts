// ─────────────────────────────────────────────────────────────────────────────
// lib/env.ts — .env file loader
//
// Reads key=value pairs from the project root's .env file into process.env.
// Called once at server startup before any other code reads env vars.
// ─────────────────────────────────────────────────────────────────────────────

import { readFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export function loadEnv(): void {
  const p = path.join(ROOT, ".env");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const idx = t.indexOf("=");
    if (idx < 0) continue;
    const key = t.slice(0, idx).trim();
    const val = t.slice(idx + 1).trim().replace(/^["'](.*)["']$/, "$1");
    if (!process.env[key]) process.env[key] = val;
  }
}
