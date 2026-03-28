---
triggers:
  - "tax deadline"
  - "tax calendar"
  - "upcoming deadlines"
  - "when is RRSP deadline"
  - "tax filing deadline"
  - "when do I file taxes"
  - "installment payment"
  - "tax dates"
  - "important dates"
---

# Canadian Tax Calendar

Show upcoming Canadian tax deadlines and important financial dates.

## Instructions

1. Read `data/profile.json` to understand the user's situation (self-employed? has RRIF?)
2. Reference `agent/src/knowledge/tax-calendar.ts` for the full list of deadlines
3. Calculate which deadlines are coming up in the next 30-60 days
4. Highlight the most urgent ones (priority: critical)
5. Tailor to the user's situation:
   - Skip self-employed deadlines if the user is employed
   - Skip RRIF deadlines if user is not 71+
   - Include installment payment dates if user likely owes >$3,000 in taxes

## Key Dates Reference

- **January 1** — TFSA/FHSA contribution room resets
- **~March 1** — RRSP contribution deadline (60 days into new year)
- **March 15** — First quarterly installment
- **April 30** — T1 filing deadline + tax payment deadline
- **June 15** — Self-employed filing deadline (but payment still due April 30!)
- **June 15** — Second quarterly installment
- **July 1** — New benefit year (GST/HST credit, CCB recalculated)
- **September 15** — Third quarterly installment
- **December 15** — Fourth quarterly installment
- **December 31** — Tax-loss selling deadline (superficial loss 30-day rule applies)
- **December 31** — RRIF minimum withdrawal deadline

## Output Format
Present as a clean timeline showing:
- Date
- Deadline name
- Priority (critical/important/informational)
- Days until deadline
- Brief actionable note
