/**
 * Canadian Federal and Provincial/Territorial Tax Brackets (2025/2026)
 * Source: CRA, provincial finance ministries
 *
 * Note: These are approximate and should be verified against CRA for the current tax year.
 * Brackets are indexed to inflation annually.
 * Quebec administers its own tax return (TP-1) separately from the federal T1.
 */

export interface TaxBracket {
  min: number;
  max: number | null; // null = no upper limit
  rate: number;
}

export const FEDERAL_BRACKETS_2025: TaxBracket[] = [
  { min: 0,       max: 57375,  rate: 0.15  },
  { min: 57375,   max: 114750, rate: 0.205 },
  { min: 114750,  max: 158468, rate: 0.26  },
  { min: 158468,  max: 221708, rate: 0.29  },
  { min: 221708,  max: null,   rate: 0.33  },
];

/**
 * Provincial/Territorial tax brackets for all 13 provinces and territories.
 * Quebec rates are the provincial portion only (federal abatement of 16.5% applies).
 */
export const PROVINCIAL_BRACKETS_2025: Record<string, TaxBracket[]> = {
  // Ontario
  ON: [
    { min: 0,       max: 52886,  rate: 0.0505 },
    { min: 52886,   max: 105775, rate: 0.0915 },
    { min: 105775,  max: 150000, rate: 0.1116 },
    { min: 150000,  max: 220000, rate: 0.1216 },
    { min: 220000,  max: null,   rate: 0.1316 },
  ],
  // British Columbia
  BC: [
    { min: 0,       max: 47937,  rate: 0.0506 },
    { min: 47937,   max: 95875,  rate: 0.077  },
    { min: 95875,   max: 110076, rate: 0.105  },
    { min: 110076,  max: 133664, rate: 0.1229 },
    { min: 133664,  max: 181232, rate: 0.147  },
    { min: 181232,  max: 252752, rate: 0.168  },
    { min: 252752,  max: null,   rate: 0.205  },
  ],
  // Alberta (flat-ish structure)
  AB: [
    { min: 0,       max: 148269, rate: 0.10 },
    { min: 148269,  max: 177922, rate: 0.12 },
    { min: 177922,  max: 237230, rate: 0.13 },
    { min: 237230,  max: 355845, rate: 0.14 },
    { min: 355845,  max: null,   rate: 0.15 },
  ],
  // Quebec (also files separate provincial TP-1 return)
  QC: [
    { min: 0,       max: 51780,  rate: 0.14   },
    { min: 51780,   max: 103545, rate: 0.19   },
    { min: 103545,  max: 126000, rate: 0.24   },
    { min: 126000,  max: null,   rate: 0.2575 },
  ],
  // Saskatchewan
  SK: [
    { min: 0,       max: 49720,  rate: 0.105 },
    { min: 49720,   max: 142058, rate: 0.125 },
    { min: 142058,  max: null,   rate: 0.145 },
  ],
  // Manitoba
  MB: [
    { min: 0,       max: 47000,  rate: 0.108 },
    { min: 47000,   max: 100000, rate: 0.1275},
    { min: 100000,  max: null,   rate: 0.174 },
  ],
  // Nova Scotia
  NS: [
    { min: 0,       max: 29590,  rate: 0.0879 },
    { min: 29590,   max: 59180,  rate: 0.1495 },
    { min: 59180,   max: 93000,  rate: 0.1667 },
    { min: 93000,   max: 150000, rate: 0.175  },
    { min: 150000,  max: null,   rate: 0.21   },
  ],
  // New Brunswick
  NB: [
    { min: 0,       max: 49958,  rate: 0.094  },
    { min: 49958,   max: 99916,  rate: 0.14   },
    { min: 99916,   max: 185064, rate: 0.16   },
    { min: 185064,  max: null,   rate: 0.195  },
  ],
  // Prince Edward Island
  PE: [
    { min: 0,       max: 32656,  rate: 0.0965 },
    { min: 32656,   max: 64313,  rate: 0.1363 },
    { min: 64313,   max: 105000, rate: 0.1665 },
    { min: 105000,  max: 140000, rate: 0.18   },
    { min: 140000,  max: null,   rate: 0.1875 },
  ],
  // Newfoundland and Labrador
  NL: [
    { min: 0,       max: 43198,  rate: 0.087  },
    { min: 43198,   max: 86395,  rate: 0.145  },
    { min: 86395,   max: 154244, rate: 0.158  },
    { min: 154244,  max: 215943, rate: 0.178  },
    { min: 215943,  max: 275870, rate: 0.198  },
    { min: 275870,  max: 551739, rate: 0.208  },
    { min: 551739,  max: null,   rate: 0.218  },
  ],
  // Northwest Territories
  NT: [
    { min: 0,       max: 50597,  rate: 0.059  },
    { min: 50597,   max: 101198, rate: 0.086  },
    { min: 101198,  max: 164525, rate: 0.122  },
    { min: 164525,  max: null,   rate: 0.1405 },
  ],
  // Yukon
  YT: [
    { min: 0,       max: 57375,  rate: 0.064  },
    { min: 57375,   max: 114750, rate: 0.09   },
    { min: 114750,  max: 500000, rate: 0.109  },
    { min: 500000,  max: null,   rate: 0.15   },
  ],
  // Nunavut
  NU: [
    { min: 0,       max: 53268,  rate: 0.04   },
    { min: 53268,   max: 106537, rate: 0.07   },
    { min: 106537,  max: 173205, rate: 0.09   },
    { min: 173205,  max: null,   rate: 0.115  },
  ],
};

/** Full province/territory names for display */
export const PROVINCE_NAMES: Record<string, string> = {
  ON: "Ontario",
  BC: "British Columbia",
  AB: "Alberta",
  QC: "Quebec",
  SK: "Saskatchewan",
  MB: "Manitoba",
  NS: "Nova Scotia",
  NB: "New Brunswick",
  PE: "Prince Edward Island",
  NL: "Newfoundland and Labrador",
  NT: "Northwest Territories",
  YT: "Yukon",
  NU: "Nunavut",
};

/** Provincial health insurance program names and wait periods */
export const PROVINCIAL_HEALTH_INSURANCE: Record<string, { name: string; waitPeriod: string }> = {
  ON: { name: "OHIP",  waitPeriod: "3 months from establishing Ontario residency" },
  BC: { name: "MSP",   waitPeriod: "Remainder of arrival month + 2 full months" },
  AB: { name: "AHCIP", waitPeriod: "First day of 3rd month after establishing residency" },
  QC: { name: "RAMQ",  waitPeriod: "3 months (some exceptions for certain immigrants)" },
  SK: { name: "Saskatchewan Health",  waitPeriod: "3 months" },
  MB: { name: "Manitoba Health",      waitPeriod: "3 months" },
  NS: { name: "MSI",   waitPeriod: "3 months" },
  NB: { name: "New Brunswick Medicare", waitPeriod: "3 months" },
  PE: { name: "PEI Health",  waitPeriod: "3 months" },
  NL: { name: "MCP",   waitPeriod: "Immediate for new immigrants with valid status" },
  NT: { name: "NWT Health Care Plan", waitPeriod: "3 months" },
  YT: { name: "Yukon Health Care Insurance Plan", waitPeriod: "3 months" },
  NU: { name: "Nunavut Health Care Plan", waitPeriod: "3 months" },
};

/** Capital gains inclusion rates (as of June 25, 2024 changes) */
export const CAPITAL_GAINS = {
  /** For individuals: 50% on first $250K of net capital gains per year */
  individualRate: 0.50,
  individualThreshold: 250000,
  /** Above $250K: 66.67% inclusion rate */
  aboveThresholdRate: 2 / 3,
  /** For corporations and trusts: 66.67% on all capital gains */
  corporateRate: 2 / 3,
};

/** Canadian dividend tax credit rates (2025) */
export const DIVIDEND_TAX_CREDIT = {
  eligible: {
    grossUpRate: 0.38,
    federalCredit: 0.150198,
    description: "For dividends from Canadian public corporations (higher credit)",
  },
  nonEligible: {
    grossUpRate: 0.15,
    federalCredit: 0.090301,
    description: "For dividends from Canadian-controlled private corporations (lower credit)",
  },
};

/**
 * Calculate marginal tax rate for a given province and income.
 * Returns null for provincial rate if province is unknown — do NOT silently default to Ontario.
 */
export function getMarginalRate(
  income: number,
  province: string
): { federal: number; provincial: number | null; combined: number | null; provinceKnown: boolean } {
  const fedBracket = FEDERAL_BRACKETS_2025.findLast(b => income > b.min) ?? FEDERAL_BRACKETS_2025[0];
  const provBrackets = PROVINCIAL_BRACKETS_2025[province.toUpperCase()];

  if (!provBrackets) {
    return {
      federal: fedBracket.rate,
      provincial: null,
      combined: null,
      provinceKnown: false,
    };
  }

  const provBracket = provBrackets.findLast(b => income > b.min) ?? provBrackets[0];
  return {
    federal: fedBracket.rate,
    provincial: provBracket.rate,
    combined: fedBracket.rate + provBracket.rate,
    provinceKnown: true,
  };
}
