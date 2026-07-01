'use client';

/* Futuristic auto-advancing carousel — a crossfading photo stage.
   Slides are stacked and crossfade with a slow Ken Burns drift. A segmented
   progress bar fills as the autoplay timer runs, and completing that fill is
   what advances the slide — so the bar and the motion are always in sync.

   Progressive enhancement: the first slide is visible with no JS (it degrades
   to a single static hero image, never blank). JS adds the crossfade, the
   autoplay, the glass controls and the progress bar. Autoplay pauses on hover,
   on focus, when the tab is hidden or the carousel scrolls offscreen, and is
   disabled entirely under prefers-reduced-motion (manual arrows still work).
*/
import { useEffect, useRef } from 'react';
import { cx } from '@/lib/cx';
import './Carousel.css';

interface Slide { src: string; alt: string; caption?: string; }
interface Props {
  slides: Slide[];
  ratio?: string;
  tone?: 'light' | 'dark';
  label?: string;
}

export default function Carousel({ slides, ratio = '4/3', tone = 'dark', label = 'Photos' }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const slideEls = Array.from(root.querySelectorAll<HTMLElement>('.fcar__slide'));
    const segs = Array.from(root.querySelectorAll<HTMLButtonElement>('.fcar__seg'));
    const ui = root.querySelector<HTMLElement>('.fcar__ui');
    const status = root.querySelector<HTMLElement>('[data-fcar-status]');
    if (slideEls.length < 2 || !ui) return;

    ui.hidden = false;
    let current = 0;
    let paused = false;

    const render = (i: number) => {
      slideEls.forEach((s, si) => {
        const active = si === i;
        s.classList.toggle('is-active', active);
        s.setAttribute('aria-hidden', active ? 'false' : 'true');
      });
      segs.forEach((seg, si) => {
        seg.classList.toggle('is-active', si === i);
        seg.classList.toggle('is-done', si < i);
        seg.setAttribute('aria-selected', si === i ? 'true' : 'false');
      });
      current = i;
      if (status) status.textContent = `Photo ${i + 1} of ${slideEls.length}`;
    };

    const go = (i: number) => render((i + slideEls.length) % slideEls.length);

    // Autoplay is driven by the progress bar finishing its fill animation.
    const onAnimEnd = (e: AnimationEvent) => {
      if ((e.target as HTMLElement).classList?.contains('fcar__fill') && !paused) go(current + 1);
    };
    root.addEventListener('animationend', onAnimEnd);

    const setPaused = (p: boolean) => { paused = p; root.classList.toggle('is-paused', p); };

    // Manual controls — a tap also nudges autoplay forward from there.
    const navBtns = Array.from(root.querySelectorAll<HTMLButtonElement>('.fcar__nav'));
    const navHandlers = navBtns.map((btn) => {
      const handler = () => go(btn.dataset.dir === 'next' ? current + 1 : current - 1);
      btn.addEventListener('click', handler);
      return [btn, handler] as const;
    });
    const segHandlers = segs.map((seg) => {
      const handler = () => go(Number(seg.dataset.to));
      seg.addEventListener('click', handler);
      return [seg, handler] as const;
    });

    render(0);

    if (reduce) {
      return () => {
        root.removeEventListener('animationend', onAnimEnd);
        navHandlers.forEach(([b, h]) => b.removeEventListener('click', h));
        segHandlers.forEach(([s, h]) => s.removeEventListener('click', h));
      };
    }

    // Pause when not wanted: hover, focus, hidden tab, scrolled offscreen.
    const onEnter = () => setPaused(true);
    const onLeave = () => setPaused(false);
    const onFocusIn = () => setPaused(true);
    const onFocusOut = () => setPaused(false);
    const onVis = () => setPaused(document.hidden);
    root.addEventListener('pointerenter', onEnter);
    root.addEventListener('pointerleave', onLeave);
    root.addEventListener('focusin', onFocusIn);
    root.addEventListener('focusout', onFocusOut);
    document.addEventListener('visibilitychange', onVis);

    let observer: IntersectionObserver | undefined;
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        ([e]) => setPaused(!e.isIntersecting),
        { threshold: 0.35 },
      );
      observer.observe(root);
    }

    return () => {
      root.removeEventListener('animationend', onAnimEnd);
      navHandlers.forEach(([b, h]) => b.removeEventListener('click', h));
      segHandlers.forEach(([s, h]) => s.removeEventListener('click', h));
      root.removeEventListener('pointerenter', onEnter);
      root.removeEventListener('pointerleave', onLeave);
      root.removeEventListener('focusin', onFocusIn);
      root.removeEventListener('focusout', onFocusOut);
      document.removeEventListener('visibilitychange', onVis);
      observer?.disconnect();
    };
  }, []);

  return (
    <div
      className={cx('fcar', `fcar--${tone}`)}
      data-carousel-rail
      style={{ ['--c-ratio' as string]: ratio } as React.CSSProperties}
      role="group"
      aria-roledescription="carousel"
      aria-label={label}
      ref={rootRef}
    >
      <div className="fcar__stage">
        {slides.map((s, i) => (
          <figure
            key={i}
            className={cx('fcar__slide', { 'is-active': i === 0 })}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${slides.length}`}
            aria-hidden={i === 0 ? 'false' : 'true'}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={s.src}
              alt={s.alt}
              width="800"
              height="600"
              loading={i === 0 ? 'eager' : 'lazy'}
              decoding="async"
            />
            {s.caption && <figcaption className="fcar__cap">{s.caption}</figcaption>}
          </figure>
        ))}

        <div className="fcar__scrim" aria-hidden="true"></div>

        {slides.length > 1 && (
          <div className="fcar__ui" hidden>
            <button className="fcar__nav fcar__nav--prev" data-dir="prev" type="button" aria-label="Previous photo">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <button className="fcar__nav fcar__nav--next" data-dir="next" type="button" aria-label="Next photo">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>

            <div className="fcar__bar" role="tablist" aria-label="Choose photo">
              {slides.map((_, i) => (
                <button key={i} className="fcar__seg" type="button" data-to={i} role="tab" aria-label={`Photo ${i + 1}`} aria-selected={i === 0 ? 'true' : 'false'}>
                  <span className="fcar__fill"></span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <p className="visually-hidden" aria-live="polite" data-fcar-status></p>
    </div>
  );
}
