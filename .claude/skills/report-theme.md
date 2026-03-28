---
triggers:
  - "change report theme"
  - "update report colors"
  - "dark mode report"
  - "light mode report"
  - "report styling"
  - "customize report"
  - "report design"
---

# Report Theme Editor

Update the visual theme (colors, fonts, spacing) of the HTML report templates.

## Instructions

1. Ask the user what they want to change:
   - Color scheme (e.g., dark mode, light mode, custom accent color)
   - Font size or family
   - Spacing / density (compact vs comfortable)
   - Specific element (header, tables, cards, charts)
2. Read the target report file (or the most recent one in `reports/`)
3. Update only the `<style>` block — do not change the HTML structure or data
4. Keep the report self-contained (no external CSS files or CDN links)
5. Open the updated file: `open "<path>"`

## Preset Themes

### Default (Dark Navy + White)
- Background: #f0f2f5
- Header: #1a1a2e
- Cards: white, border-radius 12px, shadow
- Gains: #22c55e | Losses: #ef4444

### Dark Mode
- Background: #0f0f1a
- Header: #0d0d1f
- Cards: #1a1a2e, border: 1px solid #2a2a4a
- Text: #e2e8f0
- Gains: #4ade80 | Losses: #f87171

### High Contrast
- Background: white
- Header: black
- Cards: white, border: 2px solid black
- Text: black
- Gains: #15803d | Losses: #b91c1c

## Rules
- All CSS must remain in the `<style>` tag (self-contained file)
- Never add external font imports or CDN links
- Preserve all existing class names and structure
