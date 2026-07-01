import type { Metadata } from 'next';
import PageHero from '@/components/site/PageHero';
import MapBlock from '@/components/site/MapBlock';
import ServiceTimes from '@/components/site/ServiceTimes';
import { Card } from '@/components/site/ui/card';
import { church } from '@/data/site';
import './visit.css';

export const metadata: Metadata = {
  title: 'Visit & Directions',
  description: 'How to find Dominion City in Uyo — address, map, parking, and accessibility. Everything you need to get here on Sunday.',
  alternates: { canonical: '/visit/' },
};

const getting = [
  { h: 'By car', p: 'Free parking on site. Arrive ~15 minutes early before 2nd Service for the easiest spot. Drop-off bay at the main entrance for anyone with limited mobility.' },
  { h: 'By taxi / ride-hail', p: `Ask for “${church.name}, ${church.address.line2}”. Drivers in ${church.city} know the area; have them set down at the main gate.` },
  { h: 'Accessibility', p: 'Step-free entrance, accessible toilets, reserved seating, and a hearing-friendly section near the front. A greeter will help you to your seat.' },
];

export default function VisitPage() {
  return (
    <>
      <PageHero
        eyebrow="Find us"
        title="Getting here is the easy part."
        lede={`We meet at ${church.address.line2}, ${church.city}. Here’s everything you need to arrive relaxed.`}
      />

      <section className="section">
        <div className="shell"><div data-reveal><MapBlock /></div></div>
      </section>

      <section className="section section--tight">
        <div className="shell visit-cols">
          <div>
            <h2 data-reveal>Getting here</h2>
            <ul className="getting">
              {getting.map((g) => (
                <li className="getting__item" data-reveal key={g.h}>
                  <h3 className="getting__h">{g.h}</h3>
                  <p>{g.p}</p>
                </li>
              ))}
            </ul>
          </div>
          <Card asChild>
          <aside data-reveal>
            <ServiceTimes heading="When to come" />
          </aside>
          </Card>
        </div>
      </section>
    </>
  );
}
