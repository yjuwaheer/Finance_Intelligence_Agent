# Eval Criteria: Canadian Finance Advisor

Each criterion is answered yes/no per output.
Score = passes / (N outputs × criteria count).

## Criteria

1. **Disclaimer present** — Does the response end with (or include) a clear disclaimer stating this is educational information and not professional financial advice? (exact phrase not required — substance matters)

2. **Canadian terminology only** — Does the response use CRA, Income Tax Act, TFSA, RRSP, FHSA terminology exclusively? Fails if "IRS", "IRC", "401k", "Roth IRA", or other US-specific terms appear without being explicitly contrasted with the Canadian equivalent.

3. **Specific numbers cited** — Does the response include at least one concrete number relevant to the question (e.g. a dollar limit, a percentage rate, a contribution cap, a specific year) rather than giving only vague general advice?

4. **Profile-aware** — Does the response reference or use the user's actual profile context (province, residency status, income bracket, or contribution room) rather than giving completely generic advice that could apply to any Canadian? Acceptable even if it correctly notes that a profile field is not set and asks for it.

5. **Follow-up offered** — For substantive advisory responses (not one-line factual answers), does the response offer to email the results to the user?

## Test Queries

- Q1: "Should I contribute to my RRSP or TFSA this year? I want to maximize my tax efficiency."
- Q2: "I just arrived in Canada 6 months ago. What should I do first financially?"
- Q3: "How does the FHSA work? Can I combine it with the Home Buyers' Plan?"
- Q4: "What are the capital gains inclusion rates in Canada?"
- Q5: "How does US withholding tax work differently in my RRSP vs TFSA?"

## Scoring

Each cell = criteria passes for that query (out of 5). Maximum per run: 25 (5 queries × 5 criteria).

| Run | Q1 | Q2 | Q3 | Q4 | Q5 | Total |
|-----|----|----|----|----|----|-------|
| Baseline | 5/5 | 4/5 | 5/5 | 5/5 | 5/5 | 24/25 (96%) |
| After mutation | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 | 25/25 (100%) |

Pass = 1, Fail = 0.

### Baseline failure

**Q2 × Criterion 4 (Profile-aware):** The query states "I just arrived in Canada 6 months ago." The baseline skill had no instruction to prefer `profile.json` values over user-stated claims. The agent accepted the claim at face value and calculated TFSA room as if arrival were September 2025, totalling $14,000 — but the profile has `arrival_date: "2022-06-15"` and `tfsa_contribution_room: 34000`. The calculated figures were wrong.

### Mutation applied

Added to step 1 of the Instructions section in `canadian-finance-advisor.md`:

> Profile data takes priority over user-stated claims. If the user states facts that conflict with profile.json values (e.g. "I just arrived in Canada" when `arrival_date` shows an older date, or contribution room amounts that differ from the profile values), use the profile data for all calculations. Gently note the discrepancy: "Your profile shows your arrival date as [X] — I'll use that for the calculations below. If this is incorrect, you can update it in the Manage Data page."

### Post-mutation result

Q2 now opens with: *"Your profile shows your arrival date as June 15, 2022 — so you have been in Canada for approximately 3.75 years, not 6 months. I will use your profile data for all calculations below."* All profile values ($34,000 TFSA room, $28,000 RRSP room) used correctly. Score: 5/5.
