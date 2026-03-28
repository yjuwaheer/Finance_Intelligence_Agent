/**
 * FHSA Rules - First Home Savings Account
 * Available since April 1, 2023
 * Source: CRA
 */

export const FHSA_RULES = {
  /** Annual contribution limit */
  annualLimit: 8000,

  /** Lifetime contribution limit */
  lifetimeLimit: 40000,

  /** Maximum carry-forward of unused room */
  maxCarryForward: 8000, // can only carry forward up to $8,000 of unused room

  /** Account must be closed within this many years of opening */
  maxAccountLifespan: 15,

  /** Must be closed by December 31 of the year you turn this age */
  maxAge: 71,

  eligibility: {
    /** Must be a Canadian resident */
    residency: "Canadian resident",
    /** Must be at least 18 (or age of majority in province) */
    minimumAge: 18,
    /** Must be a first-time home buyer */
    firstTimeHomeBuyer: "Did not live in a home owned by you or your spouse in the current year or any of the preceding 4 calendar years",
  },

  /** Tax treatment */
  tax: {
    contributions: "Tax-deductible (like RRSP)",
    growth: "Tax-free (like TFSA)",
    qualifyingWithdrawal: "Tax-free when used to buy a first home",
    nonQualifyingWithdrawal: "Taxable as income",
  },

  /** Can transfer to RRSP without affecting RRSP room */
  rrspTransfer: "Can transfer FHSA to RRSP/RRIF without using RRSP contribution room (useful if you don't end up buying a home)",

  /** Can combine with HBP */
  canCombineWithHBP: true,
  combinedNote: "You can use both FHSA withdrawal AND RRSP HBP withdrawal for the same home purchase",

  /** Qualifying home purchase */
  qualifyingWithdrawal: {
    mustBeCanadianResident: true,
    writtenAgreement: "Must have a written agreement to buy or build a qualifying home before October 1 of the year following withdrawal",
    firstTimeBuyer: "Must be first-time home buyer at time of withdrawal",
  },
};
