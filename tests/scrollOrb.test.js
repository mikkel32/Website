import { jest } from '@jest/globals';
import { initScrollOrb } from '../scroll-orb.js';

describe('initScrollOrb', () => {
  test('orb does not update when screen width below threshold', () => {
    document.body.innerHTML = '<div class="scroll-orb"></div>';
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 500 });
    Object.defineProperty(window, 'scrollY', { writable: true, configurable: true, value: 100 });
    jest.useFakeTimers();
    initScrollOrb(768);
    window.dispatchEvent(new Event('scroll'));
    jest.runAllTimers();
    const orb = document.querySelector('.scroll-orb');
    expect(orb.style.transform).toBe('translate3d(-50%, -50%, 0)');
    jest.useRealTimers();
  });
});
