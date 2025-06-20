export async function initPreloader() {
  let anime;
  if (typeof process !== 'undefined' && process.env.JEST_WORKER_ID) {
    anime = () => {};
  } else {
    const mod = await import('animejs');
    anime = mod.default;
  }
  const preloader = document.getElementById('preloader');
  if (!preloader) return Promise.resolve();

  const shield = preloader.querySelector('.preloader-shield');
  const progressBar = preloader.querySelector('.progress-bar');

  anime({
    targets: shield,
    rotate: '360deg',
    duration: 1000,
    easing: 'linear',
    loop: true,
  });

  const duration = 3000;
  const start = Date.now();
  const images = Array.from(document.images);
  let loaded = images.filter((img) => img.complete).length;
  const total = images.length;

  return new Promise((resolve) => {
    function finish() {
      clearInterval(timer);
      progressBar.style.width = '100%';
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
    if (progress >= 100) {
      finish();
    }
  }, 50);

  const onLoad = () => {
    loaded += 1;
    if (loaded === total) {
      progressBar.style.width = '100%';
    }
  };

    images.forEach((img) => {
      if (!img.complete) {
        img.addEventListener('load', onLoad);
        img.addEventListener('error', onLoad);
      }
    });
  });
}
