let orb;
let ticking = false;

function update() {
  const scrollRatio = window.scrollY / document.body.scrollHeight;
  const offsetY = window.scrollY * 0.2;
  const offsetX = Math.sin(scrollRatio * Math.PI * 2) * 50;
  const scale = 1 + scrollRatio * 0.5;
  orb.style.transform =
    `translate3d(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px), 0) scale(${scale})`;
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
