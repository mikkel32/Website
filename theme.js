export function initTheme() {
  const themeToggle = document.querySelector('.theme-toggle');
  const body = document.body;
  if (!themeToggle) return;
  const icon = themeToggle.querySelector('i');
  const navbar = document.querySelector('.navbar');
  let theme = localStorage.getItem('theme');

  if (!theme) {
    const prefersDark =
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    theme = prefersDark ? 'dark' : 'light';
  }

  if (theme === 'dark') {
    body.classList.add('dark-mode');
    icon.classList.replace('fa-moon', 'fa-sun');
  } else {
    body.classList.remove('dark-mode');
    icon.classList.replace('fa-sun', 'fa-moon');
  }

  themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');

    if (body.classList.contains('dark-mode')) {
      icon.classList.replace('fa-moon', 'fa-sun');
      localStorage.setItem('theme', 'dark');
      if (navbar) {
        navbar.style.background = 'rgb(15 23 42 / 60%)';
      }
    } else {
      icon.classList.replace('fa-sun', 'fa-moon');
      localStorage.setItem('theme', 'light');
      if (navbar) {
        navbar.style.background = 'rgb(255 255 255 / 60%)';
      }
    }
  });

  if (navbar) {
    navbar.style.background = body.classList.contains('dark-mode')
      ? 'rgb(15 23 42 / 60%)'
      : 'rgb(255 255 255 / 60%)';
    navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
  }
}

export function initNavigation() {
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');
  if (!navToggle || !navMenu) return navMenu;
  const spans = navToggle.querySelectorAll('span');

  navToggle.setAttribute('aria-controls', navMenu.id);
  navToggle.setAttribute(
    'aria-expanded',
    navMenu.classList.contains('active') ? 'true' : 'false',
  );

  const closeMenu = () => {
    navMenu.classList.remove('active');
    spans[0].style.transform = '';
    spans[1].style.opacity = '1';
    spans[2].style.transform = '';
    navToggle.setAttribute('aria-expanded', 'false');
    sessionStorage.removeItem('nav-state');
  };

  const openMenu = () => {
    navMenu.classList.add('active');
    spans[0].style.transform = 'rotate(-45deg) translate(-5px, 6px)';
    spans[1].style.opacity = '0';
    spans[2].style.transform = 'rotate(45deg) translate(-5px, -6px)';
    navToggle.setAttribute('aria-expanded', 'true');
    sessionStorage.setItem('nav-state', 'open');
  };

  navToggle.addEventListener('click', () => {
    if (navMenu.classList.contains('active')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  document.querySelectorAll('.nav-menu a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && navMenu.classList.contains('active')) {
      closeMenu();
    }
  });

  if (sessionStorage.getItem('nav-state') === 'open') {
    openMenu();
  }

  return navMenu;
}
