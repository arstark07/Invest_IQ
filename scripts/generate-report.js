const { exec } = require('child_process');
const path = require('path');

// Config
const reportMd = path.join(__dirname, '..', 'report', 'report.md');
const outDocx = path.join(__dirname, '..', 'report', 'AI_Finance_Project_Report.docx');
const resourcePath = path.join(__dirname, '..', 'report');

// Optional reference doc
const refIndex = process.argv.indexOf('--reference-doc');
let referenceDoc = null;
if (refIndex !== -1 && process.argv[refIndex + 1]) {
  referenceDoc = path.resolve(process.argv[refIndex + 1]);
}

function runPandoc() {
  // Build command
  const parts = [
    'pandoc',
    `"${reportMd}"`,
    '-o',
    `"${outDocx}"`,
    '--toc',
    `--resource-path="${resourcePath}"`,
  ];

  if (referenceDoc) {
    parts.push(`--reference-doc="${referenceDoc}"`);
  }

  const cmd = parts.join(' ');
  console.log('Running:', cmd);

  const child = exec(cmd, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
    if (error) {
      console.error('Pandoc failed:', error.message);
      if (stderr) console.error(stderr);
      process.exit(1);
      return;
    }

    console.log('Pandoc finished successfully. Output file:', outDocx);
    if (stdout) console.log(stdout);
  });

  child.stdout && child.stdout.pipe(process.stdout);
  child.stderr && child.stderr.pipe(process.stderr);
}

// Quick check: ensure pandoc is available
exec('pandoc --version', (err) => {
  if (err) {
    console.error('Pandoc not found in PATH. Please install Pandoc: https://pandoc.org/installing.html');
    process.exit(1);
    return;
  }
  runPandoc();
});
