'use client';

/* Verse cloud — a soft, gold-rimmed cloud that hangs at the edge of every
   public page and breathes a new scripture every four seconds.

   Progressive enhancement: with no JS the cloud never renders at all (it is
   purely devotional garnish, so nothing is lost). With JS it mounts after
   hydration, shuffles the passage list so two visitors rarely see the same
   order, and crossfades from one verse to the next.

   Manners: the rotation pauses on hover, on keyboard focus and whenever the
   tab is hidden, so a verse someone is reading never slides away mid-sentence.
   On phones — where it is docked over the content rather than out in the
   margin — it also tucks itself off the bottom edge while the page is being
   scrolled and slides back once the reader settles, so it never sits on top of
   the paragraph someone is reading.
   `prefers-reduced-motion` stops the autoplay entirely — the ✦ button still
   advances by hand. Dismissing collapses it to a small gold tab, and that
   choice is remembered for the rest of the browsing session.
*/
import { useCallback, useEffect, useRef, useState } from 'react';
import { verses } from '@/data/verses';
import { cx } from '@/lib/cx';
import './VerseToast.css';

const INTERVAL = 4000;
const STORAGE_KEY = 'dc:verse-cloud:closed';
/* Below this the cloud is docked over the content, so it tucks while scrolling.
   Keep in step with the `max-width: 760px` block in VerseToast.css. */
const DOCKED = '(max-width: 760px)';
const TUCK_AFTER_SCROLL = 900;

/** Fisher–Yates, on a copy. Runs after mount only, so SSR stays deterministic. */
function shuffled<T>(list: readonly T[]): T[] {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export default function VerseToast() {
  // Nothing renders until after hydration: the shuffle and the stored
  // dismissal are both client-only facts, and this keeps them out of the HTML.
  const [mounted, setMounted] = useState(false);
  const [order, setOrder] = useState(verses);
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(true);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [tucked, setTucked] = useState(false);
  const hidden = useRef(false);

  useEffect(() => {
    let closed = false;
    try {
      closed = sessionStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      /* private mode / storage blocked — just show it */
    }
    setOrder(shuffled(verses));
    setOpen(!closed);
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    setMounted(true);
  }, []);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % order.length);
  }, [order.length]);

  // Autoplay. Re-created on every index change so a manual advance restarts
  // the full four seconds instead of inheriting the tail of the last one.
  useEffect(() => {
    if (!mounted || !open || paused || reduced || tucked) return;
    const id = window.setInterval(() => {
      if (!hidden.current) next();
    }, INTERVAL);
    return () => window.clearInterval(id);
  }, [mounted, open, paused, reduced, tucked, index, next]);

  // Docked layout only: get out of the way while the page is moving.
  useEffect(() => {
    if (!mounted || !open) return;
    const mq = window.matchMedia(DOCKED);
    if (!mq.matches) return;

    let timer = 0;
    const onScroll = () => {
      setTucked(true);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setTucked(false), TUCK_AFTER_SCROLL);
    };
    addEventListener('scroll', onScroll, { passive: true });
    return () => {
      removeEventListener('scroll', onScroll);
      window.clearTimeout(timer);
      setTucked(false);
    };
  }, [mounted, open]);

  // A backgrounded tab shouldn't burn through the whole book unwatched.
  useEffect(() => {
    const onVisibility = () => {
      hidden.current = document.hidden;
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const setClosed = (closed: boolean) => {
    setOpen(!closed);
    try {
      if (closed) sessionStorage.setItem(STORAGE_KEY, '1');
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* nothing to remember it with; the state still applies to this page */
    }
  };

  if (!mounted) return null;

  const verse = order[index];

  if (!open) {
    return (
      <button
        type="button"
        className="verse-cloud__reopen"
        onClick={() => setClosed(false)}
        aria-label="Show the verse of the moment"
      >
        <span aria-hidden="true">✝</span>
        <span className="verse-cloud__reopen-label">Word</span>
      </button>
    );
  }

  return (
    <aside
      className={cx('verse-cloud', {
        'is-paused': paused,
        'is-still': reduced,
        'is-tucked': tucked,
      })}
      aria-label="Verse of the moment"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      /* Tapping the tucked crown pulls it back up without waiting out the timer. */
      onClick={() => { if (tucked) setTucked(false); }}
    >
      {/* The puffs that turn a rounded card into a cloud. Purely decorative. */}
      <span className="verse-cloud__puffs" aria-hidden="true" />

      <div className="verse-cloud__body">
        <div className="verse-cloud__head">
          <span className="verse-cloud__eyebrow">
            <span className="verse-cloud__spark" aria-hidden="true">✦</span>
            Word for you
          </span>
          <button
            type="button"
            className="verse-cloud__close"
            onClick={() => setClosed(true)}
            aria-label="Hide the verse of the moment"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>

        {/* `key` remounts the passage so the crossfade animation replays. */}
        <blockquote className="verse-cloud__quote" key={index}>
          <p className="verse-cloud__text">{verse.text}</p>
          <cite className="verse-cloud__ref">{verse.ref}</cite>
        </blockquote>

        <div className="verse-cloud__foot">
          <span className="verse-cloud__timer" aria-hidden="true">
            <span
              className="verse-cloud__timer-fill"
              key={`t${index}`}
              style={{ animationDuration: `${INTERVAL}ms` }}
            />
          </span>
          <button
            type="button"
            className="verse-cloud__next"
            onClick={next}
            aria-label="Show another verse"
          >
            Next
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
