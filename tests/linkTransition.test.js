import { jest } from '@jest/globals';
import { setupLinkTransitions } from '../main.js';

describe('link transitions', () => {
  test('internal link triggers fade and navigation', () => {
    document.body.innerHTML = '<a href="/about" id="go">About</a>';
    const cleanup = setupLinkTransitions();
    const link = document.getElementById('go');

    link.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(document.body.classList.contains('page-exit')).toBe(true);

    cleanup();
    document.body.classList.remove('page-exit');
  });

  test('external link bypasses fade', () => {
    document.body.innerHTML = '<a href="https://example.com" id="ext">Ext</a>';
    setupLinkTransitions();
    const link = document.getElementById('ext');
    const initialHref = window.location.href;

    link.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(document.body.classList.contains('page-exit')).toBe(false);
    expect(window.location.href).toBe(initialHref);
  });

  test('modifier click bypasses fade', () => {
    document.body.innerHTML = '<a href="/blog" id="mod">Blog</a>';
    setupLinkTransitions();
    const link = document.getElementById('mod');

    link.dispatchEvent(new MouseEvent('click', { bubbles: true, ctrlKey: true }));
    expect(document.body.classList.contains('page-exit')).toBe(false);
  });

  test('class removed on pageshow', () => {
    document.body.classList.add('page-exit');
    setupLinkTransitions();
    window.dispatchEvent(new Event('pageshow'));
    expect(document.body.classList.contains('page-exit')).toBe(false);
  });
});
