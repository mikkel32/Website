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
    const timeline = jest.fn(() => ({ add: jest.fn().mockReturnThis(), finished: Promise.resolve() }));
    const animate = jest.fn(() => ({ finished: Promise.resolve() }));
    const stagger = jest.fn(() => jest.fn());
    jest.unstable_mockModule('animejs', () => ({
      animate,
      stagger,
      timeline,
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
    expect(timeline).toHaveBeenCalledTimes(2);
  });
});
