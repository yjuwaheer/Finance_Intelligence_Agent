/**
 * Canadian Tax Calendar - Key Dates and Deadlines
 * Used by the Canadian Tax Calendar skill to surface upcoming deadlines
 */

export interface TaxDeadline {
  /** Month (1-12) */
  month: number;
  /** Day of month */
  day: number;
  /** Title of the deadline */
  title: string;
  /** Detailed description */
  description: string;
  /** Who this applies to */
  applicableTo: string;
  /** Priority: how important this is */
  priority: "critical" | "important" | "informational";
}

export const TAX_CALENDAR: TaxDeadline[] = [
  {
    month: 1,
    day: 1,
    title: "TFSA/FHSA Contribution Room Resets",
    description: "New TFSA contribution room ($7,000 for 2025/2026) and FHSA room ($8,000) becomes available. Withdrawals from TFSA in the prior year also restore room.",
    applicableTo: "All Canadian residents 18+",
    priority: "important",
  },
  {
    month: 1,
    day: 30,
    title: "T4/T5 Slips Issued by Employers/Financial Institutions",
    description: "Employers must issue T4 slips; banks/brokerages issue T5 (investment income) and T3 (trust income) slips by end of February, but some arrive in January.",
    applicableTo: "All taxpayers",
    priority: "informational",
  },
  {
    month: 3,
    day: 1,
    title: "RRSP Contribution Deadline (approximate)",
    description: "Last day to contribute to RRSP for prior tax year deduction. Exact date is 60 days into the new year (March 1 or March 2 in leap years).",
    applicableTo: "Anyone with RRSP contribution room",
    priority: "critical",
  },
  {
    month: 3,
    day: 15,
    title: "First Quarterly Tax Installment",
    description: "If you owe $3,000+ in taxes (federal) or $1,800+ (Quebec), you may need to pay quarterly installments.",
    applicableTo: "Self-employed, investors with significant income outside employment",
    priority: "important",
  },
  {
    month: 4,
    day: 30,
    title: "Personal Tax Return Filing Deadline (T1)",
    description: "Deadline to file your personal income tax return for the prior year. Also the deadline to pay any balance owing (interest charges begin May 1).",
    applicableTo: "All Canadian residents",
    priority: "critical",
  },
  {
    month: 6,
    day: 15,
    title: "Self-Employed Tax Filing Deadline",
    description: "Extended filing deadline for self-employed individuals (and their spouses). However, any tax OWING is still due April 30 — only the filing is extended.",
    applicableTo: "Self-employed individuals",
    priority: "critical",
  },
  {
    month: 6,
    day: 15,
    title: "Second Quarterly Tax Installment",
    description: "Second quarterly installment payment due.",
    applicableTo: "Those required to pay installments",
    priority: "important",
  },
  {
    month: 7,
    day: 1,
    title: "GST/HST Credit and CCB Recalculation",
    description: "New benefit year begins. GST/HST credit and Canada Child Benefit amounts recalculated based on prior year tax return.",
    applicableTo: "Eligible Canadians (file your taxes to receive!)",
    priority: "informational",
  },
  {
    month: 9,
    day: 15,
    title: "Third Quarterly Tax Installment",
    description: "Third quarterly installment payment due.",
    applicableTo: "Those required to pay installments",
    priority: "important",
  },
  {
    month: 12,
    day: 15,
    title: "Fourth Quarterly Tax Installment",
    description: "Final quarterly installment payment due for the current tax year.",
    applicableTo: "Those required to pay installments",
    priority: "important",
  },
  {
    month: 12,
    day: 31,
    title: "Tax-Loss Selling Deadline",
    description: "Last trading day to sell securities and realize capital losses for the current tax year (settlement takes T+1). Remember the superficial loss rule: cannot repurchase the same security within 30 days.",
    applicableTo: "Investors in non-registered accounts",
    priority: "important",
  },
  {
    month: 12,
    day: 31,
    title: "RRIF Minimum Withdrawal Deadline",
    description: "Must take minimum RRIF withdrawal by year end. Also the deadline for RRSP-to-RRIF conversion in the year you turn 71.",
    applicableTo: "RRIF holders, individuals turning 71",
    priority: "critical",
  },
];

/**
 * Get upcoming deadlines within the next N days
 */
export function getUpcomingDeadlines(daysAhead: number = 30): (TaxDeadline & { daysUntil: number })[] {
  const now = new Date();
  const currentYear = now.getFullYear();

  return TAX_CALENDAR
    .map(deadline => {
      const deadlineDate = new Date(currentYear, deadline.month - 1, deadline.day);
      // If deadline has passed this year, look at next year
      if (deadlineDate < now) {
        deadlineDate.setFullYear(currentYear + 1);
      }
      const daysUntil = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return { ...deadline, daysUntil };
    })
    .filter(d => d.daysUntil <= daysAhead && d.daysUntil >= 0)
    .sort((a, b) => a.daysUntil - b.daysUntil);
}
