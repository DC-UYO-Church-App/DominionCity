import type { Metadata } from 'next';
import PageHero from '@/components/site/PageHero';
import ServiceTimes from '@/components/site/ServiceTimes';
import { Button } from '@/components/site/ui/button';
import { Card } from '@/components/site/ui/card';
import { church } from '@/data/site';
import './watch.css';

export const metadata: Metadata = {
  title: 'Watch Live',
  description: "Watch Dominion City live every Sunday and Wednesday. Can't make it in person? Join the service online from anywhere.",
  alternates: { canonical: '/watch/' },
};

export default function WatchPage() {
  return (
    <>
      <PageHero
        eyebrow="Watch live"
        title="Can’t be in the room? Be in the service."
        lede="We stream live every Sunday and on Wednesday. Wherever you are, there’s a seat."
      />

      <section className="section">
        <div className="shell watch-grid">
          <div data-reveal>
            <div className="watch-player">
              <div className="watch-player__inner">
                <p className="watch-player__status">Live when a service begins</p>
                <Button asChild variant="gold"><a href={church.social.youtube} rel="noopener">Open the live stream</a></Button>
                <p className="watch-player__cc">Captions available · times in {church.timezone}</p>
              </div>
            </div>
            <p className="watch-note" data-reveal>Can’t make it live? Every message is posted to <a className="link" href="/sermons/">Sermons</a> right after, so you can catch the full service whenever it suits you.</p>
          </div>
          <Card asChild>
          <aside data-reveal>
            <ServiceTimes heading="When we’re live" />
            <p className="watch-side-note">Streamed services are marked <span style={{ color: 'var(--accent-warm)', fontWeight: 600 }}>● Live</span> above.</p>
          </aside>
          </Card>
        </div>
      </section>
    </>
  );
}
