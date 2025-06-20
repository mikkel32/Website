import { jest } from '@jest/globals';

describe('initPreloader', () => {
  test('removes preloader after images load', async () => {
    jest.resetModules();
    jest.unstable_mockModule('animejs', () => ({ default: jest.fn() }));
    const { initPreloader } = await import('../preloader.js');

    document.body.innerHTML = `
      <div id="preloader" aria-hidden="true">
        <svg class="preloader-shield"></svg>
        <div class="preloader-progress"><div class="progress-bar"></div></div>
      </div>
      <img id="img1">
    `;

    const img = document.getElementById('img1');
    Object.defineProperty(img, 'complete', { configurable: true, value: false });

    jest.useFakeTimers();
    initPreloader();
    await Promise.resolve();

    img.dispatchEvent(new Event('load'));
    jest.advanceTimersByTime(3000);
    await Promise.resolve();
    const pre = document.getElementById('preloader');
    pre.dispatchEvent(new Event('transitionend'));
    jest.runOnlyPendingTimers();
    await Promise.resolve();

    expect(document.getElementById('preloader')).toBeNull();
    jest.useRealTimers();
  });
});
