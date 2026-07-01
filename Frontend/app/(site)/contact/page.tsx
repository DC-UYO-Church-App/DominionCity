import type { Metadata } from 'next';
import PageHero from '@/components/site/PageHero';
import { Button } from '@/components/site/ui/button';
import { Card } from '@/components/site/ui/card';
import { Input } from '@/components/site/ui/input';
import { Textarea } from '@/components/site/ui/textarea';
import { Label } from '@/components/site/ui/label';
import { church } from '@/data/site';
import './contact.css';

export const metadata: Metadata = {
  title: 'Contact',
  description: "Get in touch with Dominion City, Uyo — ask a question, request prayer, or tell us you're coming this Sunday.",
  alternates: { canonical: '/contact/' },
};

export default function ContactPage() {
  const phoneHref = `tel:${church.phone.replace(/\s/g, '')}`;

  return (
    <>
      <PageHero
        eyebrow="Say hello"
        title="We’d genuinely love to hear from you."
        lede="A real person reads every message. Ask anything, request prayer, or just tell us you’re coming."
      />

      <section className="section">
        <div className="shell contact-grid">
          {/* Form posts to a real endpoint; works without JS. Replace action with
              your form handler (Formspree/Payload/etc.) at launch. */}
          <Card asChild className="contact-form">
          <form method="post" action="https://formspree.io/f/your-id" data-reveal>
            <h2 className="contact-form__h">Send a message</h2>

            <div className="field">
              <Label htmlFor="name">Your name</Label>
              <Input id="name" name="name" type="text" autoComplete="name" required />
            </div>

            <div className="field">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </div>

            <div className="field">
              <Label htmlFor="reason">What’s this about?</Label>
              <select id="reason" name="reason">
                <option>I’m planning to visit</option>
                <option>I’d like prayer</option>
                <option>A general question</option>
                <option>Getting involved / serving</option>
                <option>Giving</option>
              </select>
            </div>

            <div className="field">
              <Label htmlFor="message">Your message <span className="field__opt">(prayer requests are kept private)</span></Label>
              <Textarea id="message" name="message" rows={5} required></Textarea>
            </div>

            <label className="field-check">
              <input type="checkbox" name="urgent" />
              <span>This is urgent — please call me back today.</span>
            </label>

            <Button variant="gold" type="submit">Send message</Button>
            <p className="contact-form__fallback">Prefer not to use a form? Email <a className="link" href={`mailto:${church.email}`}>{church.email}</a>.</p>
          </form>
          </Card>

          <aside className="contact-side" data-reveal>
            <Card>
              <h2 className="contact-side__h">Reach us directly</h2>
              <ul className="contact-side__list">
                <li><span>Call</span><a className="link" href={phoneHref}>{church.phone}</a></li>
                <li><span>WhatsApp</span><a className="link" href={`https://wa.me/${church.whatsapp.replace(/[^0-9]/g, '')}`} rel="noopener">Message us</a></li>
                <li><span>Email</span><a className="link" href={`mailto:${church.email}`}>{church.email}</a></li>
              </ul>
            </Card>
            <Card>
              <h2 className="contact-side__h">Visit</h2>
              <address className="contact-side__addr">
                {church.address.line1}<br />{church.address.line2}<br />{church.address.cityState}<br />{church.address.country}
              </address>
              <a className="link" href="/visit/">Map &amp; directions →</a>
            </Card>
            <Card className="contact-side__pray">
              <h2 className="contact-side__h">Need prayer right now?</h2>
              <p>You don’t have to wait. Send a prayer request above and tick “urgent”, and someone on our prayer team will reach out today.</p>
            </Card>
          </aside>
        </div>
      </section>
    </>
  );
}
