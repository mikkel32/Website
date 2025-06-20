import { jest } from '@jest/globals';
import { initParallax } from '../parallax.js';

describe('initParallax', () => {
  test('updates transform based on scroll when motion allowed', () => {
    document.body.innerHTML = '<div class="hero-shapes"></div>';
    Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 100 });
    window.matchMedia = jest.fn().mockReturnValue({ matches: false });
    jest.useFakeTimers();
    initParallax();
    window.dispatchEvent(new Event('scroll'));
    jest.runAllTimers();
    const shapes = document.querySelector('.hero-shapes');
    expect(shapes.style.transform).toBe('translateY(30px)');
    jest.useRealTimers();
  });

  test('no update when prefers-reduced-motion', () => {
    document.body.innerHTML = '<div class="hero-shapes"></div>';
    Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 50 });
    window.matchMedia = jest.fn().mockReturnValue({ matches: true });
    initParallax();
    window.dispatchEvent(new Event('scroll'));
    const shapes = document.querySelector('.hero-shapes');
    expect(shapes.style.transform).toBe('none');
  });
});
