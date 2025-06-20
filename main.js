if (typeof process === 'undefined' || process.env?.NODE_ENV !== 'production') {
  import('./error-capture.js');
}
import { initTheme, initNavigation } from './theme.js';
import { initSearch } from './search.js';
import { NotificationSystem, initNotificationToggle } from './notifications.js';
import { setupSecurityDemo, securityFeatures } from './security-demo.js';
import {
  validateForm,
  getCSRFToken,
  validateCSRFToken,
  attachTiltEffect,
} from './utils.js';
import { initHeroAnimations } from './hero-animations.js';
import { initScrollOrb } from './scroll-orb.js';
import { initParallax } from './parallax.js';
import { initPreloader } from './preloader.js';
import { initScrollTopButton } from './scroll-top.js';

export function setupLinkTransitions() {
  const reset = () => document.body.classList.remove('page-exit');

  const handleClick = (e) => {
    if (
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey
    ) {
      return;
    }

    const link = e.target.closest('a[href]');
    if (!link) return;

    const url = new URL(link.href, window.location.href);
    if (
      link.target === '_blank' ||
      url.origin !== window.location.origin ||
      (url.hash && url.pathname === window.location.pathname)
    ) {
      return;
    }

    e.preventDefault();
    document.body.classList.add('page-exit');
    const navigate = () => {
      document.body.removeEventListener('transitionend', navigate);
      window.location.assign(link.href);
    };
    document.body.addEventListener('transitionend', navigate);
  };

  document.addEventListener('click', handleClick);
  window.addEventListener('pageshow', reset);
  window.addEventListener('load', reset);

  return () => document.removeEventListener('click', handleClick);
}

export function initSectionBackgrounds() {
  const sectionClasses = {
    features: 'section-features-active',
    services: 'section-services-active',
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          Object.values(sectionClasses).forEach((cls) =>
            document.body.classList.remove(cls),
          );
          const cls = sectionClasses[entry.target.id];
          if (cls) document.body.classList.add(cls);
        }
      });
    },
    { threshold: 0.5 },
  );

  Object.keys(sectionClasses).forEach((id) => {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  });

  return observer;
}

if (window.location.protocol === 'file:') {
  document.addEventListener('DOMContentLoaded', () => {
    document.body.innerHTML =
      '<p class="file-protocol-message">Please run this site via a local server (e.g., <code>python security.py</code>) to avoid CORS issues.</p>';
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  await initPreloader();
  initTheme();
  const navMenu = initNavigation();
  await initHeroAnimations();
  initParallax();
  initScrollOrb();
  initSectionBackgrounds();

  const counters = document.querySelectorAll('.stat-number');
  const speed = 200;
  const animateCounters = () => {
    counters.forEach((counter) => {
      const updateCount = () => {
        const target = +counter.getAttribute('data-target');
        const count = +counter.innerText;
        const inc = target / speed;
        if (count < target) {
          counter.innerText = Math.ceil(count + inc);
          setTimeout(updateCount, 1);
        } else {
          counter.innerText = target;
        }
      };
      updateCount();
    });
  };

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px',
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        if (entry.target.classList.contains('stat-item')) {
          animateCounters();
        }
        if (prefersReducedMotion) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'none';
        } else {
          entry.target.classList.add('in-view');
        }
        obs.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.feature-card, .service-item, .stat-item').forEach((el) => {
    el.classList.add('reveal');
    observer.observe(el);
  });

  document.querySelectorAll('.feature-card').forEach((card) => {
    attachTiltEffect(card);
  });

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  initScrollTopButton();


  const notifications = new NotificationSystem();
  initNotificationToggle(notifications);
  await setupSecurityDemo(notifications);
  initSearch(navMenu);

  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    const tokenInput = document.createElement('input');
    tokenInput.type = 'hidden';
    tokenInput.name = 'csrf_token';
    contactForm.appendChild(tokenInput);

    async function refreshToken() {
      try {
        const res = await fetch('/csrf-token');
        if (res.ok) {
          const data = await res.json();
          tokenInput.value = data.token;
          sessionStorage.setItem('csrfToken', data.token);
          return;
        }
      } catch {
        // ignore network failures and fall back to generated token
      }
      const fallback = getCSRFToken();
      tokenInput.value = fallback;
      notifications.show('Using local security token', 'info');
    }

    await refreshToken();

    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validateForm(contactForm)) {
        notifications.show('Please fill out all required fields.', 'error');
        return;
      }

      const messageField = contactForm.querySelector('#message');
      if (messageField && securityFeatures.scanInput(messageField.value)) {
        notifications.show('Potentially malicious input detected', 'error');
        await refreshToken();
        return;
      }

      if (!validateCSRFToken(tokenInput.value)) {
        notifications.show('Invalid session token', 'error');
        await refreshToken();
        return;
      }

      const payload = {
        name: contactForm.querySelector('#name').value,
        email: contactForm.querySelector('#email').value,
        message: messageField.value,
        csrf_token: tokenInput.value,
      };

      try {
        const response = await fetch('/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (response.ok && data.status === 'ok') {
          notifications.show('Message sent!', 'success');
          contactForm.reset();
        } else {
          notifications.show(data.message || 'Submission failed', 'error');
        }
      } catch {
        notifications.show('Server error', 'error');
      }

      await refreshToken();
    });
  }

  const lazyImages = document.querySelectorAll('img.lazy-image[data-src]');
  const imageObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.addEventListener(
            'load',
            () => img.classList.add('loaded'),
            { once: true },
          );
          img.removeAttribute('data-src');
          obs.unobserve(img);
        }
      });
    },
    { rootMargin: '0px 0px 200px 0px' },
  );
  lazyImages.forEach((img) => imageObserver.observe(img));

  setupLinkTransitions();
});

function parseRetryAfter(value) {
  if (!value) return 0;
  const secs = parseInt(value, 10);
  if (!Number.isNaN(secs)) return secs * 1000;
  const date = Date.parse(value);
  if (!Number.isNaN(date)) return Math.max(date - Date.now(), 0);
  return 0;
}

async function registerServiceWorkerWithRetry(url = '/service-worker.js', attempts = 3) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { headers: { 'Service-Worker': 'script' } });
      if (res.status === 429) {
        const delay = parseRetryAfter(res.headers.get('Retry-After')) || 1000;
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      if (!res.ok) {
        // eslint-disable-next-line no-console
        console.error(`Service worker script error: ${res.status}`);
        return;
      }
      await navigator.serviceWorker.register(url);
      return;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Service worker registration failed:', err);
      return;
    }
  }
  // eslint-disable-next-line no-console
  console.error('Service worker registration aborted after retries');
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    registerServiceWorkerWithRetry();
  });
}
