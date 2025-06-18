export function initSearch(navMenu) {
  const searchOverlay = document.getElementById('searchOverlay');
  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');
  const searchButton = document.querySelector('.search-toggle');
  const searchClose = document.querySelector('.search-close');
  let searchIndex = [];

  function openSearch() {
    searchOverlay.classList.add('active');
    searchOverlay.setAttribute('aria-hidden', 'false');
    if (searchButton) {
      searchButton.setAttribute('aria-expanded', 'true');
    }
    searchInput.value = '';
    searchResults.innerHTML = '';
    searchInput.focus();
    document.body.classList.add('no-scroll');
  }

  function closeSearch() {
    searchOverlay.classList.remove('active');
    searchOverlay.setAttribute('aria-hidden', 'true');
    if (searchButton) {
      searchButton.setAttribute('aria-expanded', 'false');
    }
    document.body.classList.remove('no-scroll');
  }

  if (searchButton) searchButton.addEventListener('click', openSearch);
  if (searchClose) searchClose.addEventListener('click', closeSearch);

  searchIndex = Array.from(document.querySelectorAll('section[id]')).map((sec) => ({
    id: sec.id,
    title: sec.querySelector('h1, h2, h3')?.textContent || sec.id,
    text: sec.textContent.toLowerCase(),
  }));

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim().toLowerCase();
    searchResults.innerHTML = '';
    if (!query) return;
    const matches = searchIndex.filter(
      (item) => item.title.toLowerCase().includes(query) || item.text.includes(query),
    );
    matches.forEach((item) => {
      const li = document.createElement('li');
      li.innerHTML = `<a href="#${item.id}" data-close-search>${item.title}</a>`;
      searchResults.appendChild(li);
    });
  });

  searchResults.addEventListener('click', (e) => {
    if (e.target.matches('[data-close-search]')) {
      closeSearch();
    }
  });

  searchOverlay.addEventListener('click', (e) => {
    if (e.target === searchOverlay) {
      closeSearch();
    }
  });

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      openSearch();
    }

    if (e.key === 'Escape') {
      if (searchOverlay.classList.contains('active')) {
        closeSearch();
        return;
      }
      if (navMenu && navMenu.classList.contains('active')) {
        navMenu.classList.remove('active');
      }
    }
  });
}
