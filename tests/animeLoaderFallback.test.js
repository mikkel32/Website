import { jest } from '@jest/globals';

jest.unstable_mockModule('animejs', () => {
  throw new Error('missing');
});

test('loader uses bundled Anime.js when import fails', async () => {
  const fetchSpy = jest.fn();
  global.fetch = fetchSpy;
  global.CSS = { registerProperty: jest.fn() };
  const { getAnime } = await import('../anime-loader.js');
  const mod = await getAnime();
  expect(mod).toBeDefined();
  expect(fetchSpy).not.toHaveBeenCalled();
});
