import anime from 'animejs/lib/anime.es.js';

export function initHeroAnimations() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  anime({
    targets: '.hero-title',
    opacity: [0, 1],
    translateY: [40, 0],
    duration: 700,
    easing: 'easeOutCubic',
  });

  anime({
    targets: '.hero-subtitle',
    opacity: [0, 1],
    translateY: [40, 0],
    duration: 700,
    delay: 200,
    easing: 'easeOutCubic',
  });

  anime({
    targets: '.hero-buttons .btn',
    opacity: [0, 1],
    translateY: [40, 0],
    delay: anime.stagger(100, { start: 400 }),
    duration: 600,
    easing: 'easeOutCubic',
  });

  anime({
    targets: '.shield-animation',
    opacity: [0, 1],
    scale: [0.8, 1],
    duration: 800,
    delay: 600,
    easing: 'easeOutBack',
  });
}
