import type { Book } from '@/data/site';
import { cx } from '@/lib/cx';
import ImagePlaceholder from './ImagePlaceholder';
import { Card } from '@/components/site/ui/card';
import './BookCard.css';

interface Props { book: Book }

export default function BookCard({ book }: Props) {
  return (
    <Card asChild className="book">
    <article data-reveal>
      <div className="book__cover">
        <ImagePlaceholder ratio="3/4" tone="dark" label={`Cover — “${book.title}”`} />
        <span className={cx('book__status', book.available ? 'is-available' : 'is-out')}>
          {book.available ? 'Available' : 'On loan'}
        </span>
      </div>
      <div className="book__body">
        <span className="book__category">{book.category}</span>
        <h3 className="book__title">{book.title}</h3>
        <p className="book__author">{book.author}</p>
        <p className="book__blurb">{book.blurb}</p>
        <div className="book__foot">
          <span className="book__format">
            {book.format}{book.pages ? ` · ${book.pages} pp` : ''}
          </span>
          {book.available
            ? <a className="link book__cta" href="#">Reserve a copy →</a>
            : <span className="book__cta book__cta--muted">Join the waitlist</span>}
        </div>
      </div>
    </article>
    </Card>
  );
}
