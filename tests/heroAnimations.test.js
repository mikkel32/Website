import { jest } from '@jest/globals';
import { typeSubtitle } from '../hero-animations.js';

describe('typeSubtitle', () => {
  test('gradually inserts characters', async () => {
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
