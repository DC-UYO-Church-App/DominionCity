import type { Metadata } from 'next';
import PageHero from '@/components/site/PageHero';
import ServiceTimes from '@/components/site/ServiceTimes';
import MapBlock from '@/components/site/MapBlock';
import ImagePlaceholder from '@/components/site/ImagePlaceholder';
import { Button } from '@/components/site/ui/button';
import { Card } from '@/components/site/ui/card';
import './plan-your-visit.css';

export const metadata: Metadata = {
  title: 'Plan Your Visit',
  description: 'Exactly what to expect on your first Sunday at Dominion City, Uyo — what to wear, where to park, and how your kids are cared for.',
  alternates: { canonical: '/plan-your-visit/' },
};

const steps = [
  { n: '01', h: 'When you arrive', p: 'Park free on site and look for a greeter in a lanyard. Tell them it’s your first time — they’ll walk you in and find you a good seat.' },
  { n: '02', h: 'During the service', p: 'About 90 minutes: sung worship, a clear and practical message from the Bible, and a chance to pray. Stand, sit, sing, or just watch — all welcome.' },
  { n: '03', h: 'For your kids', p: 'Check Dominion Kids in at the desk before service. It’s safe, secure, and split by age (3–11). You’ll get a matching pickup tag.' },
  { n: '04', h: 'After we finish', p: 'Stay for coffee. Come to the First-Timers Lunch if it’s on. There’s zero pressure to give, sign up, or do anything but be welcomed.' },
];

const faqs = [
  { q: 'What should I wear?', a: 'Whatever you’re comfortable in. You’ll see jeans and trainers next to suits and traditional dress. Nobody is checking.' },
  { q: 'Will I be singled out or asked for money?', a: 'No. We won’t put a spotlight on visitors, and you’re never expected to give. Giving is for those who already call this home.' },
  { q: 'I have a disability — can I get around?', a: 'Yes. There’s step-free access at the main entrance, accessible toilets, and reserved seating. Tell a greeter what you need and we’ll help.' },
  { q: 'Can I come alone?', a: 'Absolutely — many do. Tell a greeter and you won’t have to find your way alone. By the end you’ll know a face or two.' },
  { q: 'Is there parking?', a: 'Yes, free, on site. Arrive about 15 minutes early for the easiest spot, especially before 2nd Service.' },
];

export default function PlanYourVisitPage() {
  return (
    <>
      <PageHero
        eyebrow="I'm new"
        title="Plan your visit"
        lede="The unknown is the only hard part of visiting a church. So here is precisely what your first Sunday looks like — no surprises."
      />

      <section className="section section--tight">
        <div className="shell">
          <div className="visit-banner" data-reveal>
            <ImagePlaceholder ratio="21/9" tone="light" label="A welcoming Sunday morning at Dominion City" />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell visit-grid">
          <ol className="steps">
            {steps.map((s) => (
              <li className="step" data-reveal key={s.n}>
                <span className="step__n">{s.n}</span>
                <div>
                  <h2 className="step__h">{s.h}</h2>
                  <p>{s.p}</p>
                </div>
              </li>
            ))}
          </ol>
          <Card asChild className="visit-side">
          <aside data-reveal>
            <ServiceTimes heading="Service times" />
          </aside>
          </Card>
        </div>
      </section>

      <section className="section section--tight">
        <div className="shell">
          <h2 className="u-center faq__title" data-reveal>Honest answers</h2>
          <div className="faq">
            {faqs.map((f) => (
              <details className="faq__item" data-reveal key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="shell"><div data-reveal><MapBlock /></div></div>
      </section>

      <section className="section on-dark cta-band">
        <div className="shell u-center" data-reveal>
          <h2>We’ll be looking out for you.</h2>
          <p className="lede" style={{ marginInline: 'auto' }}>Tell us you’re coming and we’ll have someone ready at the door with your name.</p>
          <p className="cta-band__btns"><Button asChild variant="gold"><a href="/contact/">Let us know you’re coming</a></Button></p>
        </div>
      </section>
    </>
  );
}
