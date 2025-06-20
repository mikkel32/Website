import { jest } from '@jest/globals';
import { initParallax } from '../parallax.js';
import { initSectionBackgrounds } from '../main.js';

describe('initParallax', () => {
  test('updates multiple layer transforms', () => {
    document.body.innerHTML = `
      <div class="parallax-layer" data-speed="0.2"></div>
      <div class="parallax-layer" data-speed="0.4"></div>`;
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      writable: true,
      value: 100,
    });
    window.matchMedia = jest.fn().mockReturnValue({ matches: false });
    jest.useFakeTimers();
    initParallax();
    window.dispatchEvent(new Event('scroll'));
    jest.runAllTimers();
    const layers = document.querySelectorAll('.parallax-layer');
    expect(layers[0].style.transform).toBe('translateY(20px)');
    expect(layers[1].style.transform).toBe('translateY(40px)');
    jest.useRealTimers();
  });

  test('no update when prefers-reduced-motion', () => {
    document.body.innerHTML = '<div class="parallax-layer"></div>';
    Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 50 });
    window.matchMedia = jest.fn().mockReturnValue({ matches: true });
    initParallax();
    window.dispatchEvent(new Event('scroll'));
    const layer = document.querySelector('.parallax-layer');
    expect(layer.style.transform).toBe('none');
  });

  test('uses default speed when none specified', () => {
    document.body.innerHTML = '<div class="parallax-layer"></div>';
    Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 50 });
    window.matchMedia = jest.fn().mockReturnValue({ matches: false });
    jest.useFakeTimers();
    initParallax();
    window.dispatchEvent(new Event('scroll'));
    jest.runAllTimers();
    const layer = document.querySelector('.parallax-layer');
    expect(layer.style.transform).toBe('translateY(10px)');
    jest.useRealTimers();
  });
});

describe('initSectionBackgrounds', () => {
  test('body class toggles on intersection', () => {
    document.body.innerHTML = '<section id="features"></section><section id="services"></section>';
    const callbacks = [];
    global.IntersectionObserver = class {
      constructor(cb) {
        callbacks.push(cb);
      }
      observe() {}
      unobserve() {}
    };
    initSectionBackgrounds();
    callbacks[0]([{ target: document.getElementById('features'), isIntersecting: true }]);
    expect(document.body.classList.contains('section-features-active')).toBe(true);
    callbacks[0]([{ target: document.getElementById('services'), isIntersecting: true }]);
    expect(document.body.classList.contains('section-services-active')).toBe(true);
  });
});
