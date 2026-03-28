/**
 * TFSA Annual Contribution Limits by Year
 * Source: CRA - https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/tax-free-savings-account/contributions.html
 *
 * TFSA room accumulates from age 18 AND the year the individual became a Canadian resident.
 * For newcomers: room starts accumulating from the year they became a resident, NOT retroactively.
 */

export const TFSA_ANNUAL_LIMITS: Record<number, number> = {
  2009: 5000,
  2010: 5000,
  2011: 5000,
  2012: 5000,
  2013: 5500,
  2014: 5500,
  2015: 10000,
  2016: 5500,
  2017: 5500,
  2018: 5500,
  2019: 6000,
  2020: 6000,
  2021: 6000,
  2022: 6000,
  2023: 6500,
  2024: 7000,
  2025: 7000,
  2026: 7000, // projected, confirm with CRA
};

/**
 * Calculate cumulative TFSA room from a given start year to current year.
 * For newcomers, startYear = year they became a Canadian resident (and were 18+).
 */
export function calculateTFSARoom(startYear: number, currentYear: number = new Date().getFullYear()): number {
  let total = 0;
  for (let year = startYear; year <= currentYear; year++) {
    total += TFSA_ANNUAL_LIMITS[year] ?? 0;
  }
  return total;
}

/**
 * Maximum cumulative TFSA room for someone who has been eligible since 2009.
 */
export function maxTFSARoom(currentYear: number = new Date().getFullYear()): number {
  return calculateTFSARoom(2009, currentYear);
}
