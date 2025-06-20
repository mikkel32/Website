import { jest } from '@jest/globals';
import { initScrollTopButton } from '../scroll-top.js';

describe('initScrollTopButton', () => {
  test('button appears after scrolling and scrolls to top on click', () => {
    document.body.innerHTML = '';
    Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 0 });
    const btn = initScrollTopButton();
    expect(document.querySelector('.scroll-top')).toBe(btn);
    expect(btn.classList.contains('active')).toBe(false);

    window.scrollY = 600;
    window.dispatchEvent(new Event('scroll'));
    expect(btn.classList.contains('active')).toBe(true);

    const spy = jest.spyOn(window, 'scrollTo').mockImplementation(() => {});
    btn.click();
    expect(spy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });
});
