import { initSearch } from '../search.js';

describe('search overlay keyboard and mouse interactions', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <button class="search-toggle"></button>
      <div id="searchOverlay" class="search-overlay" aria-hidden="true">
        <div class="search-box">
          <button class="search-close"></button>
          <input id="searchInput" />
          <ul id="searchResults"></ul>
        </div>
      </div>
      <section id="sec1"><h2>First Item</h2></section>
      <section id="sec2"><h2>Second Feature</h2></section>
    `;
    const navMenu = document.createElement('div');
    initSearch(navMenu);
  });

  test('opens with Ctrl+K and closes with Escape', () => {
    const overlay = document.getElementById('searchOverlay');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    expect(overlay.classList.contains('active')).toBe(true);
    expect(overlay.getAttribute('aria-hidden')).toBe('false');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(overlay.classList.contains('active')).toBe(false);
    expect(overlay.getAttribute('aria-hidden')).toBe('true');
  });

  test('clicking overlay backdrop closes it', () => {
    const overlay = document.getElementById('searchOverlay');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(overlay.classList.contains('active')).toBe(false);
  });

  test('typing shows results and clicking one closes overlay', () => {
    const overlay = document.getElementById('searchOverlay');
    const input = document.getElementById('searchInput');
    const results = document.getElementById('searchResults');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    input.value = 'second';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const link = results.querySelector('a');
    expect(link).not.toBeNull();
    link.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(overlay.classList.contains('active')).toBe(false);
  });
});
