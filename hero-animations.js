// Import Anime.js from the local node_modules directory so the script works
// when served by a simple HTTP server without a bundler.
let animeModule;

async function loadAnime() {
  try {
    animeModule = await import('animejs');
  } catch (err) {
    console.warn('Local Anime.js not found, loading from CDN...', err);
    try {
      animeModule = await import(
        'https://cdn.jsdelivr.net/npm/animejs@4.0.2/lib/anime.esm.min.js'
      );
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
