---
triggers:
  - "accessibility check"
  - "a11y"
  - "check accessibility"
  - "audit accessibility"
  - "wcag"
  - "screen reader"
  - "colour contrast"
  - "color contrast"
---

# Accessibility Check

Audit an HTML report or file for common accessibility issues and fix them.

## Instructions

1. Read the target HTML file (default: most recent file in `reports/`)
2. Check for these common issues:
   - **Missing alt text** on images (`<img>` without `alt`)
   - **Color contrast** — text must meet WCAG AA (4.5:1 ratio for body text, 3:1 for large text)
     - Green #22c55e on white: check contrast ratio
     - Red #ef4444 on white: check contrast ratio
   - **Missing semantic structure** — `<main>`, `<header>`, `<section>`, `<h1>`–`<h6>` hierarchy
   - **Tables without headers** — `<table>` missing `<th scope="col/row">`
   - **Missing lang attribute** on `<html>`
   - **Links without descriptive text** — `<a>Click here</a>` is bad
   - **Missing `<title>` tag**
3. Report all issues found with line references
4. Ask the user if they want the issues fixed automatically
5. If yes, apply fixes and save the file

## WCAG AA Contrast Minimums
- Normal text (<18px or <14px bold): 4.5:1
- Large text (≥18px or ≥14px bold): 3:1
- UI components and graphics: 3:1

## Common Fixes for This Project
- Add `lang="en"` to `<html>`
- Add `scope="col"` to table header cells
- Add `role="img" aria-label="..."` to CSS-based charts
- Ensure all color-only indicators also have text labels
