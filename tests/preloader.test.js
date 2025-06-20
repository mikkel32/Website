import { jest } from '@jest/globals';

describe('initPreloader', () => {
  test('invokes anime with pulse effect', async () => {
    jest.resetModules();
    const animate = jest.fn(() => ({ finished: Promise.resolve() }));
    const createTimeline = jest.fn(() => ({ add: jest.fn(), finished: Promise.resolve() }));
    jest.unstable_mockModule('../anime-loader.js', () => ({ getAnime: () => Promise.resolve({ animate, createTimeline }) }));
    const { initPreloader } = await import('../preloader.js');
    window.matchMedia = jest.fn().mockReturnValue({ matches: false });

    document.body.innerHTML = `
      <div id="preloader" aria-hidden="true">
        <svg class="preloader-shield"></svg>
        <div class="preloader-progress"><div class="progress-bar"></div></div>
      </div>`;

    jest.useFakeTimers();
    initPreloader();
    await Promise.resolve();
    jest.advanceTimersByTime(3000);

    expect(animate).toHaveBeenCalled();
    const opts = animate.mock.calls[0][1];
    expect(opts.rotate).toBeUndefined();
    expect(opts.scale).toEqual([1, 1.1]);
  });
});
