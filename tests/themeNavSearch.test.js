import { jest } from '@jest/globals';
import { initTheme, initNavigation } from '../theme.js';
import { initSearch } from '../search.js';

describe('initTheme', () => {
  test('applies OS preference when no saved theme', () => {
    document.body.innerHTML = `
      <button class="theme-toggle"><i class="fa fa-moon"></i></button>
      <div class="navbar"></div>
    `;
    localStorage.clear();
    const originalMatch = window.matchMedia;
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: jest.fn().mockReturnValue({ matches: true })
    });

    initTheme();
    expect(document.body.classList.contains('dark-mode')).toBe(true);
    const icon = document.querySelector('.theme-toggle i');
    expect(icon.classList.contains('fa-sun')).toBe(true);
    expect(localStorage.getItem('theme')).toBeNull();

    if (originalMatch === undefined) {
      delete window.matchMedia;
    } else {
      window.matchMedia = originalMatch;
    }
  });
  test('toggles dark mode and persists setting', () => {
    document.body.innerHTML = `
      <button class="theme-toggle"><i class="fa fa-moon"></i></button>
      <div class="navbar"></div>
    `;
    localStorage.clear();
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: () => ({ matches: false })
    });

    initTheme();
    const toggle = document.querySelector('.theme-toggle');
    toggle.click();
    expect(document.body.classList.contains('dark-mode')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');
    toggle.click();
    expect(document.body.classList.contains('dark-mode')).toBe(false);
    expect(localStorage.getItem('theme')).toBe('light');

    delete window.matchMedia;
  });
});

describe('initNavigation', () => {
  test('toggles nav menu active class and aria attributes', () => {
    document.body.innerHTML = `
      <button class="nav-toggle" aria-controls="mainNav" aria-expanded="false"><span></span><span></span><span></span></button>
      <ul id="mainNav" class="nav-menu"><li><a href="#home">Home</a></li></ul>
    `;

    const navMenu = initNavigation();
    const navToggle = document.querySelector('.nav-toggle');
    expect(navToggle.getAttribute('aria-expanded')).toBe('false');
    expect(navToggle.getAttribute('aria-controls')).toBe('mainNav');
    navToggle.click();
    expect(navMenu.classList.contains('active')).toBe(true);
    expect(navToggle.getAttribute('aria-expanded')).toBe('true');
    navToggle.click();
    expect(navMenu.classList.contains('active')).toBe(false);
    expect(navToggle.getAttribute('aria-expanded')).toBe('false');
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
