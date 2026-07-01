import type { Metadata } from 'next';
import PageHero from '@/components/site/PageHero';
import ImagePlaceholder from '@/components/site/ImagePlaceholder';
import { Button } from '@/components/site/ui/button';
import { Card } from '@/components/site/ui/card';
import { cx } from '@/lib/cx';
import { church } from '@/data/site';
import './give.css';

export const metadata: Metadata = {
  title: 'Give',
  description: 'Give to Dominion City securely — online, by bank transfer, or in person. Every gift supports Sunday services, Dominion Kids, and our city.',
  alternates: { canonical: '/give/' },
};

const ways = [
  {
    h: 'Online',
    p: 'The quickest way — by card or bank app, on any device. You’ll get an instant receipt.',
    action: { label: 'Give online', href: '#' },
    primary: true,
  },
  {
    h: 'Bank transfer',
    p: 'Send directly from your bank. Use your name as the reference so we can thank you.',
    detail: ['Dominion City', 'Account 0000000000 · TODO:CONFIRM Bank', 'Sort / routing on request'],
  },
  {
    h: 'In person',
    p: 'Give at any Sunday service at the giving points, by cash or transfer. A steward can help.',
  },
] as const;

export default function GivePage() {
  return (
    <>
      <PageHero
        eyebrow="Give"
        title="Build the city with us."
        lede="Generosity is how a church becomes a home and a city gets reached. Thank you for being part of it."
      />

      <section className="section">
        <div className="shell give-intro" data-reveal>
          <p className="give-intro__lead">
            Every gift goes to work you can see on a Sunday: worship and teaching,
            <strong> Dominion Kids</strong>, caring for people in need, and reaching
            our city with hope. We keep it simple, and we keep it honest.
          </p>
          <div className="give-intro__media">
            <ImagePlaceholder ratio="4/3" tone="light" label="The work your giving makes possible" />
          </div>
        </div>

        <div className="shell ways" id="ways">
          {ways.map((w) => (
            <Card asChild className={cx('way', { 'way--primary': 'primary' in w && w.primary })} key={w.h}>
            <article data-reveal>
              <h2 className="way__h">{w.h}</h2>
              <p className="way__p">{w.p}</p>
              {'detail' in w && w.detail && (
                <ul className="way__detail">{w.detail.map((d) => <li key={d}>{d}</li>)}</ul>
              )}
              {'action' in w && w.action && (
                <Button asChild variant={'primary' in w && w.primary ? 'gold' : 'ghost'}>
                  <a href={w.action.href}>{w.action.label}</a>
                </Button>
              )}
            </article>
            </Card>
          ))}
        </div>
      </section>

      <section className="section section--tight">
        <div className="shell trust" data-reveal>
          <h2 className="u-center">You can trust where this goes</h2>
          <ul className="trust__grid">
            <li><strong>Secure.</strong> Online gifts are processed over an encrypted, PCI-compliant connection. We never store your card.</li>
            <li><strong>Accountable.</strong> Our accounts are independently reviewed every year, and the summary is available to members on request.</li>
            <li><strong>No pressure, ever.</strong> Giving is for those who already call Dominion City home. A first-time visitor owes us nothing.</li>
          </ul>
        </div>
      </section>

      <section className="section on-dark cta-band">
        <div className="shell u-center" data-reveal>
          <h2>Questions about giving?</h2>
          <p className="lede" style={{ marginInline: 'auto' }}>Our office is glad to help with one-off or regular gifts, Gift Aid equivalents, or legacy giving.</p>
          <p style={{ marginTop: 'var(--space-md)' }}><a className="link on-dark" href={`mailto:${church.email}`}>{church.email}</a></p>
        </div>
      </section>
    </>
  );
}
