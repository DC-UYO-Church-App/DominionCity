import type { Metadata } from 'next';
import PageHero from '@/components/site/PageHero';
import EventCard from '@/components/site/EventCard';
import { Button } from '@/components/site/ui/button';
import { events } from '@/data/site';
import './events.css';

export const metadata: Metadata = {
  title: 'Events',
  description: "What's on at Dominion City — worship nights, first-timer lunches, kids' clubs and more. Come find your people.",
  alternates: { canonical: '/events/' },
};

export default function EventsPage() {
  const sorted = [...events].sort((a, b) => +new Date(a.date) - +new Date(b.date));

  return (
    <>
      <PageHero
        eyebrow="What's on"
        title="Come find your people."
        lede="Sunday is the front door; the week is where you find a home. Everyone is welcome at everything here."
      />

      <section className="section">
        <div className="shell">
          <div className="events-list">
            {sorted.map((e) => <EventCard event={e} key={e.title} />)}
          </div>
          <p className="events-empty" data-reveal>More dates are added through the season. Follow along on{' '}
            <a className="link" href="https://www.instagram.com/dominioncity" rel="noopener">Instagram</a> so you never miss one.</p>
        </div>
      </section>

      <section className="section on-dark cta-band">
        <div className="shell u-center" data-reveal>
          <h2>Want it in your calendar?</h2>
          <p className="lede" style={{ marginInline: 'auto' }}>Tell us which gatherings you’re interested in and we’ll send a friendly reminder — no spam.</p>
          <p style={{ marginTop: 'var(--space-md)' }}><Button asChild variant="gold"><a href="/contact/">Keep me posted</a></Button></p>
        </div>
      </section>
    </>
  );
}
