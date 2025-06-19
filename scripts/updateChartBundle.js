import fs from 'fs/promises';
import {fileURLToPath} from 'url';
import {dirname} from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const version = process.argv[2] || '4.5.0';
const url = `https://esm.sh/chart.js@${version}?bundle`;

console.log(`Fetching Chart.js bundle from ${url}...`);
fetch(url)
  .then(res => {
    if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
    return res.text();
  })
  .then(async (code) => {
    await fs.mkdir(`${__dirname}/../public/dashboard`, { recursive: true });
    await Promise.all([
      fs.writeFile(`${__dirname}/../dashboard/chart.bundle.mjs`, code),
      fs.writeFile(`${__dirname}/../public/dashboard/chart.bundle.mjs`, code),
    ]);
  })
  .then(() => console.log('Chart.js bundle updated.'))
  .catch(err => {
    console.error(`Failed to update Chart.js bundle: ${err.message}`);
    process.exit(1);
  });
