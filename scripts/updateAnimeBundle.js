import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { execFile } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const version = process.argv[2] || '4.0.2';
const url = `https://cdn.jsdelivr.net/npm/animejs@${version}/lib/anime.esm.min.js`;

console.log(`Fetching Anime.js bundle from ${url}...`);
execFile('curl', ['-L', url], { encoding: 'utf8' }, async (err, stdout) => {
  if (err) {
    console.error(`Failed to fetch bundle: ${err.message}`);
    process.exit(1);
  }
  try {
    await fs.mkdir(`${__dirname}/../public`, { recursive: true });
    await Promise.all([
      fs.writeFile(`${__dirname}/../anime.bundle.mjs`, stdout),
      fs.writeFile(`${__dirname}/../public/anime.bundle.mjs`, stdout),
    ]);
    console.log('Anime.js bundle updated.');
  } catch (writeErr) {
    console.error(`Failed to write bundle: ${writeErr.message}`);
    process.exit(1);
  }
});
