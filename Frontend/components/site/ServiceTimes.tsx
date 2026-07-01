/* Service times — the single most important block on the site. Big, scannable,
   tabular figures, JS-free. A grandmother finds Sunday in five seconds here. */
import { services, church } from '@/data/site';
import './ServiceTimes.css';

interface Props { heading?: string }

export default function ServiceTimes({ heading = 'This Sunday' }: Props) {
  const sundays = services.filter((s) => s.day === 'Sunday');
  const midweek = services.filter((s) => s.day !== 'Sunday');

  return (
    <div className="times">
      <div className="times__head">
        <p className="eyebrow">{heading}</p>
        <p className="times__tz">All times {church.timezone} (West Africa Time)</p>
      </div>

      <ul className="times__list">
        {sundays.map((s) => (
          <li className="times__item" key={s.name}>
            <span className="times__time">{s.time}</span>
            <span className="times__name">
              {s.name}
              {s.streamed && <span className="times__live" title="Streamed live">● Live</span>}
            </span>
            {s.note && <span className="times__note">{s.note}</span>}
          </li>
        ))}
      </ul>

      {midweek.length > 0 && (
        <div className="times__midweek">
          <p className="times__midweek-h">In the week</p>
          <ul className="times__mid-list">
            {midweek.map((s) => (
              <li key={s.name}><strong>{s.day}</strong> {s.time} — {s.name}{s.note ? ` · ${s.note}` : ''}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
