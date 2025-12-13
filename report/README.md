# Report folder — Convert Markdown to Word

This folder contains:

- `report.md` — Full project report in Markdown format
- `architecture.svg`, `dataflow.svg`, `ui-flow.svg` — Diagrams referenced in the report

Recommended conversion methods to generate a `.docx` Word file.

## Option 1 — Pandoc (recommended)

1. Install Pandoc: https://pandoc.org/installing.html

2. From project root run (PowerShell):

```powershell
cd f:\ai-finance-platform-main\report
pandoc report.md -o "AI_Finance_Project_Report.docx" --toc --metadata title="AI Finance Platform Project Report" --resource-path=".:.."
```

Notes:
- `--resource-path` lets Pandoc find the SVG files in the same folder.
- You can supply `--reference-doc=custom-reference.docx` to match a Word template for consistent styling.

## Option 2 — LibreOffice

1. Convert Markdown to HTML first (e.g., using a Markdown renderer or Pandoc):

```powershell
pandoc report.md -o report.html
```

2. Open `report.html` in LibreOffice Writer and save as `.docx`.

## Option 3 — Microsoft Word (manual)

- Open `report.md` using a Markdown-aware editor (VS Code) and copy-paste into Word, then insert SVGs.

## Optional: Automatic .docx via Node script

If you want, I can add a small Node.js script that uses `child_process` to call Pandoc and produce `AI_Finance_Project_Report.docx` automatically. Ask me to add it and I'll create it.

---

If you'd like, I can also:
- Expand the Markdown to reach 50–60 pages with detailed tables, screenshots, and expanded literature survey.
- Provide a Word reference template (`custom-reference.docx`) to ensure organizational formatting.

Tell me which conversion option you prefer and whether you want me to expand the report to reach the 50–60 page target (I can generate extended sections, example data tables, and formatted screenshots).