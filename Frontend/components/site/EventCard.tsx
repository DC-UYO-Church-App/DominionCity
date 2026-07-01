import type { ChurchEvent } from '@/data/site';
import ImagePlaceholder from './ImagePlaceholder';
import { Card } from '@/components/site/ui/card';
import './EventCard.css';

interface Props { event: ChurchEvent }

export default function EventCard({ event }: Props) {
  const d = new Date(event.date);
  const day = d.toLocaleDateString('en-GB', { day: '2-digit' });
  const mon = d.toLocaleDateString('en-GB', { month: 'short' });

  return (
    <Card asChild className="event">
    <article data-reveal>
      <div className="event__thumb">
        <ImagePlaceholder ratio="16/9" tone="light" label={`Photo — ${event.title}`} />
        {event.tag && <span className="event__tag">{event.tag}</span>}
      </div>
      <div className="event__row">
        <div className="event__date" aria-hidden="true">
          <span className="event__day">{day}</span>
          <span className="event__mon">{mon}</span>
        </div>
        <div className="event__body">
          <h3 className="event__title">{event.title}</h3>
          <p className="event__when">{event.time} · {event.place}</p>
          <p className="event__blurb">{event.blurb}</p>
        </div>
      </div>
    </article>
    </Card>
  );
}
