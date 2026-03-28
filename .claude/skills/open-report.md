---
triggers:
  - "open report"
  - "preview report"
  - "show report"
  - "open the latest report"
  - "view report"
---

# Open Report

Open the most recently generated report in the default browser.

## Instructions

1. List all `.html` files in `reports/` sorted by modification time (newest first)
2. If no reports exist, tell the user to generate one first with `npm run report:daily`
3. Open the latest report using: `open "<path>"`
4. Tell the user which file was opened

## Example

```
Opening: reports/2026-03-05-daily.html
Done — report opened in your browser.
```
