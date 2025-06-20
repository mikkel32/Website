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
        <div class="preloader-progress">
          <div class="progress-bar"></div>
          <span class="progress-text" aria-live="polite"></span>
        </div>
      </div>`;

    const img1 = document.createElement('img');
    const img2 = document.createElement('img');
    img1.src = 'x';
    img2.src = 'y';
    document.body.appendChild(img1);
    document.body.appendChild(img2);
    const addSpy1 = jest.spyOn(img1, 'addEventListener');
    const removeSpy1 = jest.spyOn(img1, 'removeEventListener');
    const addSpy2 = jest.spyOn(img2, 'addEventListener');
    const removeSpy2 = jest.spyOn(img2, 'removeEventListener');

    jest.useFakeTimers();
    initPreloader();
    await Promise.resolve();
    const progressBar = document.querySelector('.progress-bar');
    const progressText = document.querySelector('.progress-text');

    jest.advanceTimersByTime(1500);
    expect(progressText.textContent).toBe(
      `${progressBar.getAttribute('aria-valuenow')}%`,
    );

    jest.advanceTimersByTime(1500);

    expect(addSpy1).toHaveBeenCalledWith('load', expect.any(Function));
    expect(addSpy2).toHaveBeenCalledWith('load', expect.any(Function));
    expect(removeSpy1).toHaveBeenCalledTimes(2);
    expect(removeSpy2).toHaveBeenCalledTimes(2);

    expect(progressText.textContent).toBe('100%');

    expect(animate).toHaveBeenCalled();
    const opts = animate.mock.calls[0][1];
    expect(opts.rotate).toBeUndefined();
    expect(opts.scale).toEqual([1, 1.1]);
  });
});
