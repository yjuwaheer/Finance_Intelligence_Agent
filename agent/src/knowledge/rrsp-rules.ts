/**
 * RRSP Rules and Limits - Canadian Registered Retirement Savings Plan
 * Source: CRA
 */

export const RRSP_RULES = {
  /** RRSP contribution = 18% of prior year earned income, up to the annual max */
  contributionRate: 0.18,

  /** Annual maximums by year */
  annualMaximums: {
    2023: 30780,
    2024: 31560,
    2025: 32490,
    2026: 33390, // projected
  } as Record<number, number>,

  /** Contribution deadline: first 60 days of the following year */
  deadlineRule: "First 60 days of the calendar year (for prior year deduction)",

  /** Over-contribution: $2,000 lifetime buffer before penalties */
  overContributionBuffer: 2000,
  overContributionPenalty: "1% per month on excess amount above $2,000 buffer",

  /** Home Buyers' Plan (HBP) */
  hbp: {
    maxWithdrawal: 60000, // increased from $35,000 in 2024
    repaymentPeriod: 15, // years
    repaymentStartYear: 2, // starts 2nd year after withdrawal
    eligibility: "First-time home buyer (not owned home in last 4 years or spouse's home in last 4 years)",
    canCombineWithFHSA: true,
  },

  /** Lifelong Learning Plan (LLP) */
  llp: {
    maxWithdrawal: 10000, // per year
    totalMax: 20000,
    repaymentPeriod: 10, // years
    eligibility: "Full-time education at a qualifying institution",
  },

  /** Spousal RRSP attribution rule */
  spousalAttribution: "3 calendar year rule - withdrawals from spousal RRSP attributed back to contributor if withdrawn within 3 calendar years of contribution",

  /** RRSP to RRIF conversion deadline */
  rrifConversionDeadline: "December 31 of the year you turn 71",
};

/**
 * US Withholding Tax in RRSP
 * Under the Canada-US Tax Treaty, US dividends in an RRSP are EXEMPT from 15% withholding tax.
 * This makes RRSP the optimal account for holding US dividend-paying stocks.
 */
export const US_WITHHOLDING_TAX = {
  rrsp: { rate: 0, note: "Exempt under Canada-US Tax Treaty Article XXI" },
  tfsa: { rate: 0.15, note: "NOT exempt - 15% withheld, not recoverable" },
  resp: { rate: 0.15, note: "NOT exempt - 15% withheld, not recoverable" },
  fhsa: { rate: 0.15, note: "NOT exempt - 15% withheld, not recoverable" },
  non_registered: { rate: 0.15, note: "15% withheld, claimable as foreign tax credit on T1" },
};
