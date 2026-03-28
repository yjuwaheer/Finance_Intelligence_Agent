import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Project root directory (ai-workshop-project/) */
export const PROJECT_ROOT = path.resolve(__dirname, "../..");

/** Data directory */
export const DATA_DIR = path.join(PROJECT_ROOT, "data");

/** Reports output directory */
export const REPORTS_DIR = path.join(PROJECT_ROOT, "reports");

/** MCP servers directory */
export const MCP_SERVERS_DIR = path.join(PROJECT_ROOT, "mcp-servers");

/** Yahoo Finance MCP server path */
export const YAHOO_FINANCE_MCP_DIR = path.join(MCP_SERVERS_DIR, "yahoo-finance-mcp");

/** MCP server configuration for the Agent SDK */
export const MCP_SERVERS = {
  "yahoo-finance": {
    command: "uv",
    args: ["run", "--directory", YAHOO_FINANCE_MCP_DIR, "python", "server.py"],
    env: {} as Record<string, string>,
  },
  "resend": {
    command: "npx",
    args: ["-y", "resend-mcp"],
    env: {
      RESEND_API_KEY: process.env.RESEND_API_KEY ?? "",
    },
  },
};

/** Get the output path for a report */
export function getReportPath(reportType: string, date?: Date): string {
  const d = date ?? new Date();
  const dateStr = d.toISOString().split("T")[0]; // YYYY-MM-DD
  return path.join(REPORTS_DIR, `${dateStr}-${reportType}.html`);
}

/** Claude model used by all pipeline sub-agents */
export const MODEL = "claude-sonnet-4-6";

/** Maximum agentic turns allowed per pipeline stage */
export const MAX_TURNS = 30;
