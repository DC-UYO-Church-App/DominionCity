/* Smooth scroll only. Lazy-loaded after first paint, and only when motion is
   welcome. Lenis SMOOTHS native scrolling — it never hijacks it: wheel, keys,
   trackpad and scrollbar all keep working exactly as expected. */
import Lenis from 'lenis';

export function run() {
  const lenis = new Lenis({
    duration: 1.05,
    easing: (t: number) => 1 - Math.pow(1 - t, 3),
    smoothWheel: true,
    touchMultiplier: 1.4,
  });

  const raf = (time: number) => {
    lenis.raf(time);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);

  // In-page anchor links (e.g. "Begin", "Other ways to give") glide smoothly.
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (ev) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (target) {
        ev.preventDefault();
        lenis.scrollTo(target as HTMLElement, { offset: -72 });
      }
    });
  });
}
