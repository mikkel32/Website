import { getAnime } from './anime-loader.js';

export async function initPreloader(options = {}) {
  const { timeout = 5000 } = options;
  const preloader = document.getElementById('preloader');
  if (!preloader) return Promise.resolve();

  const shield = preloader.querySelector('.preloader-shield');
  const progressBar = preloader.querySelector('.progress-bar');
  const progressText = preloader.querySelector('.progress-text');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let animate = () => {};
  let createTimeline = () => ({ add: () => {}, finished: Promise.resolve() });
  let animeLoaded = false;

  if (!reduceMotion) {
    const mod = await getAnime();
    if (mod) {
      animeLoaded = true;
      animate = mod.animate || mod.default || (() => {});
      createTimeline =
        mod.createTimeline || mod.timeline || (() => ({ add: () => {}, finished: Promise.resolve() }));
    }
  }

  document.body.setAttribute('aria-busy', 'true');
  progressBar.setAttribute('aria-valuenow', '0');
  if (progressText) progressText.textContent = '0%';

  if (!reduceMotion && animeLoaded) {
    shield.style.opacity = '0';
    const introTl = createTimeline({ easing: 'easeOutCubic', duration: 600 });
    introTl.add({
      targets: shield,
      rotate: [0, 360],
      scale: [0.5, 1],
      opacity: [0, 1],
      filter: ['drop-shadow(0 0 0 rgba(0,0,0,0))', 'drop-shadow(var(--shadow-glow))'],
    });
    Promise.resolve(introTl.finished).then(() => {
      animate(shield, {
        scale: [1, 1.1],
        duration: 800,
        easing: 'easeInOutSine',
        direction: 'alternate',
        loop: true,
      });
    });
  } else if (!reduceMotion) {
    shield.style.opacity = '0';
    shield.style.transition = 'opacity 0.4s linear';
    requestAnimationFrame(() => {
      shield.style.opacity = '1';
    });
    progressBar.style.transition = 'none';
  } else {
    shield.style.opacity = '1';
  }

  const isPlaceholder = (img) =>
    img.src.startsWith('data:') && img.naturalWidth <= 1 && img.naturalHeight <= 1;

  const assets = new Set();
  const tracked = new Map();
  let loaded = 0;
  let resolveFn;
  let observer;

  function trackPromise(p) {
    if (assets.has(p)) return;
    assets.add(p);
    p.finally(() => {
      loaded += 1;
      updateProgress();
      maybeFinish();
    });
  }

  function updateProgress() {
    const total = assets.size;
    const progress = total ? Math.min(100, (loaded / total) * 100) : 100;
    progressBar.style.width = `${progress}%`;
    progressBar.setAttribute('aria-valuenow', String(Math.round(progress)));
    if (progressText) progressText.textContent = `${Math.round(progress)}%`;
  }

  function preloadFonts() {
    if (!document.fonts || typeof document.fonts.load !== 'function') return [];
    const families = ['Poppins', 'Font Awesome 6 Free', 'Font Awesome 6 Brands'];
    return families.map((f) => document.fonts.load(`1em ${f}`));
  }

  function maybeFinish() {
    if (loaded >= assets.size) {
      finish();
    }
  }

  function track(el, alreadyLoaded = false) {
    if (assets.has(el)) return;
    assets.add(el);
    const handler = () => {
      loaded += 1;
      updateProgress();
      el.removeEventListener('load', handler);
      el.removeEventListener('error', handler);
      const handlerRef = tracked.get(el);
      if (handlerRef) tracked.delete(el);
      maybeFinish();
    };

    if (alreadyLoaded) {
      loaded += 1;
      updateProgress();
      maybeFinish();
    } else {
      el.addEventListener('load', handler);
      el.addEventListener('error', handler);
      tracked.set(el, handler);
    }
  }

  function finish() {
    clearTimeout(timeoutId);
    progressBar.style.width = '100%';
    progressBar.removeAttribute('aria-valuenow');
    if (progressText) progressText.textContent = '100%';
    document.body.removeAttribute('aria-busy');
    tracked.forEach((handler, el) => {
      el.removeEventListener('load', handler);
      el.removeEventListener('error', handler);
    });
    if (observer) {
      observer.disconnect();
    }
    preloader.classList.add('fade-out');
    preloader.addEventListener(
      'transitionend',
      () => {
        preloader.remove();
        document.body.classList.remove('no-scroll');
        resolveFn();
      },
      { once: true },
    );
  }

  const timeoutId = setTimeout(finish, timeout);

  return new Promise((resolve) => {
    resolveFn = resolve;

    preloadFonts().forEach((p) => trackPromise(p));

    const images = Array.from(document.images).filter((img) => !isPlaceholder(img));
    images.forEach((img) => track(img, img.complete));

    const checkAndTrack = (el) => {
      if (el.hasAttribute && el.hasAttribute('src')) {
        if (el.tagName === 'IMG' && !isPlaceholder(el)) {
          track(el, el.complete);
        } else if (el.tagName === 'SCRIPT') {
          if (typeof el.dataset.src !== 'undefined') {
            track(el, el.readyState === 'complete' || el.readyState === 'loaded');
          } else {
            track(el, el.readyState === 'complete' || el.readyState === 'loaded');
          }
        }
      }
      if (el.hasAttribute && el.hasAttribute('href')) {
        if (el.tagName === 'LINK' && el.rel === 'preload' && el.getAttribute('as') === 'font') {
          track(el);
        }
      }
    };

    observer = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        if (m.type === 'attributes') {
          checkAndTrack(m.target);
        } else if (m.type === 'childList') {
          m.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              checkAndTrack(node);
              node.querySelectorAll &&
                node.querySelectorAll('[src],[href]').forEach((el) => checkAndTrack(el));
            }
          });
        }
      });
    });
    observer.observe(document.documentElement, {
      attributes: true,
      subtree: true,
      attributeFilter: ['src', 'href'],
      childList: true,
    });

    Array.from(document.querySelectorAll('script[src]')).forEach((s) => {
      track(s, s.readyState === 'complete' || s.readyState === 'loaded');
    });

    Array.from(document.querySelectorAll('link[rel="stylesheet"]')).forEach((l) => {
      track(l, l.sheet !== null);
    });

    if (document.fonts) {
      assets.add(document.fonts);
      if (document.fonts.status === 'loaded') {
        loaded += 1;
        updateProgress();
        maybeFinish();
      } else {
        const fontHandler = () => {
          loaded += 1;
          updateProgress();
          if ('onloadingdone' in document.fonts) {
            document.fonts.removeEventListener('loadingdone', fontHandler);
            document.fonts.removeEventListener('loadingerror', fontHandler);
          }
          maybeFinish();
        };
        if ('onloadingdone' in document.fonts) {
          document.fonts.addEventListener('loadingdone', fontHandler);
          document.fonts.addEventListener('loadingerror', fontHandler);
          tracked.set(document.fonts, fontHandler);
        } else if (document.fonts.ready) {
          document.fonts.ready.then(fontHandler, fontHandler);
        }
      }
    }

    if (assets.size === 0) {
      finish();
    } else {
      updateProgress();
      maybeFinish();
    }
  });
}
