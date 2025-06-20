import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { execFileSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const url = 'https://cdn.jsdelivr.net/npm/animejs@4.0.2?module';

console.log(`Fetching Anime.js bundle from ${url}...`);
let code;
try {
  code = execFileSync('curl', ['-L', url], { encoding: 'utf8' });
} catch (err) {
  console.error(`Failed to fetch bundle: ${err.message}`);
  process.exit(1);
}

try {
  await fs.mkdir(`${__dirname}/../public`, { recursive: true });
  await Promise.all([
    fs.writeFile(`${__dirname}/../anime.bundle.mjs`, code),
    fs.writeFile(`${__dirname}/../public/anime.bundle.mjs`, code),
  ]);
  console.log('Anime.js bundle updated.');
} catch (writeErr) {
  console.error(`Failed to write bundle: ${writeErr.message}`);
  process.exit(1);
}
