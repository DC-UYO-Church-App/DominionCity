/* ============================================================================
   ENHANCEMENT LAYER — strictly optional, and deliberately tiny.
   ----------------------------------------------------------------------------
   The site is complete, legible and navigable before this runs. Two jobs:
     (1) Reveal [data-reveal] sections as they scroll in — via Intersection
         Observer, which costs almost nothing and, crucially, does NOT depend
         on any heavy library loading first. So content is never stuck blank
         waiting on a download, even on a slow phone.
     (2) Smooth (never hijacked) scrolling — Lenis, lazy-loaded separately, and
         only when motion is welcome.

   When motion is unwelcome (reduced-motion, save-data, low-power) we simply
   reveal everything at once and never touch Lenis.
   ========================================================================== */

export function runEnhance() {
  const reveals = () => Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
  const showAll = () => reveals().forEach((el) => el.classList.add('is-in'));

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = (navigator as any).connection?.saveData === true;
  const lowPower = (navigator.hardwareConcurrency ?? 8) <= 2;

  if (prefersReduced || saveData || lowPower || !('IntersectionObserver' in window)) {
    showAll();
    return;
  }

  // Reveal on scroll — light, immediate, library-free.
  const io = new IntersectionObserver(
    (entries, obs) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          obs.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
  );
  reveals().forEach((el) => io.observe(el));

  // Hard safety net: whatever happens, nothing stays invisible past 2.5s.
  window.setTimeout(showAll, 2500);

  // Smooth scroll is a separate, deferred nicety — its bytes are optional.
  const loadSmooth = () => import('./motion').then((m) => m.run()).catch(() => {});
  const w = window as any;
  if (typeof w.requestIdleCallback === 'function') {
    w.requestIdleCallback(loadSmooth, { timeout: 1500 });
  } else {
    window.addEventListener('load', () => setTimeout(loadSmooth, 250), { once: true });
  }
}
