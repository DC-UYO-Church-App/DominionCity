import type { Sermon } from '@/data/site';
import { cx } from '@/lib/cx';
import ImagePlaceholder from './ImagePlaceholder';
import { Card } from '@/components/site/ui/card';
import './SermonCard.css';

interface Props { sermon: Sermon; featured?: boolean }

export default function SermonCard({ sermon, featured = false }: Props) {
  const date = new Date(sermon.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <Card asChild className={cx('sermon', { 'sermon--featured': featured })}>
    <article data-reveal>
      <div className="sermon__thumb">
        <ImagePlaceholder ratio="16/9" tone="dark" label={`Sermon still — “${sermon.title}”`} />
        <span className="sermon__play-badge" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
        </span>
      </div>
      <div className="sermon__body">
        <div className="sermon__top">
          {sermon.series && <span className="sermon__series">{sermon.series}</span>}
          <span className="sermon__dur">{sermon.duration}</span>
        </div>
        <h3 className="sermon__title">{sermon.title}</h3>
        <p className="sermon__meta">{sermon.speaker} · {sermon.scripture}</p>
        {featured && <p className="sermon__blurb">{sermon.blurb}</p>}
        <div className="sermon__foot">
          <span className="sermon__date">{date}</span>
          <a className="link sermon__play" href="/sermons/">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
            Watch
          </a>
        </div>
      </div>
    </article>
    </Card>
  );
}
