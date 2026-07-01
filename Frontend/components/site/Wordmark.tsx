/* Wordmark — type-led, with a small architectural glyph: three towers of
   light cresting a hill ("a city set on a hill"). Scales cleanly and inherits
   colour so it works on light and dark headers alike. */
import './Wordmark.css';

export default function Wordmark() {
  return (
    <span className="wordmark">
      <svg className="wordmark__mark" viewBox="0 0 40 40" aria-hidden="true" focusable="false">
        {/* the hill */}
        <path d="M2 31 C 11 27, 29 27, 38 31" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.55" />
        {/* three towers, the centre one crowned */}
        <rect x="11" y="18" width="4.4" height="11" rx="0.6" fill="currentColor" />
        <rect x="18" y="9" width="4.4" height="20" rx="0.6" fill="var(--accent, currentColor)" />
        <rect x="25" y="15" width="4.4" height="14" rx="0.6" fill="currentColor" />
        {/* the crown of light on the tallest tower */}
        <circle cx="20.2" cy="5.4" r="2.1" fill="var(--accent, currentColor)" />
      </svg>
      <span className="wordmark__text">
        <span className="wordmark__name">Dominion</span>
        <span className="wordmark__name wordmark__name--alt">City Uyo</span>
      </span>
    </span>
  );
}
