let animeModule;
const CDN_URL =
  'https://cdn.jsdelivr.net/npm/animejs@4.0.2/lib/anime.esm.min.js';
const EXPECTED_CDN_HASH =
  'e8eb5b27f49049d82da9cebd01d3809ea5141f6d524f2960824345e0ca45f237';

async function loadFromCDN() {
  try {
    const res = await fetch(CDN_URL);
    const text = await res.text();
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    if (hashHex !== EXPECTED_CDN_HASH) {
      console.warn('Anime.js CDN hash mismatch. Animations disabled.');
      return null;
    }
    const blob = new Blob([text], { type: 'application/javascript' });
    const blobURL = URL.createObjectURL(blob);
    const mod = await import(blobURL);
    URL.revokeObjectURL(blobURL);
    return mod;
  } catch (err) {
    console.error('Failed to load Anime.js from CDN', err);
    return null;
  }
}

export async function getAnime() {
  if (animeModule !== undefined) return animeModule;

  try {
    animeModule = await import('animejs');
  } catch (err) {
    console.warn('Local Anime.js not found, falling back to CDN...', err);
    animeModule = await loadFromCDN();
  }

  return animeModule;
}
