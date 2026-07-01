/* Reusable image placeholder — a designed, on-brand "photo goes here" slot.
   Drop it anywhere a real photo belongs; swap for an <img>/next/image later by
   replacing the component with the same wrapper class. Accessible: announced
   as the intended image via role="img" + aria-label.

   Props:
     ratio  — aspect ratio, e.g. '16/9', '4/3', '3/4', '1/1'  (ignored for circle)
     label  — short description of the intended photo (shown + announced)
     tone   — 'light' (on cream sections) or 'dark' (on indigo sections)
     circle — round avatar style
     className — extra classes for layout from the parent
*/
import { cx } from '@/lib/cx';
import './ImagePlaceholder.css';

interface Props {
  ratio?: string;
  label?: string;
  tone?: 'light' | 'dark';
  circle?: boolean;
  className?: string;
}

export default function ImagePlaceholder({
  ratio = '16/9',
  label = 'Photo',
  tone = 'light',
  circle = false,
  className = '',
}: Props) {
  return (
    <div
      className={cx('ph', `ph--${tone}`, { 'ph--circle': circle }, className)}
      style={{ '--ph-ratio': ratio } as React.CSSProperties}
      role="img"
      aria-label={`Image placeholder — ${label}`}
    >
      <svg className="ph__icon" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="8.5" cy="10" r="1.6" fill="currentColor" />
        <path d="M4 17l5-5 3.5 3.5L16 12l4 4v1H4Z" fill="currentColor" opacity="0.5" />
      </svg>
      {label && !circle && <span className="ph__label">{label}</span>}
      {circle && <span className="visually-hidden">{label}</span>}
    </div>
  );
}
