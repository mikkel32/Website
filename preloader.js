import { getAnime } from './anime-loader.js';

export async function initPreloader() {
  let animate;
  let createTimeline;
  const preloader = document.getElementById('preloader');
  if (!preloader) return Promise.resolve();

  const shield = preloader.querySelector('.preloader-shield');
  const progressBar = preloader.querySelector('.progress-bar');
  const progressText = preloader.querySelector('.progress-text');

  document.body.setAttribute('aria-busy', 'true');
  progressBar.setAttribute('aria-valuenow', '0');
  if (progressText) progressText.textContent = '0%';

  const mod = await getAnime();
  animate = mod?.animate || mod?.default || (() => {});
  createTimeline = mod?.createTimeline || mod?.timeline || (() => ({ add: () => {}, finished: Promise.resolve() }));

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion) {
    animate(shield, {
      opacity: [0, 1],
      duration: 300,
      easing: 'easeOutCubic',
    });
  } else {
    const introTl = createTimeline({ easing: 'easeOutCubic', duration: 400 });
    introTl.add({
      targets: shield,
      translateY: [20, 0],
      scale: [0.5, 1],
      opacity: [0, 1],
    });
    animate(shield, {
      scale: [1, 1.1],
      duration: 800,
      easing: 'easeInOutSine',
      direction: 'alternate',
      loop: true,
    });
  }

  const duration = 3000;
  const start = Date.now();
  const images = Array.from(document.images);
  let loaded = images.filter((img) => img.complete).length;
  const total = images.length;
  const tracked = [];

  return new Promise((resolve) => {
    function finish() {
      clearInterval(timer);
      progressBar.style.width = '100%';
      progressBar.removeAttribute('aria-valuenow');
      if (progressText) progressText.textContent = '100%';
      document.body.removeAttribute('aria-busy');
      tracked.forEach(({ img, handler }) => {
        img.removeEventListener('load', handler);
        img.removeEventListener('error', handler);
      });
      preloader.classList.add('fade-out');
      preloader.addEventListener(
        'transitionend',
        () => {
          preloader.remove();
          document.body.classList.remove('no-scroll');
          resolve();
        },
        { once: true },
      );
    }

  const timer = setInterval(() => {
    const elapsed = Date.now() - start;
    let progress = Math.min(100, (elapsed / duration) * 100);
    if (loaded === total) {
      progress = 100;
    }
    progressBar.style.width = `${progress}%`;
    progressBar.setAttribute('aria-valuenow', String(Math.round(progress)));
    if (progressText) progressText.textContent = `${Math.round(progress)}%`;
    if (progress >= 100) {
      finish();
    }
  }, 50);

  images.forEach((img) => {
    if (!img.complete) {
      const handler = () => {
        loaded += 1;
        if (loaded === total) {
          progressBar.style.width = '100%';
          progressBar.setAttribute('aria-valuenow', '100');
          if (progressText) progressText.textContent = '100%';
        }
      };
      tracked.push({ img, handler });
      img.addEventListener('load', handler);
      img.addEventListener('error', handler);
    }
  });
  });
}
