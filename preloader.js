import { getAnime } from './anime-loader.js';

class Preloader {
  constructor({ preloader, shield, progressBar, progressText, timeout = 5000, reduceMotion }) {
    this.preloader = preloader;
    this.shield = shield;
    this.progressBar = progressBar;
    this.progressText = progressText;
    this.timeout = timeout;
    this.reduceMotion = reduceMotion;
    this.assets = new Set();
    this.tracked = new Map();
    this.loaded = 0;
    this.resolve = null;
    this.observer = null;
    this.timeoutId = null;
    this.preloadMap = new Map();
    this.noop = () => {};
    this.animate = this.noop;
    this.createTimeline = () => ({ add: () => {}, finished: Promise.resolve() });
  }

  trackPromise(promise) {
    if (this.assets.has(promise)) return;
    this.assets.add(promise);
    promise.finally(() => {
      this.loaded += 1;
      this.updateProgress();
      this.maybeFinish();
    });
  }

  preloadResource(href) {
    if (!href || this.preloadMap.has(href)) return;
    const p = fetch(href, { cache: 'force-cache', mode: 'no-cors', credentials: 'same-origin' }).catch(() => {});
    this.preloadMap.set(href, p);
    this.trackPromise(p);
  }

  trackElement(el, alreadyLoaded = false) {
    if (this.assets.has(el)) return;
    this.assets.add(el);
    const handler = () => {
      this.loaded += 1;
      this.updateProgress();
      el.removeEventListener('load', handler);
      el.removeEventListener('error', handler);
      const h = this.tracked.get(el);
      if (h) this.tracked.delete(el);
      this.maybeFinish();
    };
    if (alreadyLoaded) {
      this.loaded += 1;
      this.updateProgress();
      this.maybeFinish();
    } else {
      el.addEventListener('load', handler);
      el.addEventListener('error', handler);
      this.tracked.set(el, handler);
    }
  }

  updateProgress() {
    const total = this.assets.size;
    const progress = total ? Math.min(100, (this.loaded / total) * 100) : 100;
    this.progressBar.style.width = `${progress}%`;
    this.progressBar.setAttribute('aria-valuenow', String(Math.round(progress)));
    if (this.progressText) this.progressText.textContent = `${Math.round(progress)}%`;
  }

  preloadFonts() {
    if (!document.fonts || typeof document.fonts.load !== 'function') return [];
    const families = ['Poppins', 'Font Awesome 6 Free', 'Font Awesome 6 Brands'];
    return families.map((f) => document.fonts.load(`1em ${f}`));
  }

  isPlaceholder(img) {
    return img.src.startsWith('data:') && img.naturalWidth <= 1 && img.naturalHeight <= 1;
  }

  maybeFinish() {
    if (this.loaded >= this.assets.size) {
      this.finish();
    }
  }

  finish() {
    clearTimeout(this.timeoutId);
    this.progressBar.style.width = '100%';
    this.progressBar.removeAttribute('aria-valuenow');
    if (this.progressText) this.progressText.textContent = '100%';
    document.body.removeAttribute('aria-busy');
    this.tracked.forEach((handler, el) => {
      el.removeEventListener('load', handler);
      el.removeEventListener('error', handler);
    });
    if (this.observer) {
      this.observer.disconnect();
    }
    this.preloader.classList.add('fade-out');
    this.preloader.addEventListener(
      'transitionend',
      () => {
        this.preloader.remove();
        document.body.classList.remove('no-scroll');
        if (this.resolve) this.resolve();
      },
      { once: true },
    );
  }

  observeDOM() {
    const checkAndTrack = (el) => {
      if (el.hasAttribute && el.hasAttribute('src')) {
        if (el.tagName === 'IMG' && !this.isPlaceholder(el)) {
          this.trackElement(el, el.complete);
        } else if (el.tagName === 'SCRIPT') {
          this.trackElement(el, el.readyState === 'complete' || el.readyState === 'loaded');
        }
      }
      if (el.hasAttribute && el.hasAttribute('href')) {
        if (el.tagName === 'LINK' && el.rel === 'preload') {
          const as = el.getAttribute('as');
          if (as === 'font') {
            this.trackElement(el);
          } else {
            this.preloadResource(el.href);
          }
        }
      }
    };

    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        if (m.type === 'attributes') {
          checkAndTrack(m.target);
        } else if (m.type === 'childList') {
          m.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              checkAndTrack(node);
              node.querySelectorAll && node.querySelectorAll('[src],[href]').forEach((el) => checkAndTrack(el));
            }
          });
        }
      });
    });
    this.observer.observe(document.documentElement, {
      attributes: true,
      subtree: true,
      attributeFilter: ['src', 'href'],
      childList: true,
    });
  }

  trackInitialAssets() {
    this.preloadFonts().forEach((p) => this.trackPromise(p));

    const images = Array.from(document.images).filter((img) => !this.isPlaceholder(img));
    images.forEach((img) => this.trackElement(img, img.complete));

    Array.from(document.querySelectorAll('script[src]')).forEach((s) => {
      this.trackElement(s, s.readyState === 'complete' || s.readyState === 'loaded');
    });

    Array.from(document.querySelectorAll('link[rel="stylesheet"]')).forEach((l) => {
      this.trackElement(l, l.sheet !== null);
    });

    if (document.fonts) {
      this.assets.add(document.fonts);
      if (document.fonts.status === 'loaded') {
        this.loaded += 1;
        this.updateProgress();
        this.maybeFinish();
      } else {
        const fontHandler = () => {
          this.loaded += 1;
          this.updateProgress();
          if ('onloadingdone' in document.fonts) {
            document.fonts.removeEventListener('loadingdone', fontHandler);
            document.fonts.removeEventListener('loadingerror', fontHandler);
          }
          this.maybeFinish();
        };
        if ('onloadingdone' in document.fonts) {
          document.fonts.addEventListener('loadingdone', fontHandler);
          document.fonts.addEventListener('loadingerror', fontHandler);
          this.tracked.set(document.fonts, fontHandler);
        } else if (document.fonts.ready) {
          document.fonts.ready.then(fontHandler, fontHandler);
        }
      }
    }

    // preload link[rel=preload]
    Array.from(document.querySelectorAll('link[rel="preload"]')).forEach((link) => {
      const href = link.href;
      if (!href) return;
      const as = link.getAttribute('as');
      if (as === 'font') {
        this.trackElement(link);
      } else {
        this.preloadResource(href);
      }
    });

    if (this.assets.size === 0) {
      this.finish();
    } else {
      this.updateProgress();
      this.maybeFinish();
    }
  }

  async setupAnimations() {
    if (this.reduceMotion) {
      this.shield.style.opacity = '1';
      return;
    }

    const mod = await getAnime();
    if (mod) {
      this.animate = mod.animate || mod.default || this.noop;
      this.createTimeline =
        mod.createTimeline || mod.timeline || (() => ({ add: () => {}, finished: Promise.resolve() }));
    }

    if (this.animate === this.noop) {
      this.shield.style.opacity = '0';
      this.shield.style.transition = 'opacity 0.4s linear';
      requestAnimationFrame(() => {
        this.shield.style.opacity = '1';
      });
      this.progressBar.style.transition = 'none';
      return;
    }

    this.shield.style.opacity = '0';
    const introTl = this.createTimeline({ easing: 'easeOutCubic', duration: 600 });
    introTl.add({
      targets: this.shield,
      rotate: [0, 360],
      scale: [0.5, 1],
      opacity: [0, 1],
      filter: ['drop-shadow(0 0 0 rgba(0,0,0,0))', 'drop-shadow(var(--shadow-glow))'],
    });
    await Promise.resolve(introTl.finished);
    this.animate(this.shield, {
      scale: [1, 1.1],
      duration: 800,
      easing: 'easeInOutSine',
      direction: 'alternate',
      loop: true,
    });
  }

  prefetchModules() {
    document.querySelectorAll('link[rel="modulepreload"]').forEach((link) => {
      if (link.href) {
        import(link.href).catch(() => {});
      }
    });
    document.querySelectorAll('script[data-preload-module]').forEach((s) => {
      const src = s.dataset.src || s.src;
      if (src) {
        import(src).catch(() => {});
      }
    });
  }

  start() {
    document.body.setAttribute('aria-busy', 'true');
    this.progressBar.setAttribute('aria-valuenow', '0');
    if (this.progressText) this.progressText.textContent = '0%';
    this.progressBar.style.width = '0%';

    return new Promise((resolve) => {
      this.resolve = resolve;
      this.timeoutId = setTimeout(() => this.finish(), this.timeout);
      this.trackInitialAssets();
      this.observeDOM();
      this.prefetchModules();
      this.setupAnimations();
    });
  }
}

export async function initPreloader(options = {}) {
  const { timeout = 5000 } = options;
  const preloader = document.getElementById('preloader');
  if (!preloader) return Promise.resolve();

  const shield = preloader.querySelector('.preloader-shield');
  const progressBar = preloader.querySelector('.progress-bar');
  const progressText = preloader.querySelector('.progress-text');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const loader = new Preloader({
    preloader,
    shield,
    progressBar,
    progressText,
    timeout,
    reduceMotion,
  });
  return loader.start();
}
