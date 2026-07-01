/* Inner-page banner — a quieter echo of the home hero: the same indigo night,
   a faint horizon of dawn light, no heavy art. Restraint by design. */
import './PageHero.css';

interface Props { eyebrow?: string; title: string; lede?: string }

export default function PageHero({ eyebrow, title, lede }: Props) {
  return (
    <header className="page-hero on-dark">
      <div className="page-hero__glow" aria-hidden="true"></div>
      <div className="shell page-hero__inner">
        {eyebrow && <p className="eyebrow on-dark">{eyebrow}</p>}
        <h1 className="page-hero__title">{title}</h1>
        {lede && <p className="lede page-hero__lede">{lede}</p>}
      </div>
    </header>
  );
}
