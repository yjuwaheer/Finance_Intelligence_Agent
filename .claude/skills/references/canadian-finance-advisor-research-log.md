# Research Log: Canadian Finance Advisor Skill — Autoresearch (Week 7 Lab 1)

**Date:** 2026-03-19
**Skill under test:** `.claude/skills/canadian-finance-advisor.md`
**Eval file:** `.claude/skills/canadian-finance-advisor-evals.md`
**Method:** Binary evals with parallel sub-agents

---

## Why This Skill

The Canadian Finance Advisor handles the most nuanced, facts-sensitive work in the system. Errors here (wrong TFSA room, wrong arrival date, US tax terminology) could mislead users on real financial decisions. It was the highest-stakes skill to validate.

---

## Eval Design

### 5 Binary Criteria

1. **Disclaimer present** — educational disclaimer at end of response
2. **Canadian terminology only** — no IRS/IRC/401k/Roth IRA without explicit contrast to Canadian equivalent
3. **Specific numbers cited** — at least one concrete figure (dollar limit, rate, year)
4. **Profile-aware** — uses actual profile.json values (province, income, contribution room, arrival date), not generic advice
5. **Follow-up offered** — offers to email results for substantive responses

### 5 Test Queries

- Q1: RRSP vs TFSA for tax efficiency (income/room-dependent question)
- Q2: "I just arrived in Canada 6 months ago" (newcomer steps — tests profile-data priority)
- Q3: How does FHSA work + can I combine with HBP (product knowledge + profile room)
- Q4: Capital gains inclusion rates (factual, tests numbers + Canadian terminology)
- Q5: US withholding tax RRSP vs TFSA (cross-border, tests terminology criterion most)

Query selection rationale: Q2 was specifically designed to surface a profile-priority conflict (user claim vs profile data). Q5 was designed to probe the US terminology rule since it inherently requires referencing US tax concepts.

---

## Baseline Run

**Method:** 5 sub-agents run in parallel, each given the full skill instructions (minus the mutation) and the profile data. No cross-contamination between queries.

**Results:**

| Query | C1 | C2 | C3 | C4 | C5 | Score |
|-------|----|----|----|----|-----|-------|
| Q1 | ✅ | ✅ | ✅ | ✅ | ✅ | 5/5 |
| Q2 | ✅ | ✅ | ✅ | ❌ | ✅ | 4/5 |
| Q3 | ✅ | ✅ | ✅ | ✅ | ✅ | 5/5 |
| Q4 | ✅ | ✅ | ✅ | ✅ | ✅ | 5/5 |
| Q5 | ✅ | ✅ | ✅ | ✅ | ✅ | 5/5 |
| **Total** | | | | | | **24/25 (96%)** |

---

## Failure Analysis

### Q2 × Criterion 4 — Profile-aware

**User query:** "I just arrived in Canada 6 months ago. What should I do first financially?"

**What the baseline did:**
The agent accepted the user's claim ("6 months ago") at face value. It calculated TFSA room starting from approximately September 2025 and arrived at a total of $14,000 ($7,000 for 2025 + $7,000 for 2026). It advised that the user had $14,000 of TFSA room.

**What the profile says:**
- `arrival_date: "2022-06-15"` — arrived June 2022, not 6 months ago
- `tfsa_contribution_room: 34000` — remaining room is $34,000

**Why this matters:**
The TFSA room advice was wrong by $20,000. A user who trusted this response and acted on it (avoiding "over-contribution" concern, planning contributions around the wrong room figure) would be making decisions based on incorrect data. The profile has authoritative data — the user's own tracked numbers — and the skill was silently ignoring it in favour of an unverified claim in the chat message.

**Root cause in the skill:**
Step 1 said "Read data/profile.json for user context" but gave no instruction about what to do when user-stated facts conflict with profile values. The skill had no priority rule — it was ambiguous whether the agent should trust the profile or the user.

---

## Mutation Applied

**File:** `.claude/skills/canadian-finance-advisor.md`
**Location:** Step 1 of the Instructions section

**Added after "Read data/profile.json for user context...":**

```
- Profile data takes priority over user-stated claims. If the user states facts
  that conflict with profile.json values (e.g. "I just arrived in Canada" when
  arrival_date shows an older date, or contribution room amounts that differ from
  the profile values), use the profile data for all calculations. Gently note the
  discrepancy: "Your profile shows your arrival date as [X] — I'll use that for
  the calculations below. If this is incorrect, you can update it in the Manage
  Data page."
```

**Design choices:**
- Placed at step 1 (as early as possible) so it's applied before any advice is generated
- Specifies the exact conflict type (arrival date, contribution room) to be concrete
- Provides the exact phrasing to use — removes ambiguity about how to handle it
- References the Manage Data page — gives the user a path to correct the profile if needed
- Uses "gently note" rather than "warn" — keeps the tone advisory, not accusatory

---

## Post-Mutation Run

**Method:** Same 5 sub-agents in parallel, now with the mutated skill.

**Results:**

| Query | C1 | C2 | C3 | C4 | C5 | Score |
|-------|----|----|----|----|-----|-------|
| Q1 | ✅ | ✅ | ✅ | ✅ | ✅ | 5/5 |
| Q2 | ✅ | ✅ | ✅ | ✅ | ✅ | 5/5 |
| Q3 | ✅ | ✅ | ✅ | ✅ | ✅ | 5/5 |
| Q4 | ✅ | ✅ | ✅ | ✅ | ✅ | 5/5 |
| Q5 | ✅ | ✅ | ✅ | ✅ | ✅ | 5/5 |
| **Total** | | | | | | **25/25 (100%)** |

**Q2 post-mutation output (opening):**
> "Your profile shows your arrival date as **June 15, 2022** — so you have been in Canada for approximately 3.75 years, not 6 months. I will use your profile data for all calculations below. If this is incorrect, you can update it in the **Manage Data** page."

The agent then correctly used:
- `tfsa_contribution_room: 34000` from profile
- `rrsp_contribution_room: 28000` from profile
- Annual TFSA limits table (2022–2025) to show room accumulation history
- Employer match details from profile

---

## Summary

| Metric | Baseline | Post-Mutation | Delta |
|--------|----------|---------------|-------|
| Score | 24/25 (96%) | 25/25 (100%) | +1 (+4pp) |
| Failures | Q2 C4 | None | −1 failure |

**What the mutation changed:** Added an explicit data-priority rule to the skill. The skill now surfaces profile conflicts rather than silently accepting user-stated claims. This is a correctness guarantee — the agent can still give accurate advice even when the user's message contains inaccurate context.

**Why this mutation is well-targeted:** It addresses only the root cause (no priority rule) without changing any other skill behaviour. All other criteria remained at 100% through both runs. The fix is narrow and surgical.

**Remaining risk areas (future eval ideas):**
- Test with a user who deliberately provides a different province than their profile (does the agent catch it?)
- Test with a user who states an income bracket different from their profile (does marginal rate advice use profile or claim?)
- Test RRSP room conflict (user says "I have $50K of RRSP room" when profile says $28,000)
