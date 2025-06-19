import { initTheme, initNavigation } from '../theme.js';
import { initSearch } from '../search.js';

describe('initTheme', () => {
  test('toggles dark mode and persists setting', () => {
    document.body.innerHTML = `
      <button class="theme-toggle"><i class="fa fa-moon"></i></button>
      <div class="navbar"></div>
    `;
    const storage = new Map();
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: (k) => storage.get(k),
        setItem: (k, v) => storage.set(k, v)
      }
    });

    initTheme();
    const toggle = document.querySelector('.theme-toggle');
    toggle.click();
    expect(document.body.classList.contains('dark-mode')).toBe(true);
    expect(storage.get('theme')).toBe('dark');
    toggle.click();
    expect(document.body.classList.contains('dark-mode')).toBe(false);
    expect(storage.get('theme')).toBe('light');
  });
});

describe('initNavigation', () => {
  test('toggles nav menu active class', () => {
    document.body.innerHTML = `
      <button class="nav-toggle"><span></span><span></span><span></span></button>
      <ul class="nav-menu"><li><a href="#home">Home</a></li></ul>
    `;

    const navMenu = initNavigation();
    const navToggle = document.querySelector('.nav-toggle');
    navToggle.click();
    expect(navMenu.classList.contains('active')).toBe(true);
    navToggle.click();
    expect(navMenu.classList.contains('active')).toBe(false);
  });
});

describe('initSearch', () => {
  test('opens and closes search overlay', () => {
    document.body.innerHTML = `
      <button class="search-toggle"></button>
      <div id="searchOverlay" class="search-overlay" aria-hidden="true">
        <div class="search-box">
          <button class="search-close"></button>
          <input id="searchInput" />
          <ul id="searchResults"></ul>
        </div>
      </div>
    `;
    const navMenu = document.createElement('div');
    initSearch(navMenu);
    const searchButton = document.querySelector('.search-toggle');
    const searchOverlay = document.getElementById('searchOverlay');
    const searchClose = document.querySelector('.search-close');
    searchButton.click();
    expect(searchOverlay.classList.contains('active')).toBe(true);
    expect(searchOverlay.getAttribute('aria-hidden')).toBe('false');
    searchClose.click();
    expect(searchOverlay.classList.contains('active')).toBe(false);
    expect(searchOverlay.getAttribute('aria-hidden')).toBe('true');
  });

  test('returns focus to toggle when closing', () => {
    document.body.innerHTML = `
      <button class="search-toggle"></button>
      <div id="searchOverlay" class="search-overlay" aria-hidden="true">
        <div class="search-box">
          <button class="search-close"></button>
          <input id="searchInput" />
          <ul id="searchResults"></ul>
        </div>
      </div>
    `;
    const navMenu = document.createElement('div');
    initSearch(navMenu);
    const searchButton = document.querySelector('.search-toggle');
    const searchClose = document.querySelector('.search-close');
    searchButton.click();
    searchClose.click();
    expect(document.activeElement).toBe(searchButton);
  });
});
