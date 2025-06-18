import "./src/styles/main.scss";
import { initTheme, initNavigation } from './theme.js';
import { initSearch } from './search.js';
import { NotificationSystem, initNotificationToggle } from './notifications.js';
import { setupSecurityDemo, securityFeatures } from './security-demo.js';
import { validateForm } from './utils.js';
import { initHeroAnimations } from './hero-animations.js';

document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  const navMenu = initNavigation();
  initHeroAnimations();

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

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  const scrollTopBtn = document.createElement('button');
  scrollTopBtn.className = 'scroll-top';
  scrollTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
  document.body.appendChild(scrollTopBtn);

  window.addEventListener('scroll', () => {
    if (window.scrollY > 500) {
      scrollTopBtn.classList.add('active');
    } else {
      scrollTopBtn.classList.remove('active');
    }
  });

  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  const preloader = document.getElementById('preloader');
  if (preloader) {
    preloader.classList.add('fade-out');
    preloader.addEventListener('transitionend', () => preloader.remove());
    document.body.classList.remove('no-scroll');
  }

  const notifications = new NotificationSystem();
  initNotificationToggle(notifications);
  await setupSecurityDemo(notifications);
  initSearch(navMenu);

  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (validateForm(contactForm)) {
        const messageField = contactForm.querySelector('#message');
        if (messageField && securityFeatures.scanInput(messageField.value)) {
          notifications.show('Potentially malicious input detected', 'error');
          return;
        }
        notifications.show('Message sent!', 'success');
        contactForm.reset();
      } else {
        notifications.show('Please fill out all required fields.', 'error');
      }
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

  window.addEventListener('beforeunload', () => {
    document.body.style.opacity = '0';
  });

  const resetOpacity = () => {
    document.body.style.opacity = '1';
  };
  window.addEventListener('load', resetOpacity);
  window.addEventListener('pageshow', resetOpacity);
});
