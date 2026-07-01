/* Footer — on every page, it repeats the three things a visitor came for:
   when, where, and how to reach us. Service times here mean the answer is
   never more than a scroll away, on any page, with no JS. */
import { church, services, nav } from '@/data/site';
import './Footer.css';

export default function Footer() {
  const sundays = services.filter((s) => s.day === 'Sunday');
  const year = new Date().getFullYear();

  return (
    <footer className="footer on-dark">
      <div className="shell footer__grid">
        <div className="footer__col footer__brand-col">
          <p className="footer__brand">{church.name}</p>
          <p className="footer__tag">{church.tagline}</p>
          <p className="footer__verse">“A city that is set on a hill cannot be hidden.” — Matthew 5:14</p>
        </div>

        <div className="footer__col">
          <h2 className="footer__h">Sundays</h2>
          <ul className="footer__list">
            {sundays.map((s) => (
              <li key={s.name}><strong>{s.time}</strong> · {s.name}</li>
            ))}
          </ul>
          <p className="footer__small">All times {church.timezone}. <a className="link" href="/plan-your-visit/">Plan your visit →</a></p>
        </div>

        <div className="footer__col">
          <h2 className="footer__h">Find us</h2>
          <address className="footer__addr">
            {church.address.line1}<br />
            {church.address.line2}<br />
            {church.address.cityState}, {church.address.country}
          </address>
          <p className="footer__small"><a className="link" href="/visit/">Get directions →</a></p>
        </div>

        <div className="footer__col">
          <h2 className="footer__h">Explore</h2>
          <ul className="footer__list footer__list--links">
            {nav.map((item) => (<li key={item.href}><a href={item.href}>{item.label}</a></li>))}
            <li><a href="/give/">Give</a></li>
          </ul>
        </div>

        <div className="footer__col">
          <h2 className="footer__h">Reach us</h2>
          <ul className="footer__list footer__list--links">
            <li><a href={`tel:${church.phone.replace(/\s/g, '')}`}>{church.phone}</a></li>
            <li><a href={`mailto:${church.email}`}>{church.email}</a></li>
            <li><a href={church.social.youtube} rel="noopener">YouTube</a></li>
            <li><a href={church.social.instagram} rel="noopener">Instagram</a></li>
          </ul>
        </div>
      </div>

      <div className="shell footer__base">
        <p>© {year} {church.name}, {church.city}. Built for our city — warm, quick, and easy to use on any modern phone.</p>
      </div>
    </footer>
  );
}
