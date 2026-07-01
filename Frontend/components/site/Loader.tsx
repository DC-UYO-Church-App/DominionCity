'use client';

/* Homepage preloader — a brief, on-brand "ignition" before the hero.
   Deep nightfall stage, twin gold orbital rings sweeping the crowned-towers
   glyph, the wordmark resolving in, and a gold progress sweep.

   Safety first (the site must never be trapped behind this):
     • Scroll is locked ONLY by JS (html.is-loading) and released by JS, so a
       visitor with JS off is never stuck — they just see content immediately.
     • A CSS auto-hide fades the overlay even if the script never runs.
     • A hard timeout caps how long it can show; reduced-motion shortens it all.
*/
import { useEffect, useRef } from 'react';
import './Loader.css';

export default function Loader() {
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    const loader = loaderRef.current;
    if (!loader) return;

    html.classList.add('is-loading'); // lock scroll (JS-only, so no-JS is never trapped)

    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const MIN = reduce ? 300 : 1500;   // let the animation breathe
    const start = performance.now();
    let done = false;

    const dismiss = () => {
      if (done) return;
      done = true;
      const wait = Math.max(0, MIN - (performance.now() - start));
      setTimeout(() => {
        loader.classList.add('is-done');
        html.classList.remove('is-loading');
        const kill = () => loader.remove();
        loader.addEventListener('transitionend', kill, { once: true });
        setTimeout(kill, 900); // safety net
      }, wait);
    };

    if (document.readyState === 'complete') dismiss();
    else addEventListener('load', dismiss, { once: true });
    const hard = setTimeout(dismiss, 4000); // hard cap — never trap behind a slow asset

    return () => {
      clearTimeout(hard);
      html.classList.remove('is-loading');
    };
  }, []);

  return (
    <div id="site-loader" className="loader" role="status" aria-label="Loading Dominion City" ref={loaderRef}>
      <div className="loader__field" aria-hidden="true"></div>

      <div className="loader__stage">
        <div className="loader__orbit" aria-hidden="true">
          <span className="loader__ring"></span>
          <span className="loader__ring loader__ring--inner"></span>
          <svg className="loader__mark" viewBox="0 0 40 40" aria-hidden="true" focusable="false">
            <path d="M2 31 C 11 27, 29 27, 38 31" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.55" />
            <rect x="11" y="18" width="4.4" height="11" rx="0.6" fill="currentColor" />
            <rect x="18" y="9" width="4.4" height="20" rx="0.6" fill="var(--accent)" />
            <rect x="25" y="15" width="4.4" height="14" rx="0.6" fill="currentColor" />
            <circle cx="20.2" cy="5.4" r="2.1" fill="var(--accent)" />
          </svg>
        </div>

        <p className="loader__word" aria-hidden="true">Dominion City Uyo</p>

        <div className="loader__bar" aria-hidden="true"><span className="loader__fill"></span></div>
      </div>
    </div>
  );
}
