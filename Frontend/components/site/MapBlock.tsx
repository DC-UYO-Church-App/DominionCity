/* Map — lazy-loaded iframe so it never blocks first paint on a slow phone.
   A real address + a "directions" link sit beside it, so the location is fully
   usable even if the map tile never loads. */
import { church } from '@/data/site';
import { Button } from '@/components/site/ui/button';
import './MapBlock.css';

export default function MapBlock() {
  return (
    <div className="map">
      <div className="map__info">
        <h3 className="map__h">Find Dominion City</h3>
        <address className="map__addr">
          {church.address.line1}<br />
          {church.address.line2}<br />
          {church.address.cityState}<br />
          {church.address.country}
        </address>
        <p className="map__note">Free parking on site. Step-free access at the main entrance. Greeters at the door from 30 minutes before each service.</p>
        <Button asChild variant="ghost"><a href={church.mapLink} rel="noopener" target="_blank">Get directions</a></Button>
      </div>
      <div className="map__frame">
        <iframe
          title="Map showing Dominion City, Uyo"
          src={church.mapEmbed}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>
    </div>
  );
}
