export function initParallax() {
  const layers = Array.from(document.querySelectorAll('.parallax-layer'));
  if (layers.length === 0) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    layers.forEach((layer) => {
      layer.style.transform = 'none';
    });
    return;
  }

  const defaultSpeeds = [0.2, 0.4, 0.6];
  const update = () => {
    const y = window.scrollY;
    layers.forEach((layer, idx) => {
      const parsed = parseFloat(layer.dataset.speed);
      const speed = Number.isFinite(parsed)
        ? parsed
        : defaultSpeeds[idx % defaultSpeeds.length];
      const offset = y * speed;
      layer.style.transform = `translateY(${offset}px)`;
    });
  };

  update();
  window.addEventListener('scroll', () => {
    requestAnimationFrame(update);
  });
}
