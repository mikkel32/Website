import { jest } from '@jest/globals';

describe('initPreloader', () => {
  test('invokes anime with pulse effect and updates on asset events', async () => {
    jest.resetModules();
    const animate = jest.fn(() => ({ finished: Promise.resolve() }));
    const timeline = { add: jest.fn(), finished: Promise.resolve() };
    const createTimeline = jest.fn(() => timeline);
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
    const preloaderPromise = initPreloader({ timeout: 1000 });
    await Promise.resolve();
    const progressBar = document.querySelector('.progress-bar');
    const progressText = document.querySelector('.progress-text');

    expect(progressBar.style.width).toBe('0%');

    img1.dispatchEvent(new Event('load'));
    expect(progressBar.style.width).toBe('50%');

    img2.dispatchEvent(new Event('error'));
    expect(progressBar.style.width).toBe('100%');

    const preloader = document.getElementById('preloader');
    preloader.dispatchEvent(new Event('transitionend'));
    await preloaderPromise;

    expect(addSpy1).toHaveBeenCalledWith('load', expect.any(Function));
    expect(addSpy2).toHaveBeenCalledWith('load', expect.any(Function));
    expect(removeSpy1).toHaveBeenCalledTimes(2);
    expect(removeSpy2).toHaveBeenCalledTimes(2);

    expect(progressText.textContent).toBe('100%');

    expect(createTimeline).toHaveBeenCalledWith({ easing: 'easeOutCubic', duration: 600 });
    expect(timeline.add).toHaveBeenCalledWith(
      expect.objectContaining({
        targets: expect.anything(),
        rotate: [0, 360],
        scale: [0.5, 1],
        opacity: [0, 1],
      }),
    );

    expect(animate).toHaveBeenCalled();
    const opts = animate.mock.calls[0][1];
    expect(opts.scale).toEqual([1, 1.1]);
  });

  test('skips animations when prefers-reduced-motion', async () => {
    jest.resetModules();
    const animate = jest.fn(() => ({ finished: Promise.resolve() }));
    const timeline = { add: jest.fn(), finished: Promise.resolve() };
    const createTimeline = jest.fn(() => timeline);
    jest.unstable_mockModule('../anime-loader.js', () => ({ getAnime: () => Promise.resolve({ animate, createTimeline }) }));
    const { initPreloader } = await import('../preloader.js');
    window.matchMedia = jest.fn().mockReturnValue({ matches: true });

    document.body.innerHTML = `
      <div id="preloader" aria-hidden="true">
        <svg class="preloader-shield"></svg>
        <div class="preloader-progress">
          <div class="progress-bar"></div>
          <span class="progress-text" aria-live="polite"></span>
        </div>
      </div>`;

    jest.useFakeTimers();
    const img = document.createElement('img');
    img.src = 'x';
    document.body.appendChild(img);

    const preloaderPromise = initPreloader({ timeout: 1000 });
    await Promise.resolve();

    const progressBar = document.querySelector('.progress-bar');
    const progressText = document.querySelector('.progress-text');

    expect(progressBar.style.width).toBe('0%');
    img.dispatchEvent(new Event('load'));

    expect(progressBar.style.width).toBe('100%');
    const shield = document.querySelector('.preloader-shield');
    const preloader = document.getElementById('preloader');
    jest.runAllTimers();
    preloader.dispatchEvent(new Event('transitionend'));
    await preloaderPromise;

    expect(progressText.textContent).toBe('100%');
    expect(shield.style.transition).toBe('');
    expect(progressBar.style.transition).toBe('');
    expect(shield.style.opacity).toBe('1');
    expect(createTimeline).not.toHaveBeenCalled();
    expect(timeline.add).not.toHaveBeenCalled();
    expect(animate).not.toHaveBeenCalled();
  });

  test('handles lazy loaded images and timeout', async () => {
    jest.resetModules();
    const animate = jest.fn(() => ({ finished: Promise.resolve() }));
    const timeline = { add: jest.fn(), finished: Promise.resolve() };
    const createTimeline = jest.fn(() => timeline);
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

    const lazy = document.createElement('img');
    lazy.className = 'lazy-image';
    lazy.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
    lazy.setAttribute('data-src', 'foo.jpg');
    document.body.appendChild(lazy);

    jest.useFakeTimers();
    const preloaderPromise = initPreloader({ timeout: 1000 });
    await Promise.resolve();

    jest.advanceTimersByTime(900);
    expect(document.getElementById('preloader')).not.toBeNull();

    jest.advanceTimersByTime(200);
    const preloader = document.getElementById('preloader');
    preloader.dispatchEvent(new Event('transitionend'));
    await preloaderPromise;

    expect(document.getElementById('preloader')).toBeNull();
    jest.useRealTimers();
    expect(createTimeline).toHaveBeenCalled();
  });

  test('tracks font preloads and dynamic images', async () => {
    jest.resetModules();
    const animate = jest.fn(() => ({ finished: Promise.resolve() }));
    const timeline = { add: jest.fn(), finished: Promise.resolve() };
    const createTimeline = jest.fn(() => timeline);
    jest.unstable_mockModule('../anime-loader.js', () => ({ getAnime: () => Promise.resolve({ animate, createTimeline }) }));
    const { initPreloader } = await import('../preloader.js');
    window.matchMedia = jest.fn().mockReturnValue({ matches: true });

    let resolveFonts;
    document.fonts = {
      status: 'loading',
      ready: new Promise((res) => {
        resolveFonts = res;
      }),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };

    document.body.innerHTML = `
      <div id="preloader" aria-hidden="true">
        <svg class="preloader-shield"></svg>
        <div class="preloader-progress">
          <div class="progress-bar"></div>
          <span class="progress-text" aria-live="polite"></span>
        </div>
      </div>`;

    const base = document.createElement('img');
    base.src = 'x';
    document.body.appendChild(base);

    const lazy = document.createElement('img');
    lazy.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
    lazy.setAttribute('data-src', 'foo.jpg');
    document.body.appendChild(lazy);

    const font = document.createElement('link');
    font.rel = 'preload';
    font.setAttribute('as', 'font');
    document.head.appendChild(font);

    jest.useFakeTimers();
    const preloadPromise = initPreloader({ timeout: 1000 });
    await Promise.resolve();

    const progressBar = document.querySelector('.progress-bar');
    expect(progressBar.style.width).toBe('0%');

    font.href = 'font.woff2';
    lazy.src = 'foo.jpg';
    await Promise.resolve();

    base.dispatchEvent(new Event('load'));
    expect(parseFloat(progressBar.style.width)).toBeCloseTo(25, 1);

    lazy.dispatchEvent(new Event('load'));
    expect(parseFloat(progressBar.style.width)).toBeCloseTo(50, 1);

    font.dispatchEvent(new Event('load'));
    expect(parseFloat(progressBar.style.width)).toBeCloseTo(75, 1);

    resolveFonts();
    await Promise.resolve();
    expect(progressBar.style.width).toBe('100%');

    expect(document.fonts.addEventListener).not.toHaveBeenCalled();

    const preloader = document.getElementById('preloader');
    preloader.dispatchEvent(new Event('transitionend'));
    await preloadPromise;

    delete document.fonts;
  });

  test('tracks images added after initialization with src set', async () => {
    jest.resetModules();
    const animate = jest.fn(() => ({ finished: Promise.resolve() }));
    const timeline = { add: jest.fn(), finished: Promise.resolve() };
    const createTimeline = jest.fn(() => timeline);
    jest.unstable_mockModule('../anime-loader.js', () => ({ getAnime: () => Promise.resolve({ animate, createTimeline }) }));
    const { initPreloader } = await import('../preloader.js');
    window.matchMedia = jest.fn().mockReturnValue({ matches: true });

    document.body.innerHTML = `
      <div id="preloader" aria-hidden="true">
        <svg class="preloader-shield"></svg>
        <div class="preloader-progress">
          <div class="progress-bar"></div>
          <span class="progress-text" aria-live="polite"></span>
        </div>
      </div>`;

    const base = document.createElement('img');
    base.src = 'a.jpg';
    document.body.appendChild(base);

    jest.useFakeTimers();
    const preloadPromise = initPreloader({ timeout: 1000 });
    await Promise.resolve();

    const progressBar = document.querySelector('.progress-bar');
    expect(progressBar.style.width).toBe('0%');

    const dynamic = document.createElement('img');
    dynamic.src = 'b.jpg';
    document.body.appendChild(dynamic);
    await Promise.resolve();

    base.dispatchEvent(new Event('load'));
    expect(progressBar.style.width).toBe('50%');

    dynamic.dispatchEvent(new Event('load'));

    expect(progressBar.style.width).toBe('100%');

    const preloader = document.getElementById('preloader');
    preloader.dispatchEvent(new Event('transitionend'));
    await preloadPromise;
  });
});
