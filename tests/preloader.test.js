import { jest } from '@jest/globals';

describe('initPreloader', () => {
  test('removes preloader after images load', async () => {
    jest.resetModules();
    jest.unstable_mockModule('animejs', () => ({ animate: jest.fn() }));
    const { initPreloader } = await import('../preloader.js');

    document.body.innerHTML = `
      <div id="preloader" aria-hidden="true">
        <svg class="preloader-shield"></svg>
        <div class="preloader-progress"><div class="progress-bar" role="progressbar" aria-label="Page loading" aria-valuemin="0" aria-valuemax="100"></div></div>
      </div>
      <img id="img1">
    `;

    const img = document.getElementById('img1');
    Object.defineProperty(img, 'complete', { configurable: true, value: false });

    jest.useFakeTimers();
    initPreloader();
    await Promise.resolve();

    const progressBar = document.querySelector('.progress-bar');
    expect(document.body.getAttribute('aria-busy')).toBe('true');
    expect(progressBar.getAttribute('aria-valuenow')).toBe('0');

    jest.advanceTimersByTime(100);
    await Promise.resolve();
    expect(progressBar.getAttribute('aria-valuenow')).not.toBe('0');

    img.dispatchEvent(new Event('load'));
    jest.advanceTimersByTime(3000);
    await Promise.resolve();
    const pre = document.getElementById('preloader');
    pre.dispatchEvent(new Event('transitionend'));
    jest.runOnlyPendingTimers();
    await Promise.resolve();

    expect(document.body.hasAttribute('aria-busy')).toBe(false);
    expect(progressBar.hasAttribute('aria-valuenow')).toBe(false);

    expect(document.getElementById('preloader')).toBeNull();
    jest.useRealTimers();
  });
});
