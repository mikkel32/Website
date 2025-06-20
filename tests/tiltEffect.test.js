import { jest } from '@jest/globals';
import { attachTiltEffect } from '../utils.js';

describe('attachTiltEffect', () => {
  test('applies rotation on mousemove', () => {
    document.body.innerHTML = '<div class="feature-card" style="width:100px;height:100px;"></div>';
    const card = document.querySelector('.feature-card');
    card.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100 });
    window.matchMedia = jest.fn().mockReturnValue({ matches: false });
    attachTiltEffect(card);
    const event = new MouseEvent('mousemove', { clientX: 50, clientY: 0, bubbles: true });
    card.dispatchEvent(event);
    expect(card.style.transform).not.toBe('');
  });
});

