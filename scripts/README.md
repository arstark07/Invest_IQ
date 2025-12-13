Generate report `.docx` using Pandoc

This script runs Pandoc to convert `report/report.md` into a Word `.docx` file.

Prerequisites:
- Pandoc must be installed and available in PATH: https://pandoc.org/installing.html
- (Optional) A Word reference document (`custom-reference.docx`) for styling.

Usage (PowerShell):

```powershell
# From project root
node .\scripts\generate-report.js

# With a custom Word reference template
node .\scripts\generate-report.js --reference-doc .\report\custom-reference.docx
```

Output:
- `report/AI_Finance_Project_Report.docx`

Notes:
- The script checks that `pandoc` is available before running.
- If conversion fails, check the Pandoc output for missing resources or syntax errors in the Markdown.
