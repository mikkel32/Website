import { jest } from '@jest/globals';

describe('typeSubtitle', () => {
  test('gradually inserts characters', async () => {
    const { typeSubtitle } = await import('../hero-animations.js');
    document.body.innerHTML = '<p class="hero-subtitle"></p>';
    const el = document.querySelector('.hero-subtitle');
    jest.useFakeTimers();
    const promise = typeSubtitle(el, 'Hey', 50);
    expect(el.textContent).toBe('');
    jest.advanceTimersByTime(50);
    await Promise.resolve();
    expect(el.textContent).toBe('H');
    jest.advanceTimersByTime(50);
    await Promise.resolve();
    expect(el.textContent).toBe('He');
    jest.advanceTimersByTime(50);
    await Promise.resolve();
    expect(el.textContent).toBe('Hey');
    await promise;
    jest.useRealTimers();
  });
});

describe('initHeroAnimations', () => {
  test('creates cinematic timeline', async () => {
    jest.resetModules();
    const addMock = jest.fn().mockReturnThis();
    const createTimeline = jest.fn(() => ({ add: addMock, finished: Promise.resolve() }));
    const animate = jest.fn(() => ({ finished: Promise.resolve() }));
    const stagger = jest.fn(() => jest.fn());
    jest.unstable_mockModule('animejs', () => ({
      animate,
      stagger,
      createTimeline,
    }));
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
    const { initHeroAnimations } = await import('../hero-animations.js');
    document.body.innerHTML = `
      <div class="hero-cinematic">
        <div class="hero-shapes"><span class="shape"></span></div>
      </div>
      <p class="hero-subtitle">Test</p>`;
    window.matchMedia = jest.fn().mockReturnValue({ matches: false });
    await initHeroAnimations();
    expect(createTimeline).toHaveBeenCalledTimes(2);
    const calledTargets = addMock.mock.calls.map((c) => c[0].targets);
    expect(calledTargets).toContain('.shield-animation');
    expect(calledTargets).toContain('.hero-shapes .shape');
  });

  test('timeline includes perspective and glow effects', async () => {
    jest.resetModules();
    const addMock = jest.fn().mockReturnThis();
    const createTimeline = jest.fn(() => ({ add: addMock, finished: Promise.resolve() }));
    const animate = jest.fn(() => ({ finished: Promise.resolve() }));
    const stagger = jest.fn(() => jest.fn());
    jest.unstable_mockModule('animejs', () => ({
      animate,
      stagger,
      createTimeline,
    }));
    const { initHeroAnimations } = await import('../hero-animations.js');
    document.body.innerHTML = `
      <div class="hero-cinematic">
        <div class="hero-shapes"><span class="shape"></span></div>
      </div>
      <p class="hero-subtitle">Test</p>`;
    window.matchMedia = jest.fn().mockReturnValue({ matches: false });
    await initHeroAnimations();
    const shieldCall = addMock.mock.calls.find((c) => c[0].targets === '.shield-animation');
    expect(shieldCall).toBeTruthy();
    expect(shieldCall[0].rotate).toEqual([-90, 0]);
    expect(shieldCall[0].filter).toBeDefined();
    const heroCall = addMock.mock.calls.find(
      (c) => c[0].targets === '.hero-cinematic' && c[0].transform,
    );
    expect(heroCall).toBeTruthy();
    if (heroCall) {
      expect(heroCall[0].transform[0]).toMatch(/perspective/);
    }
  });
});

describe('initHeroAnimations reduced motion', () => {
  test('skips animations when prefers-reduced-motion', async () => {
    jest.resetModules();
    const createTimeline = jest.fn(() => ({ add: jest.fn(), finished: Promise.resolve() }));
    const animate = jest.fn(() => ({ finished: Promise.resolve() }));
    const stagger = jest.fn(() => jest.fn());
    jest.unstable_mockModule('animejs', () => ({
      animate,
      stagger,
      createTimeline,
    }));
    const { initHeroAnimations } = await import('../hero-animations.js');
    document.body.innerHTML = `
      <div class="hero-cinematic">
        <div class="hero-shapes"><span class="shape"></span></div>
      </div>
      <p class="hero-subtitle">Test</p>`;
    window.matchMedia = jest.fn().mockReturnValue({ matches: true });
    await initHeroAnimations();
    expect(createTimeline).not.toHaveBeenCalled();
    expect(animate).not.toHaveBeenCalled();
    expect(document.querySelector('.hero-subtitle').textContent).toBe('Test');
    expect(document.querySelector('.hero-cinematic').style.transform).toBe('none');
    expect(
      document.querySelector('.hero-shapes .shape').style.transform,
    ).toBe('none');
  });
});

describe('initHeroAnimations fallback', () => {
  test('skips animations when Anime.js fails to load', async () => {
    jest.resetModules();
    jest.unstable_mockModule('../anime-loader.js', () => ({
      getAnime: () => Promise.resolve(null),
    }));
    const { initHeroAnimations } = await import('../hero-animations.js');
    document.body.innerHTML = `
      <div class="hero-cinematic">
        <div class="hero-shapes"><span class="shape"></span></div>
      </div>
      <p class="hero-subtitle">Test</p>`;
    window.matchMedia = jest.fn().mockReturnValue({ matches: false });
    await initHeroAnimations();
    expect(document.querySelector('.hero-subtitle').textContent).toBe('Test');
    expect(document.querySelector('.hero-cinematic').style.transform).toBe('none');
    expect(document.querySelector('.hero-shapes .shape').style.transform).toBe('none');
  });
});
