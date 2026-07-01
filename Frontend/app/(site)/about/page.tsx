import type { Metadata } from 'next';
import PageHero from '@/components/site/PageHero';
import ImagePlaceholder from '@/components/site/ImagePlaceholder';
import { Button } from '@/components/site/ui/button';
import { Card } from '@/components/site/ui/card';
import { church } from '@/data/site';
import './about.css';

export const metadata: Metadata = {
  title: 'About',
  description: 'The story and beliefs of Dominion City — a contemporary church in Uyo taking its name from the dominion mandate and the city set on a hill.',
  alternates: { canonical: '/about/' },
};

const beliefs = [
  { h: 'The Bible', p: 'God’s word — trustworthy, alive, and practical for ordinary life today.' },
  { h: 'Jesus', p: 'Fully God and fully human; his death and resurrection are how anyone is made new.' },
  { h: 'Everyone', p: 'Made in God’s image, loved without exception, and welcome here without a single condition.' },
  { h: 'The mandate', p: '“Have dominion” (Genesis 1:28) — we’re built to bring God’s order and light into every part of life.' },
];

const leaders = [
  { name: 'Pastor David Ogbueli', role: 'Founding Pastor' },
  { name: 'Pastor Grace Ogbueli', role: 'Pastor' },
  { name: 'Pastor Emeka Nwosu', role: 'Teaching Pastor' },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="Our story"
        title="A city set on a hill, on purpose."
        lede="We’re a contemporary church in Uyo that believes ordinary people, filled with God, change a whole city."
      />

      <section className="section">
        <div className="shell about-story">
          <div className="prose" data-reveal>
            <p className="prose__lead">
              Dominion City began with a simple conviction: that a church is not a building
              you visit but a <strong>city you belong to</strong> — light that a whole region
              can see, the way Jesus said a city on a hill cannot be hidden.
            </p>
            <p>
              Our name carries two ideas at once. <em>Dominion</em> is the first assignment
              ever given to people — “have dominion” — the call to bring God’s goodness and
              order into work, family, and community. <em>City</em> is what happens when those
              people gather: not a crowd, but a household with a shared life. Since {church.founded},
              that’s what we’ve been building — and we’re only getting started.
            </p>
          </div>
          <div className="about-story__media" data-reveal>
            <ImagePlaceholder ratio="4/5" tone="light" label="The Dominion City family on a Sunday" />
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="shell">
          <h2 data-reveal>What we believe</h2>
          <p className="lede" data-reveal style={{ marginBottom: 'var(--space-lg)' }}>Plainly, without the jargon.</p>
          <ul className="beliefs">
            {beliefs.map((b) => (
              <li className="belief" data-reveal key={b.h}>
                <h3 className="belief__h">{b.h}</h3>
                <p>{b.p}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--tight">
        <div className="shell">
          <h2 data-reveal>The people who serve you</h2>
          <ul className="leaders">
            {leaders.map((l) => (
              <Card asChild className="leader" key={l.name}>
              <li data-reveal>
                <ImagePlaceholder ratio="1/1" tone="light" label={`Photo of ${l.name}`} className="leader__photo" />
                <div className="leader__meta">
                  <p className="leader__name">{l.name}</p>
                  <p className="leader__role">{l.role}</p>
                </div>
              </li>
              </Card>
            ))}
          </ul>
        </div>
      </section>

      <section className="section on-dark cta-band">
        <div className="shell u-center" data-reveal>
          <h2>The best way to know us is to come.</h2>
          <p className="cta-band__btns"><Button asChild variant="gold"><a href="/plan-your-visit/">Plan your visit</a></Button></p>
        </div>
      </section>
    </>
  );
}
