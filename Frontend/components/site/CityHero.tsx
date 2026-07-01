'use client';

/* ============================================================================
   SIGNATURE HERO — "Our Year of Dominion · The Year of the Eagle" (2026)
   ----------------------------------------------------------------------------
   A full-bleed, 3D coverflow carousel of the real Dominion City congregation,
   set on a dark, cinematic stage with a faint eagle-wing motif. The centre
   image stands upright and large; its neighbours angle back on an arc and
   rotate through on a timer, by drag/swipe, by the arrows, dots or keyboard.

   Progressive enhancement: with no JS the first photo renders full-bleed and
   static (a clean, complete hero). The 3D arc, auto-advance and gestures layer
   on once JS is present, and auto-advance is silenced under reduced-motion.
   ========================================================================== */
import { useEffect, useRef } from 'react';
import { services, church } from '@/data/site';
import { Button } from '@/components/site/ui/button';
import './CityHero.css';

// The community, in a deliberate rhythm. (dc1 is the branded banner — kept out
// of the rotation so its baked-in text never fights the headline.)
const slides = [
  { src: '/img/d3.jpg', alt: 'A worshipper with open hands during a Dominion City gathering' },
  { src: '/img/d14.jpg', alt: 'A worship leader leading sung worship under stage lights' },
  { src: '/img/dc4.jpg', alt: 'A man in worship with his hands lifted' },
  { src: '/img/d6.jpg', alt: 'A pastor preaching at a Dominion City service' },
  { src: '/img/d5.jpg', alt: 'A pastor praying with a member of the church' },
  { src: '/img/d2.jpg', alt: 'The congregation gathered for a Sunday celebration' },
];

export default function CityHero() {
  const carouselRef = useRef<HTMLDivElement>(null);
  const twRef = useRef<HTMLParagraphElement>(null);

  const sundays = services.filter((s) => s.day === 'Sunday');
  const sundayTimes = sundays.map((s) => s.time).join(' · ');

  useEffect(() => {
    const root = carouselRef.current;

    // ---- Coverflow carousel -------------------------------------------------
    let cleanupCoverflow: (() => void) | undefined;
    if (root) {
      const slideEls = Array.from(root.querySelectorAll<HTMLElement>('.hero__slide'));
      const dots = Array.from(root.querySelectorAll<HTMLButtonElement>('.hero__dot'));
      const status = root.querySelector<HTMLElement>('[data-carousel-status]');
      const n = slideEls.length;

      if (n >= 2) {
        const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
        let active = 0;
        let timer: number | undefined;

        const layout = () => {
          const cw = slideEls[0].offsetWidth || 320;
          slideEls.forEach((el, i) => {
            let d = i - active;
            if (d > n / 2) d -= n;
            if (d < -n / 2) d += n;
            const ad = Math.abs(d);
            const visible = ad <= 2;
            const x = d * cw * 0.58;
            const z = -ad * 240;
            const ry = -d * 32;
            const sc = Math.max(0.68, 1 - ad * 0.14);
            el.style.transform = `translate(-50%, -50%) translateX(${x}px) translateZ(${z}px) rotateY(${ry}deg) scale(${sc})`;
            el.style.opacity = visible ? (ad === 0 ? '1' : ad === 1 ? '0.72' : '0.26') : '0';
            el.style.zIndex = String(100 - ad);
            el.style.pointerEvents = ad === 0 ? 'auto' : visible ? 'auto' : 'none';
            el.classList.toggle('is-active', ad === 0);
            el.setAttribute('aria-hidden', ad === 0 ? 'false' : 'true');
          });
          dots.forEach((dot, i) => dot.setAttribute('aria-selected', i === active ? 'true' : 'false'));
          const img = slideEls[active].querySelector('img');
          if (status && img) status.textContent = `Photo ${active + 1} of ${n}: ${img.alt}`;
        };

        const goTo = (i: number) => { active = (i + n) % n; layout(); };
        const go = (dir: number) => goTo(active + dir);

        const stop = () => { if (timer) { clearInterval(timer); timer = undefined; } };
        const play = () => {
          if (reduced || timer) return;
          timer = window.setInterval(() => go(1), 5200);
        };
        const restart = () => { stop(); play(); };

        // Controls
        const prevBtn = root.querySelector('.hero__nav--prev');
        const nextBtn = root.querySelector('.hero__nav--next');
        const onPrev = () => { go(-1); restart(); };
        const onNext = () => { go(1); restart(); };
        prevBtn?.addEventListener('click', onPrev);
        nextBtn?.addEventListener('click', onNext);

        const dotHandlers = dots.map((dot, i) => {
          const h = () => { goTo(i); restart(); };
          dot.addEventListener('click', h);
          return [dot, h] as const;
        });
        const slideHandlers = slideEls.map((el, i) => {
          const h = () => { if (i !== active) { goTo(i); restart(); } };
          el.addEventListener('click', h);
          return [el, h] as const;
        });

        // Keyboard (when the carousel has focus)
        root.tabIndex = 0;
        root.setAttribute('role', 'group');
        root.setAttribute('aria-roledescription', 'carousel');
        root.setAttribute('aria-label', 'Photos of Dominion City');
        const onKey = (e: KeyboardEvent) => {
          if (e.key === 'ArrowLeft') { go(-1); restart(); }
          else if (e.key === 'ArrowRight') { go(1); restart(); }
        };
        root.addEventListener('keydown', onKey);

        // Drag / swipe
        let downX = 0, dragging = false;
        const onDown = (e: PointerEvent) => { dragging = true; downX = e.clientX; stop(); };
        const onUp = (e: PointerEvent) => {
          if (!dragging) return;
          dragging = false;
          const dx = e.clientX - downX;
          if (Math.abs(dx) > 42) go(dx < 0 ? 1 : -1);
          restart();
        };
        const onCancel = () => { dragging = false; play(); };
        root.addEventListener('pointerdown', onDown);
        root.addEventListener('pointerup', onUp);
        root.addEventListener('pointercancel', onCancel);

        // Pause when hovered, focused, or the tab is hidden
        const onMouseEnter = () => stop();
        const onMouseLeave = () => play();
        const onFocusIn = () => stop();
        const onFocusOut = () => play();
        const onVis = () => (document.hidden ? stop() : play());
        root.addEventListener('mouseenter', onMouseEnter);
        root.addEventListener('mouseleave', onMouseLeave);
        root.addEventListener('focusin', onFocusIn);
        root.addEventListener('focusout', onFocusOut);
        document.addEventListener('visibilitychange', onVis);

        // Recompute on resize
        let rAF = 0;
        const onResize = () => { cancelAnimationFrame(rAF); rAF = requestAnimationFrame(layout); };
        addEventListener('resize', onResize, { passive: true });

        root.classList.add('is-ready');
        layout();
        play();

        cleanupCoverflow = () => {
          stop();
          prevBtn?.removeEventListener('click', onPrev);
          nextBtn?.removeEventListener('click', onNext);
          dotHandlers.forEach(([d, h]) => d.removeEventListener('click', h));
          slideHandlers.forEach(([el, h]) => el.removeEventListener('click', h));
          root.removeEventListener('keydown', onKey);
          root.removeEventListener('pointerdown', onDown);
          root.removeEventListener('pointerup', onUp);
          root.removeEventListener('pointercancel', onCancel);
          root.removeEventListener('mouseenter', onMouseEnter);
          root.removeEventListener('mouseleave', onMouseLeave);
          root.removeEventListener('focusin', onFocusIn);
          root.removeEventListener('focusout', onFocusOut);
          document.removeEventListener('visibilitychange', onVis);
          removeEventListener('resize', onResize);
          cancelAnimationFrame(rAF);
        };
      }
    }

    // ---- Typewriter kicker --------------------------------------------------
    let twActive = true;
    const tw = twRef.current;
    if (tw) {
      const phrases = Object.keys(tw.dataset)
        .filter((k) => k.startsWith('part'))
        .sort()
        .map((k) => tw.dataset[k] ?? '')
        .filter(Boolean);

      if (phrases.length >= 2 && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        tw.textContent = '';
        const sr = Object.assign(document.createElement('span'), {
          className: 'visually-hidden',
          textContent: phrases.join(' · '),
        });
        const line = document.createElement('span');
        line.setAttribute('aria-hidden', 'true');
        const text = Object.assign(document.createElement('span'), { className: 'tw__text' });
        const caret = Object.assign(document.createElement('span'), { className: 'tw__caret' });
        line.append(text, caret);
        tw.append(sr, line);

        const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
        let i = 0;
        const step = (to: number, speed: number) =>
          new Promise<void>((resolve) => {
            line.classList.add('tw--typing'); // solid cursor while moving
            const tick = () => {
              if (!twActive) return resolve();
              const cur = text.textContent ?? '';
              if (cur.length === to) {
                line.classList.remove('tw--typing'); // resume blink on pause
                return resolve();
              }
              const grow = cur.length < to;
              const next = phrases[i].slice(0, cur.length + (grow ? 1 : -1));
              text.textContent = next;
              setTimeout(tick, speed);
            };
            tick();
          });

        (async () => {
          await wait(350);                       // let the hero settle first
          while (twActive) {
            await step(phrases[i].length, 60);   // type current phrase
            await wait(1500);                     // hold it
            await step(0, 35);                    // erase (a touch faster)
            await wait(250);
            i = (i + 1) % phrases.length;         // next phrase
          }
        })();
      }
    }

    return () => {
      twActive = false;
      cleanupCoverflow?.();
    };
  }, []);

  return (
    <section className="hero" aria-label="Welcome to Dominion City">
      <div className="hero__bg" aria-hidden="true">
        <div className="hero__glow"></div>
        <svg className="hero__wings" viewBox="0 0 1440 760" preserveAspectRatio="xMidYMid slice" role="presentation">
          <defs>
            <linearGradient id="wg" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#E6B65C" stopOpacity="0" />
              <stop offset="50%" stopColor="#E6B65C" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#E6B65C" stopOpacity="0" />
            </linearGradient>
          </defs>
          <g fill="none" stroke="url(#wg)" strokeWidth="1.4" strokeLinecap="round" opacity="0.5">
            <path d="M720 232 C 560 150, 360 168, 150 300" />
            <path d="M720 250 C 575 190, 400 212, 215 330" />
            <path d="M720 268 C 590 226, 440 250, 285 352" />
            <path d="M720 232 C 880 150, 1080 168, 1290 300" />
            <path d="M720 250 C 865 190, 1040 212, 1225 330" />
            <path d="M720 268 C 850 226, 1000 250, 1155 352" />
          </g>
        </svg>
      </div>

      <div className="hero__carousel" data-carousel ref={carouselRef}>
        <div className="hero__stage">
          <ul className="hero__track">
            {slides.map((s, i) => (
              <li className="hero__slide" key={i}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.src}
                  alt={s.alt}
                  width="600" height="800"
                  loading={i === 0 ? 'eager' : 'lazy'}
                  fetchPriority={i === 0 ? 'high' : undefined}
                  decoding="async"
                />
                <span className="hero__slide-grad" aria-hidden="true"></span>
              </li>
            ))}
          </ul>
        </div>

        <button className="hero__nav hero__nav--prev" type="button" aria-label="Previous photo">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <button className="hero__nav hero__nav--next" type="button" aria-label="Next photo">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>

        <div className="hero__dots" role="tablist" aria-label="Choose a photo">
          {slides.map((_, i) => (
            <button key={i} className="hero__dot" type="button" role="tab" data-i={i} aria-label={`Show photo ${i + 1} of ${slides.length}`}></button>
          ))}
        </div>

        <p className="visually-hidden" aria-live="polite" data-carousel-status></p>
      </div>

      <div className="hero__grain" aria-hidden="true"></div>
      <div className="hero__scrim" aria-hidden="true"></div>

      <div className="hero__content shell-wide">
        <p className="hero__kicker" data-typewriter data-part-a="Our Year of Dominion" data-part-b="Year of the Eagle" data-part-c="The wealthy place" ref={twRef}>Our Year of Dominion · <span>Year of the Eagle</span> <span>The wealthy place</span></p>
        <h1 className="hero__title">
          <span className="hero__line">A city set on a hill.</span>
          <span className="hero__line hero__line--accent">And a seat with your name on it.</span>
        </h1>
        <p className="hero__lede">
          Whether it’s your first Sunday or
          your hundredth, there is room for you here — come as you are.
        </p>

        <div className="hero__actions">
          <Button asChild variant="gold"><a href="/plan-your-visit/">Plan your visit</a></Button>
          <Button asChild variant="ghost"><a href="/watch/">Watch live</a></Button>
        </div>

        <p className="hero__times">
          <span className="hero__times-label">This Sunday</span>
          <span className="hero__times-val">{sundayTimes}</span>
          <span className="hero__times-tz">{church.timezone}</span>
        </p>
      </div>

      <a className="hero__scroll" href="#this-sunday" aria-label="See service times">
        <span>Begin</span>
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 4v16M6 14l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </a>
    </section>
  );
}
