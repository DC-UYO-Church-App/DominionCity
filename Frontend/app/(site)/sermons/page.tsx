import type { Metadata } from 'next';
import PageHero from '@/components/site/PageHero';
import SermonCard from '@/components/site/SermonCard';
import { Button } from '@/components/site/ui/button';
import { sermons, church } from '@/data/site';
import './sermons.css';

export const metadata: Metadata = {
  title: 'Sermons',
  description: 'Watch and listen to recent messages from Dominion City — practical, Bible-based teaching, most recent first. Captioned video.',
  alternates: { canonical: '/sermons/' },
};

export default function SermonsPage() {
  const [latest, ...rest] = sermons;
  const latestDate = new Date(latest.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <>
      <PageHero
        eyebrow="Messages"
        title="Sermons worth your time."
        lede="Clear, practical teaching from the Bible. Watch, listen, or read along — every video is captioned."
      />

      <section className="section">
        <div className="shell">
          {/* Featured latest with a player placeholder */}
          <article className="feature" data-reveal>
            <div className="feature__player">
              <div className="feature__poster">
                <button className="feature__play" type="button" aria-label={`Play: ${latest.title}`}>
                  <svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
                </button>
                <p className="feature__cc">CC · Captions available</p>
              </div>
            </div>
            <div className="feature__meta">
              <p className="eyebrow">Latest · {latestDate}</p>
              <h2 className="feature__title">{latest.title}</h2>
              <p className="feature__sub">{latest.speaker} · {latest.scripture} · {latest.duration}</p>
              <p className="feature__blurb">{latest.blurb}</p>
              <p className="feature__actions">
                <Button asChild variant="gold"><a href={church.social.youtube} rel="noopener">Watch on YouTube</a></Button>
                <Button asChild variant="ghost"><a href="#archive">Browse the archive</a></Button>
              </p>
            </div>
          </article>
        </div>
      </section>

      <section className="section section--tight" id="archive">
        <div className="shell">
          <h2 data-reveal>The archive</h2>
          <p className="lede" data-reveal style={{ marginBottom: 'var(--space-lg)' }}>Most recent first. New messages are posted every Sunday by the evening.</p>
          <div className="archive">
            {rest.map((s) => <SermonCard sermon={s} key={s.title} />)}
          </div>
        </div>
      </section>
    </>
  );
}
