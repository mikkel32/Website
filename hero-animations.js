import { animate, stagger } from 'animejs';

export function initHeroAnimations() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  animate('.hero-title', {
    opacity: [0, 1],
    translateY: [40, 0],
    duration: 700,
    ease: 'outCubic',
  });

  animate('.hero-subtitle', {
    opacity: [0, 1],
    translateY: [40, 0],
    duration: 700,
    delay: 200,
    ease: 'outCubic',
  });

  animate('.hero-buttons .btn', {
    opacity: [0, 1],
    translateY: [40, 0],
    delay: stagger(100, { start: 400 }),
    duration: 600,
    ease: 'outCubic',
  });

  animate('.shield-animation', {
    opacity: [0, 1],
    scale: [0.8, 1],
    duration: 800,
    delay: 600,
    ease: 'outBack',
  });
}
