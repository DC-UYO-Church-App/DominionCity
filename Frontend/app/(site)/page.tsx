import CityHero from '@/components/site/CityHero';
import ServiceTimes from '@/components/site/ServiceTimes';
import MapBlock from '@/components/site/MapBlock';
import SermonCard from '@/components/site/SermonCard';
import EventCard from '@/components/site/EventCard';
import Carousel from '@/components/site/Carousel';
import Loader from '@/components/site/Loader';
import { Button } from '@/components/site/ui/button';
import { Card } from '@/components/site/ui/card';
import { sermons, events } from '@/data/site';
import './home.css';

// Photos for the "New here?" carousel — edit/reorder freely.
const expectSlides = [
  { src: '/img/d12.jpg', alt: 'The congregation gathered for Sunday service', caption: 'Sunday, gathered as one.' },
  { src: '/img/d15.jpg', alt: 'Worship during a Dominion City service', caption: 'Worship that lifts the room.' },
  { src: '/img/d13.jpg', alt: 'A warm welcome at the door on a Sunday', caption: 'A welcome at the door.' },
  { src: '/img/d8.jpg', alt: 'The church serving the city', caption: 'Fellowshiping together.' },
];

const recentSermons = sermons.slice(0, 3);
const upcoming = events.slice(0, 3);

// The visitor's journey, in order: welcome → when/where → what to expect →
// who we are → what we're saying → what's on → an invitation to give.
const expectations = [
  { h: 'Come as you are', p: 'Jeans or your best — both are right. No one is watching what you wear. Walk in, you belong.' },
  { h: 'Your kids are covered', p: 'Dominion Kids runs during every Sunday service — safe, fun, and age-grouped from 3 to 11.' },
  { h: 'About 90 minutes', p: 'Worship, a clear and practical message, and time to pray. You can slip out any time you need to.' },
  { h: 'Someone is expecting you', p: 'Tell a greeter it’s your first time and they’ll walk you in, find you a seat, and answer anything.' },
];

export default function HomePage() {
  return (
    <>
      <Loader />

      <CityHero />

      {/* WHEN / WHERE — the homepage's one job, answered immediately */}
      <section className="section" id="this-sunday">
        <div className="shell home-grid">
          <div data-reveal>
            <ServiceTimes />
            <p className="home-grid__cta">
              <Button asChild variant="gold"><a href="/plan-your-visit/">Plan your visit</a></Button>
              <a className="link" href="/visit/">See the map &amp; directions →</a>
            </p>
          </div>
          <Card asChild className="home-where">
          <aside data-reveal>
            <p className="eyebrow">Where</p>
            <p className="home-where__addr">Off Oron Road<br />Uyo, Akwa Ibom State</p>
            <p className="home-where__note">Free parking · step-free entrance · greeters at the door.</p>
            <a className="link" href="/visit/">Get directions →</a>
          </aside>
          </Card>
        </div>
      </section>

      {/* WHAT TO EXPECT — remove fear for the first-timer */}
      <section className="section on-dark expect">
        <div className="shell">
          <div className="expect__top">
            <header className="expect__head" data-reveal>
              <p className="eyebrow on-dark">New here?</p>
              <h2>Your first Sunday, with nothing to figure out.</h2>
              <p className="lede">The hardest part of visiting a church is the unknown. Here’s exactly what walking through our doors is like.</p>
            </header>
            <div className="expect__media" data-reveal>
              <Carousel slides={expectSlides} ratio="4/3" tone="dark" label="Life at Dominion City" />
            </div>
          </div>
          <ul className="expect__grid">
            {expectations.map((e) => (
              <li className="expect__item" data-reveal key={e.h}>
                <h3 className="expect__h">{e.h}</h3>
                <p>{e.p}</p>
              </li>
            ))}
          </ul>
          <p className="expect__cta" data-reveal><Button asChild variant="gold"><a href="/plan-your-visit/">Read the full visitor guide</a></Button></p>
        </div>
      </section>

      {/* WHO WE ARE — specific to Dominion City, no generic "faith/hope/love" */}
      <section className="section identity">
        <div className="shell identity__grid">
          <div className="identity__wrap" data-reveal>
            <p className="eyebrow">Why “Dominion City”</p>
            <p className="identity__statement">
              A city set on a hill <em>cannot be hidden.</em> We take our name from the
              first words ever spoken over people — <span className="identity__ref">“have dominion”</span>
              (Genesis 1:28) — and from the city Jesus said the world was meant to see.
              We’re here to be light our city can find from a long way off.
            </p>
            <p className="identity__more"><a className="link" href="/about/">Read our story &amp; beliefs →</a></p>
          </div>
          <div className="identity__media" data-reveal>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="media-img" style={{ aspectRatio: '4 / 5' }} src="/img/d11.jpg"
              alt="The congregation lifted in worship" width="800" height="1000"
              loading="lazy" decoding="async" />
          </div>
        </div>
      </section>

      {/* WHAT WE'RE SAYING — recent sermons */}
      <section className="section section--tight">
        <div className="shell">
          <header className="row-head" data-reveal>
            <div>
              <p className="eyebrow">Recent messages</p>
              <h2>Catch up, or start here.</h2>
            </div>
            <a className="link" href="/sermons/">All sermons →</a>
          </header>
          <div className="cards-3">
            {recentSermons.map((s, i) => <SermonCard sermon={s} featured={i === 0} key={s.title} />)}
          </div>
        </div>
      </section>

      {/* WHAT'S ON — events */}
      <section className="section section--tight">
        <div className="shell">
          <header className="row-head" data-reveal>
            <div>
              <p className="eyebrow">What’s on</p>
              <h2>Come find your people.</h2>
            </div>
            <a className="link" href="/events/">Full calendar →</a>
          </header>
          <div className="cards-events">
            {upcoming.map((e) => <EventCard event={e} key={e.title} />)}
          </div>
        </div>
      </section>

      {/* GIVE — top conversion goal, warm and trustworthy */}
      <section className="section on-dark give-band">
        <div className="shell give-band__inner" data-reveal>
          <div className="give-band__text">
            <p className="eyebrow on-dark">Give</p>
            <h2>Build the city with us.</h2>
            <p className="lede">Every gift goes to the work you can see — Sunday services, Dominion Kids, and reaching our city. Secure, and it takes a minute.</p>
            <div className="give-band__cta">
              <Button asChild variant="gold"><a href="/give/">Give now</a></Button>
              <Button asChild variant="ghost"><a href="/give/#ways">Other ways to give</a></Button>
            </div>
          </div>
          <div className="give-band__media">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="media-img" style={{ aspectRatio: '4 / 3' }} src="/img/d7.jpg"
              alt="Generosity in action — serving the city" width="800" height="600"
              loading="lazy" decoding="async" />
          </div>
        </div>
      </section>

      {/* WHERE — full map, last so it anchors the page */}
      <section className="section section--tight" id="visit">
        <div className="shell">
          <header className="row-head" data-reveal>
            <div>
              <p className="eyebrow">Visit us</p>
              <h2>We’d love to meet you.</h2>
            </div>
          </header>
          <div data-reveal><MapBlock /></div>
        </div>
      </section>
    </>
  );
}
