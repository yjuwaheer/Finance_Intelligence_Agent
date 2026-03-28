// ─────────────────────────────────────────────────────────────────────────────
// lib/data.ts — JSON data file I/O + holdings sync
//
// All reads and writes to data/*.json go through readData/writeData.
// syncHoldingsFromTrade keeps holdings.json consistent whenever a trade is
// recorded through the UI (weighted-average ACB on buys, quantity reduction
// on sells).
// ─────────────────────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

/** Files in data/ that hold arrays (as opposed to the single-object profile.json). */
export const ARRAY_FILES = [
  "holdings.json",
  "watchlist.json",
  "transactions.json",
  "properties.json",
  "trades.json",
] as const;

// ── File I/O ──────────────────────────────────────────────────────────────────

export function readData(file: string): unknown {
  const p = path.join(ROOT, "data", file);
  return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : null;
}

export function writeData(file: string, data: unknown): void {
  const p = path.join(ROOT, "data", file);
  writeFileSync(p, JSON.stringify(data, null, 2), "utf8");
}

// ── Holdings sync ─────────────────────────────────────────────────────────────

/**
 * Keeps holdings.json in sync after a trade is recorded.
 *
 * Buy:  adds the position or updates quantity + weighted-average ACB.
 * Sell: reduces quantity or removes the position entirely.
 */
export function syncHoldingsFromTrade(trade: Record<string, unknown>): void {
  const holdings = (readData("holdings.json") ?? []) as Record<string, unknown>[];
  const symbol   = String(trade.symbol  ?? "");
  const account  = String(trade.account ?? "");
  const qty      = Number(trade.quantity ?? 0);
  const price    = Number(trade.price    ?? 0);
  const idx      = holdings.findIndex(h => h.symbol === symbol && h.account === account);

  if (trade.action === "buy") {
    if (idx >= 0) {
      const h       = holdings[idx];
      const prevQty = Number(h.quantity   ?? 0);
      const prevAcb = Number(h.cost_basis ?? 0);
      holdings[idx] = {
        ...h,
        quantity:   prevQty + qty,
        cost_basis: ((prevAcb * prevQty) + (price * qty)) / (prevQty + qty),
      };
    } else {
      holdings.push({
        symbol,
        asset_type:    "stock",
        quantity:      qty,
        cost_basis:    price,
        purchase_date: String(trade.date     ?? ""),
        account,
        currency:      String(trade.currency ?? "CAD"),
        notes:         String(trade.notes    ?? ""),
      });
    }
    writeData("holdings.json", holdings);

  } else if (trade.action === "sell") {
    if (idx >= 0) {
      const newQty = Number(holdings[idx].quantity ?? 0) - qty;
      if (newQty <= 0) {
        holdings.splice(idx, 1);
      } else {
        holdings[idx] = { ...holdings[idx], quantity: newQty };
      }
      writeData("holdings.json", holdings);
    }
  }
}
