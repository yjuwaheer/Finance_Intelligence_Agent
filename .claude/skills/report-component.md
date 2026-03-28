---
triggers:
  - "add a section to the report"
  - "add report section"
  - "new report component"
  - "add a card"
  - "add a chart"
  - "add a table to the report"
  - "add a heatmap"
  - "add a widget"
---

# Report Component Builder

Add a new visual section or component to an existing HTML report.

## Instructions

1. Ask the user:
   - Which report to modify (or default to the latest in `reports/`)
   - What type of component they want (table, card, bar chart, heatmap, progress bar, KPI tile, etc.)
   - What data to display
2. Read the target HTML file
3. Add the new component using the project's existing style conventions:
   - Font: system font stack (-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif)
   - Colors: dark navy (#1a1a2e) headers, green (#22c55e) gains, red (#ef4444) losses
   - Card style: white background, border-radius 12px, box-shadow, padding 24px
   - All CSS inline or in the existing `<style>` tag — no external dependencies
4. Insert the component in a logical position in the report
5. Open the updated report: `open "<path>"`

## Component Patterns

### KPI Tile
```html
<div style="background:white;border-radius:12px;padding:20px;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
  <div style="font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px;">Label</div>
  <div style="font-size:28px;font-weight:700;margin-top:6px;color:#16a34a;">$0.00</div>
</div>
```

### Bar Chart Row
```html
<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
  <div style="width:120px;font-size:13px;">Label</div>
  <div style="flex:1;background:#f0f2f5;border-radius:4px;height:10px;">
    <div style="width:50%;background:#1a1a2e;height:100%;border-radius:4px;"></div>
  </div>
  <div style="width:60px;text-align:right;font-size:13px;font-weight:600;">$0</div>
</div>
```

### Data Table
```html
<table style="width:100%;border-collapse:collapse;font-size:14px;">
  <thead><tr style="background:#1a1a2e;color:white;">
    <th style="padding:10px 12px;text-align:left;">Column</th>
  </tr></thead>
  <tbody>
    <tr><td style="padding:10px 12px;border-bottom:1px solid #f0f2f5;">Value</td></tr>
  </tbody>
</table>
```
