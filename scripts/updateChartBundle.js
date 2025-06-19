import fs from 'fs/promises';
import {fileURLToPath} from 'url';
import {dirname} from 'path';
import {execFile, execFileSync} from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const version = process.argv[2] || '4.5.0';
const url = `https://esm.sh/chart.js@${version}?bundle`;

console.log(`Fetching Chart.js bundle from ${url}...`);
execFile('curl', ['-L', url], { encoding: 'utf8' }, async (err, stdout) => {
  if (err) {
    console.error(`Failed to fetch bundle: ${err.message}`);
    process.exit(1);
  }

  let code = stdout;
  const match = stdout.match(/export \* from "(.*?)"/);
  if (match) {
    const fullUrl = new URL(match[1], url).href;
    try {
      code = execFileSync('curl', ['-L', fullUrl], { encoding: 'utf8' });
    } catch (e) {
      console.error(`Failed to fetch bundle: ${e.message}`);
      process.exit(1);
    }
  }

  try {
    await fs.mkdir(`${__dirname}/../public/dashboard`, { recursive: true });
    await Promise.all([
      fs.writeFile(`${__dirname}/../dashboard/chart.bundle.mjs`, code),
      fs.writeFile(`${__dirname}/../public/dashboard/chart.bundle.mjs`, code),
    ]);
    console.log('Chart.js bundle updated.');
  } catch (writeErr) {
    console.error(`Failed to write bundle: ${writeErr.message}`);
    process.exit(1);
  }
});
