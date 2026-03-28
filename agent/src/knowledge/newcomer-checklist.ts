/**
 * Financial Setup Checklist for Newcomers to Canada
 * Step-by-step guide for immigrants, PRs, and international students
 */

export const NEWCOMER_CHECKLIST = {
  title: "Financial Setup Guide for Newcomers to Canada",

  steps: [
    {
      order: 1,
      title: "Get your Social Insurance Number (SIN)",
      timeline: "Within first week",
      details: [
        "Required for working, filing taxes, and opening registered accounts (TFSA, RRSP)",
        "Apply at Service Canada office with immigration documents",
        "Available same-day in person, or by mail (takes ~4 weeks)",
        "Keep your SIN confidential — never share it unnecessarily",
      ],
    },
    {
      order: 2,
      title: "Open a Canadian bank account",
      timeline: "Within first week",
      details: [
        "Big 5 banks: RBC, TD, Scotiabank, BMO, CIBC — all have newcomer programs",
        "Most newcomer programs waive monthly fees for the first year",
        "You can open an account before arriving (some banks allow it from abroad)",
        "Consider a no-fee bank as well: Tangerine, Simplii Financial, EQ Bank, Wealthsimple Cash",
        "You'll need: passport, immigration documents (PR card, work permit, study permit), proof of address",
      ],
    },
    {
      order: 3,
      title: "Get a secured credit card to build credit",
      timeline: "Month 1",
      details: [
        "Canada uses credit scores (Equifax and TransUnion), starting from scratch as a newcomer",
        "Secured credit cards require a deposit (e.g., $500-$1000) as collateral",
        "Options: Home Trust Secured Visa, Capital One Secured Mastercard",
        "Some banks offer unsecured cards to newcomers: CIBC, Scotiabank, BMO newcomer programs",
        "Use the card for small regular purchases and pay the FULL balance every month",
        "Credit score takes 6-12 months to build from zero",
        "Target: 650+ score within 12 months, 700+ within 18-24 months",
      ],
    },
    {
      order: 4,
      title: "Register for provincial/territorial health insurance",
      timeline: "Month 1",
      details: [
        "Each province and territory has its own health insurance plan — register as soon as you establish residency",
        "Most provinces have a waiting period of up to 3 months — get private health insurance to cover the gap",
        "Your employer may provide interim coverage — check before purchasing private insurance",
        "See PROVINCIAL_HEALTH_INSURANCE in tax-brackets.ts for your province's specific plan name and wait period",
        "Quebec (RAMQ) has slightly different rules for certain immigration categories — verify with RAMQ directly",
        "Newfoundland and Labrador (MCP) offers immediate coverage for new immigrants in some cases",
      ],
    },
    {
      order: 5,
      title: "Open a TFSA (Tax-Free Savings Account)",
      timeline: "Month 1-2 (after getting SIN)",
      details: [
        "TFSA room starts accumulating from the year you become a Canadian resident (and are 18+)",
        "If you arrived mid-year, you get the FULL year's contribution room for that year",
        "Example: arrived June 2022 → TFSA room = 2022 ($6,000) + 2023 ($6,500) + 2024 ($7,000) + 2025 ($7,000) = $26,500",
        "You do NOT get retroactive room from 2009-2021 — only from your residency year forward",
        "Contributions are NOT tax-deductible (unlike RRSP), but all growth and withdrawals are TAX-FREE",
        "Good choice for newcomers who don't yet know their long-term tax bracket",
      ],
    },
    {
      order: 6,
      title: "Understand your tax filing obligations",
      timeline: "First tax season (February-April)",
      details: [
        "You MUST file a tax return for the year you became a Canadian resident",
        "File even if you had NO Canadian income — this unlocks government benefits",
        "Benefits you'll receive after filing: GST/HST credit ($500+/year), Canada Child Benefit (if applicable)",
        "Tax year = calendar year (Jan 1 - Dec 31), filing deadline = April 30",
        "Report worldwide income earned while a Canadian resident",
        "Foreign assets >$100,000 CAD must be reported on form T1135",
        "Consider using free tax software: Wealthsimple Tax, TurboTax (free for simple returns)",
      ],
    },
    {
      order: 7,
      title: "Consider RRSP contributions (if income is stable)",
      timeline: "After first year with Canadian income",
      details: [
        "RRSP contribution room = 18% of prior year's earned income (up to annual max)",
        "Contributions are tax-deductible — reduces your taxable income",
        "Best strategy: contribute to RRSP when in a HIGH tax bracket, withdraw in retirement when in a LOWER bracket",
        "If your income is modest (<$50K), TFSA may be better than RRSP — no benefit from the tax deduction at a low rate",
        "If your employer offers RRSP matching, ALWAYS contribute enough to get the full match — it's free money",
        "Keep US dividend stocks in RRSP (exempt from US withholding tax under treaty)",
      ],
    },
    {
      order: 8,
      title: "Consider FHSA if planning to buy a first home",
      timeline: "When planning to buy within 15 years",
      details: [
        "First Home Savings Account — combines RRSP (tax-deductible) and TFSA (tax-free growth) benefits",
        "Contribute up to $8,000/year, $40,000 lifetime",
        "Unused room carries forward (max $8,000 carry-forward)",
        "Can combine with RRSP Home Buyers' Plan for maximum down payment tax benefit",
        "If you don't buy a home, can transfer to RRSP without using RRSP room",
        "Open one as soon as possible to start the 15-year clock, even with a small initial deposit",
      ],
    },
    {
      order: 9,
      title: "Set up an emergency fund",
      timeline: "Ongoing — target 3-6 months of expenses",
      details: [
        "High-interest savings account (HISA) options: EQ Bank, Wealthsimple Cash, Tangerine, Neo Financial",
        "Keep in TFSA if you have room, otherwise use a regular HISA",
        "Target: 3 months expenses if employed with stable job, 6 months if self-employed or variable income",
        "Can also use GICs for a portion (higher rate but locked in)",
      ],
    },
    {
      order: 10,
      title: "Start investing",
      timeline: "After emergency fund is established",
      details: [
        "Low-cost index ETFs are the standard recommendation for most Canadians",
        "All-in-one ETFs: XEQT (100% equity), XGRO (80/20), XBAL (60/40), VGRO, VBAL",
        "Canadian discount brokerages: Wealthsimple (no commissions), Questrade, Interactive Brokers",
        "Prioritize accounts: employer match RRSP → TFSA → FHSA → RRSP → non-registered",
        "Keep US dividend stocks in RRSP (withholding tax exempt under treaty)",
        "Keep Canadian dividend stocks in non-registered (eligible dividend tax credit)",
        "Keep growth stocks (no dividends) in TFSA (tax-free capital gains)",
      ],
    },
  ],
};
