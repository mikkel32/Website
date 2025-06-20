export function initParallax() {
  const shapes = document.querySelector('.hero-shapes');
  if (!shapes) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    shapes.style.transform = 'none';
    return;
  }
  const update = () => {
    const offset = window.scrollY * 0.3;
    shapes.style.transform = `translateY(${offset}px)`;
  };
  update();
  window.addEventListener('scroll', () => {
    requestAnimationFrame(update);
  });
}
