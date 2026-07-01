import type { Metadata } from 'next';
import PageHero from '@/components/site/PageHero';
import BookCard from '@/components/site/BookCard';
import { books } from '@/data/site';
import './library.css';

export const metadata: Metadata = {
  title: 'Library',
  description: "Browse the Dominion City library — books, devotionals and resources to borrow or buy from the resource desk. See what's on the shelf right now.",
  alternates: { canonical: '/library/' },
};

export default function LibraryPage() {
  const availableCount = books.filter((b) => b.available).length;

  return (
    <>
      <PageHero
        eyebrow="Resources"
        title="The library."
        lede="Books to grow you — foundations, devotionals and family resources. Borrow from the resource desk on a Sunday, or reserve a copy to pick up."
      />

      <section className="section section--tight">
        <div className="shell">
          <p className="library__count" data-reveal>
            {books.length} titles · <strong>{availableCount} available now</strong>
          </p>
          <div className="library__grid">
            {books.map((b) => <BookCard book={b} key={b.title} />)}
          </div>
          <p className="library__note" data-reveal>
            Looking for something specific? <a className="link" href="/contact/">Ask at the resource desk →</a>
          </p>
        </div>
      </section>
    </>
  );
}
