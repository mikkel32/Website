import { getAnime } from './anime-loader.js';
let animeModule;

export async function typeSubtitle(element, text, interval = 50) {
  element.textContent = '';
  element.classList.add('typing');
  for (const char of text) {
    await new Promise((r) => setTimeout(r, interval));
    element.textContent += char;
  }
  element.classList.remove('typing');
}

async function loadAnime() {
  animeModule = await getAnime();
}

export async function initHeroAnimations() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!animeModule) {
    await loadAnime();
  }

  if (!animeModule) {
    return;
  }

  const { animate, stagger, createTimeline } = animeModule;

  const subtitleEl = document.querySelector('.hero-subtitle');
  const subtitleText = subtitleEl?.textContent || '';
  if (subtitleEl) {
    subtitleEl.textContent = '';
  }

  if (reduceMotion) {
    document
      .querySelectorAll(
        '.hero-cinematic, .hero-title, .hero-buttons .btn, .shield-animation'
      )
      .forEach((el) => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
    document.querySelectorAll('.hero-shapes .shape').forEach((el) => {
      el.style.opacity = '0.6';
      el.style.transform = 'none';
    });
    if (subtitleEl) {
      subtitleEl.style.opacity = '1';
      await typeSubtitle(subtitleEl, subtitleText, 0);
    }
    return;
  }

  const introTl = createTimeline({ easing: 'easeOutExpo', duration: 800 });

  introTl
    .add({
      targets: '.hero-cinematic',
      opacity: [0, 1],
      scale: [0.8, 1],
      duration: 600,
    })
    .add(
      {
        targets: '.hero-cinematic',
        transform: [
          'perspective(400px) rotateX(-30deg) translateZ(-80px)',
          'perspective(1000px) rotateX(0deg) translateZ(0)',
        ],
        duration: 800,
      },
      0
    )
    .add(
      {
        targets: '.shield-animation',
        rotate: [-90, 0],
        scale: [0.5, 1],
        filter: [
          'drop-shadow(0 0 0 rgba(255,255,255,0))',
          'drop-shadow(0 0 25px rgba(255,255,255,0.6))',
        ],
        easing: 'easeOutBack',
        duration: 800,
      },
      '-=400'
    )
    .add(
      {
        targets: '.hero-shapes .shape',
        opacity: [0, 0.6],
        scale: [0.5, 1],
        translateZ: [-80, 0],
        delay: stagger(100),
        easing: 'easeOutCubic',
        duration: 700,
      },
      '-=600'
    );

  await introTl.finished;

  const tl = createTimeline({ easing: 'easeOutCubic', duration: 700 });

  tl.add({
    targets: '.hero-title',
    opacity: [0, 1],
    translateY: [40, 0],
  })
    .add({
      targets: '.hero-buttons .btn',
      opacity: [0, 1],
      translateY: [40, 0],
      delay: stagger(100),
      duration: 600,
    }, '-=300');


  animate('.hero-shapes .shape', {
    translateX: [0, 40],
    translateY: [0, -30],
    rotate: [0, 360],
    direction: 'alternate',
    loop: true,
    easing: 'easeInOutSine',
    delay: stagger(200, { start: 1200 }),
    duration: 6000,
  });

  if (subtitleEl) {
    await tl.finished;
    await animate(subtitleEl, {
      opacity: [0, 1],
      translateY: [40, 0],
      duration: 600,
      easing: 'easeOutCubic',
    }).finished;
    await typeSubtitle(subtitleEl, subtitleText, 75);
  }
}
