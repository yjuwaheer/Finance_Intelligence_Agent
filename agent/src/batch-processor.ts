#!/usr/bin/env tsx

/**
 * Personal Finance Intelligence Agent - Batch Processor
 *
 * Orchestrates 5 sub-agents in sequence using the Claude Agent SDK:
 * 1. Market Data Collection — fetches live prices via Yahoo Finance MCP
 * 2. Portfolio Analysis — calculates performance, allocations, tax opportunities
 * 3. Expense Analysis — categorizes transactions, flags anomalies
 * 4. Canadian Advisory — generates contextual tips, deadlines, optimization suggestions
 * 5. Report Generation — produces a self-contained HTML report
 *
 * Usage:
 *   npx tsx agent/src/batch-processor.ts --report daily
 *   npx tsx agent/src/batch-processor.ts --report weekly
 *   npx tsx agent/src/batch-processor.ts --report monthly
 */

import { query } from "@anthropic-ai/claude-code";
import { PROJECT_ROOT, MCP_SERVERS, MODEL, MAX_TURNS, getReportPath } from "./config.js";
import { MARKET_DATA_PROMPT } from "./prompts/market-data.js";
import { PORTFOLIO_ANALYSIS_PROMPT } from "./prompts/portfolio-analysis.js";
import { EXPENSE_ANALYSIS_PROMPT } from "./prompts/expense-analysis.js";
import { CANADIAN_ADVISOR_PROMPT } from "./prompts/canadian-advisor.js";
import { getReportGenerationPrompt } from "./prompts/report-generation.js";

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const reportFlagIndex = args.indexOf("--report");
const reportType = reportFlagIndex !== -1 ? args[reportFlagIndex + 1] : "daily";

if (!["daily", "weekly", "monthly"].includes(reportType)) {
  console.error(`Invalid report type: "${reportType}". Use: daily, weekly, or monthly`);
  process.exit(1);
}

const reportPath = getReportPath(reportType);

// ---------------------------------------------------------------------------
// Pipeline stages
// ---------------------------------------------------------------------------
interface Stage {
  name: string;
  prompt: string;
}

const stages: Stage[] = [
  {
    name: "Stage 1: Market Data Collection",
    prompt: MARKET_DATA_PROMPT,
  },
  {
    name: "Stage 2: Portfolio Analysis",
    prompt: PORTFOLIO_ANALYSIS_PROMPT,
  },
  {
    name: "Stage 3: Expense Analysis",
    prompt: EXPENSE_ANALYSIS_PROMPT,
  },
  {
    name: "Stage 4: Canadian Advisory",
    prompt: CANADIAN_ADVISOR_PROMPT,
  },
  {
    name: "Stage 5: Report Generation",
    prompt: getReportGenerationPrompt(reportType, reportPath),
  },
];

// ---------------------------------------------------------------------------
// Run a single sub-agent stage
// ---------------------------------------------------------------------------
async function runStage(stage: Stage): Promise<void> {
  const response = query({
    prompt: stage.prompt,
    options: {
      cwd: PROJECT_ROOT,
      permissionMode: "bypassPermissions",
      mcpServers: MCP_SERVERS,
      maxTurns: MAX_TURNS,
      model: MODEL,
    },
  });

  // Consume the async generator to completion.
  // Each sub-agent writes its output to data/_*.json files; we don't need the stream messages.
  for await (const _message of response) { /* consumed */ }
}

// ---------------------------------------------------------------------------
// Main execution
// ---------------------------------------------------------------------------
async function runPipeline() {
  console.log(`\n╔══════════════════════════════════════════════════════╗`);
  console.log(`║  Personal Finance Intelligence Agent                 ║`);
  console.log(`║  Generating ${reportType.padEnd(8)} report...                    ║`);
  console.log(`╚══════════════════════════════════════════════════════╝\n`);

  const startTime = Date.now();

  for (const stage of stages) {
    const stageStart = Date.now();
    console.log(`▶ ${stage.name}...`);

    try {
      await runStage(stage);
      const elapsed = ((Date.now() - stageStart) / 1000).toFixed(1);
      console.log(`  ✓ Done (${elapsed}s)\n`);
    } catch (error) {
      console.error(`  ✗ ${stage.name} failed:`, error);
      console.error(`  Continuing to next stage...\n`);
    }
  }

  const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`═══════════════════════════════════════════════════════`);
  console.log(`Report generated: ${reportPath}`);
  console.log(`Total time: ${totalElapsed}s`);
  console.log(`Open in browser: open "${reportPath}"`);
  console.log(`═══════════════════════════════════════════════════════\n`);
}

runPipeline().catch((err) => {
  console.error("Pipeline failed:", err);
  process.exit(1);
});
