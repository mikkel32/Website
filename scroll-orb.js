let orb;
let ticking = false;

function update() {
  const offset = window.scrollY * 0.2;
  orb.style.transform = `translate3d(-50%, calc(-50% + ${offset}px), 0)`;
  ticking = false;
}

export function initScrollOrb() {
  orb = document.querySelector('.scroll-orb');
  if (!orb) return;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  });
}
