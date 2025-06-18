// Import Anime.js from the local node_modules directory so the script works
// when served by a simple HTTP server without a bundler.
let animeModule;

const CDN_URL =
  'https://cdn.jsdelivr.net/npm/animejs@4.0.2/lib/anime.esm.min.js';
// sha256 hash of the file at CDN_URL (hex encoded)
const EXPECTED_CDN_HASH =
  'e8eb5b27f49049d82da9cebd01d3809ea5141f6d524f2960824345e0ca45f237';

async function loadAnime() {
  try {
    const res = await fetch('./node_modules/animejs/lib/anime.esm.js', { method: 'HEAD' });
    if (res.ok) {
      animeModule = await import('animejs');
      return;
    }
    throw new Error('local file missing');
  } catch (err) {
    console.warn('Local Anime.js not found, loading from CDN...', err);
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
        animeModule = null;
        return;
      }
      const blob = new Blob([text], { type: 'application/javascript' });
      const blobURL = URL.createObjectURL(blob);
      animeModule = await import(blobURL);
      URL.revokeObjectURL(blobURL);
    } catch (cdnErr) {
      console.error('Failed to load Anime.js from CDN', cdnErr);
      animeModule = null;
    }
  }
}

export async function initHeroAnimations() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  if (!animeModule) {
    await loadAnime();
  }

  if (!animeModule) {
    return;
  }

  const { animate, stagger } = animeModule;

  animate('.hero-title', {
    opacity: [0, 1],
    translateY: [40, 0],
    duration: 700,
    easing: 'easeOutCubic',
  });

  animate('.hero-subtitle', {
    opacity: [0, 1],
    translateY: [40, 0],
    duration: 700,
    delay: 200,
    easing: 'easeOutCubic',
  });

  animate('.hero-buttons .btn', {
    opacity: [0, 1],
    translateY: [40, 0],
    delay: stagger(100, { start: 400 }),
    duration: 600,
    easing: 'easeOutCubic',
  });

  animate('.shield-animation', {
    opacity: [0, 1],
    scale: [0.8, 1],
    duration: 800,
    delay: 600,
    easing: 'easeOutBack',
  });

  animate('.hero-shapes .shape', {
    opacity: [0, 0.6],
    scale: [0.8, 1],
    rotate: [-90, 0],
    delay: stagger(150, { start: 500 }),
    duration: 1000,
    easing: 'easeOutBack',
  });

  animate('.hero-shapes .shape', {
    translateX: [0, 30],
    direction: 'alternate',
    loop: true,
    easing: 'easeInOutSine',
    delay: stagger(200, { start: 1200 }),
  });
}
