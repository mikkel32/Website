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
  } else {
    shield.style.opacity = '0';
    shield.style.transition = 'opacity 0.4s linear';
    requestAnimationFrame(() => {
      shield.style.opacity = '1';
    });
    progressBar.style.transition = 'none';
  }

  const isPlaceholder = (img) =>
    img.src.startsWith('data:') && img.naturalWidth <= 1 && img.naturalHeight <= 1;

  const assets = [];
  const tracked = [];
  let loaded = 0;
  let resolveFn;

  function updateProgress() {
    const progress = assets.length ? Math.min(100, (loaded / assets.length) * 100) : 100;
    progressBar.style.width = `${progress}%`;
    progressBar.setAttribute('aria-valuenow', String(Math.round(progress)));
    if (progressText) progressText.textContent = `${Math.round(progress)}%`;
  }

  function maybeFinish() {
    if (loaded >= assets.length) {
      finish();
    }
  }

  function track(el, alreadyLoaded = false) {
    if (assets.includes(el)) return;
    assets.push(el);
    const handler = () => {
      loaded += 1;
      updateProgress();
      el.removeEventListener('load', handler);
      el.removeEventListener('error', handler);
      const index = tracked.findIndex((t) => t.el === el);
      if (index !== -1) tracked.splice(index, 1);
      maybeFinish();
    };

    if (alreadyLoaded) {
      loaded += 1;
      updateProgress();
      maybeFinish();
    } else {
      el.addEventListener('load', handler);
      el.addEventListener('error', handler);
      tracked.push({ el, handler });
    }
  }

  function finish() {
    clearTimeout(timeoutId);
    progressBar.style.width = '100%';
    progressBar.removeAttribute('aria-valuenow');
    if (progressText) progressText.textContent = '100%';
    document.body.removeAttribute('aria-busy');
    tracked.forEach(({ el, handler }) => {
      el.removeEventListener('load', handler);
      el.removeEventListener('error', handler);
    });
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

    const images = Array.from(document.images).filter((img) => !isPlaceholder(img));
    images.forEach((img) => track(img, img.complete));

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        if (m.type !== 'attributes') return;
        const el = m.target;
        if (m.attributeName === 'src') {
          if (el.tagName === 'IMG' && !isPlaceholder(el)) {
            track(el, el.complete);
          } else if (el.tagName === 'SCRIPT' && typeof el.dataset.src !== 'undefined') {
            track(el, el.readyState === 'complete' || el.readyState === 'loaded');
          }
        } else if (m.attributeName === 'href') {
          if (el.tagName === 'LINK' && el.rel === 'preload' && el.getAttribute('as') === 'font') {
            track(el);
          }
        }
      });
    });
    observer.observe(document.documentElement, {
      attributes: true,
      subtree: true,
      attributeFilter: ['src', 'href'],
    });

    Array.from(document.querySelectorAll('script[src]')).forEach((s) => {
      track(s, s.readyState === 'complete' || s.readyState === 'loaded');
    });

    Array.from(document.querySelectorAll('link[rel="stylesheet"]')).forEach((l) => {
      track(l, l.sheet !== null);
    });

    if (document.fonts) {
      assets.push(document.fonts);
      if (document.fonts.status === 'loaded') {
        loaded += 1;
        updateProgress();
        maybeFinish();
      } else {
        const fontHandler = () => {
          loaded += 1;
          updateProgress();
          document.fonts.removeEventListener('loadingdone', fontHandler);
          document.fonts.removeEventListener('loadingerror', fontHandler);
          maybeFinish();
        };
        document.fonts.addEventListener('loadingdone', fontHandler);
        document.fonts.addEventListener('loadingerror', fontHandler);
        tracked.push({ el: document.fonts, handler: fontHandler });
      }
    }

    if (assets.length === 0) {
      finish();
    } else {
      updateProgress();
      maybeFinish();
    }
  });
}
