'use client';

/* Header — transparent over the hero at the top of the page; on scroll it
   contracts into a rounded, frosted-glass floating pill at 80% width.

   Resilience: the markup ships in the "top" (transparent) state so there's no
   flash on load, a tiny scroll listener toggles the pill on scroll, and a
   <noscript> fallback forces the readable frosted state when JS is off.
   The mobile menu and "Give" stay available in every state. */
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { nav } from '@/data/site';
import Wordmark from './Wordmark';
import './Header.css';

export default function Header() {
  const headerRef = useRef<HTMLElement>(null);
  const pathname = usePathname() || '/';
  const path = pathname === '/' ? '/' : pathname.endsWith('/') ? pathname : pathname + '/';
  const isActive = (href: string) => path === href || (href !== '/' && path.startsWith(href));

  useEffect(() => {
    const h = headerRef.current;
    if (!h) return;
    let ticking = false;
    const update = () => {
      h.classList.toggle('is-top', window.scrollY <= 24);
      ticking = false;
    };
    update();
    const onScroll = () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    };
    addEventListener('scroll', onScroll, { passive: true });
    return () => removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header id="site-header" className="site-header is-top" ref={headerRef}>
        <div className="site-header__bar">
          <a className="site-header__brand" href="/" aria-label="Dominion City — home">
            <Wordmark />
          </a>

          <nav className="site-nav" aria-label="Primary">
            <ul className="site-nav__list">
              {nav.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="site-nav__link"
                    aria-current={isActive(item.href) ? 'page' : undefined}
                  >{item.label}</a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="site-header__cta">
            <div className="site-header__auth">
              <a className="site-header__authlink" href="/login">Log in</a>
              <span className="site-header__authsep" aria-hidden="true">|</span>
              <a className="site-header__authlink" href="/register">Register</a>
            </div>

            <details className="menu">
              <summary className="menu__toggle" aria-label="Open menu">
                <span className="menu__bars" aria-hidden="true"></span>
                <span className="menu__word">Menu</span>
              </summary>
              <div className="menu__panel">
                <ul>
                  {nav.map((item) => (
                    <li key={item.href}><a href={item.href} aria-current={isActive(item.href) ? 'page' : undefined}>{item.label}</a></li>
                  ))}
                </ul>
                {/* Below 40rem the gold auth pill stands down (it pushed Menu
                    off the bar), so these are the only Log in / Register on a
                    phone — they get to be real buttons, not another list row. */}
                <div className="menu__auth">
                  <a className="menu__btn menu__btn--primary" href="/register">Create an account</a>
                  <a className="menu__btn" href="/login">Log in</a>
                </div>
              </div>
            </details>
          </div>
        </div>
      </header>

      <noscript>
        <style>{`
          /* No JS: keep the header in its readable frosted state at all times */
          .site-header.is-top .site-header__bar {
            width: min(100% - 1.5rem, 1400px);
            color: var(--text);
            background: color-mix(in oklab, var(--c-daybreak) 88%, transparent);
            border-color: var(--line);
            border-radius: 0;
            box-shadow: var(--shadow-lift);
          }
          .site-header.is-top .site-nav__link::after { background: var(--accent-ink); }
          .site-header.is-top .menu__toggle { border-color: var(--line); }
        `}</style>
      </noscript>
    </>
  );
}
