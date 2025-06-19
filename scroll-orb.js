let orb;
let enabled = true;
let throttleId = null;
let ticking = false;

function update() {
  if (!enabled) {
    ticking = false;
    return;
  }
  const offset = window.scrollY * 0.2;
  orb.style.transform = `translate3d(-50%, calc(-50% + ${offset}px), 0)`;
  ticking = false;
}

function checkWidth(threshold) {
  enabled = window.innerWidth >= threshold;
  if (!enabled) {
    orb.style.transform = 'translate3d(-50%, -50%, 0)';
  } else {
    update();
  }
}

export function initScrollOrb(threshold = 768) {
  orb = document.querySelector('.scroll-orb');
  if (!orb) return;
  checkWidth(threshold);
  window.addEventListener('resize', () => checkWidth(threshold));
  window.addEventListener('scroll', () => {
    if (!enabled) return;
    if (throttleId) return;
    throttleId = setTimeout(() => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
      throttleId = null;
    }, 20);
  });
}
