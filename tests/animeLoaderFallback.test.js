import { jest } from '@jest/globals';

jest.resetModules();
jest.unstable_mockModule('animejs', () => {
  throw new Error('missing');
});

// Anime.js expects `CSS` global to exist
global.CSS = global.CSS || {};

test('loader falls back to bundled Anime.js', async () => {
  const bundled = await import('../anime.bundle.mjs');
  const { getAnime } = await import('../anime-loader.js');
  const mod = await getAnime();
  expect(mod).toBe(bundled);
});
