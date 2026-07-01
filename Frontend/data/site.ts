/* ============================================================================
   DOMINION CITY — SITE CONTENT ("the CMS the congregation lives in")
   ----------------------------------------------------------------------------
   This file is the single editable source of truth for the facts a visitor
   needs. Church staff can change service times, address and contacts here
   without touching design code. In production this maps cleanly onto Sanity /
   Payload documents.

   NOTE ON ACCURACY: Dominion City is a real contemporary Pentecostal church
   (founded by Pastor David Ogbueli, HQ Uyo, Nigeria). The service
   times, exact street address, phone and giving details below are realistic
   PLACEHOLDERS marked TODO:CONFIRM — they must be verified with the church
   office before launch. Everything is structured; only the values need editing.
   ========================================================================== */

export const church = {
  name: 'Dominion City Uyo HQ',
  // "A city set on a hill cannot be hidden" — Matthew 5:14
  tagline: 'The wealthy place.',
  founded: 1996,
  pastor: 'Pastor David Ogbueli',
  city: 'Uyo City',
  timezone: 'WAT', // West Africa Time, UTC+1
  // TODO:CONFIRM — representative HQ address; verify with the church office.
  address: {
    line1: 'Dominion City HQ',
    line2: 'Off Oron Road',
    cityState: 'Uyo, Akwa Ibom State',
    country: 'Nigeria',
  },
  // Map: centred on Uyo until the exact pin is confirmed.
  mapEmbed:
    'https://www.openstreetmap.org/export/embed.html?bbox=7.87%2C5.00%2C7.95%2C5.07&layer=mapnik&marker=5.0377%2C7.9128',
  mapLink: 'https://www.openstreetmap.org/?mlat=5.0377&mlon=7.9128#map=14/5.0377/7.9128',
  phone: '+234 800 000 0000', // TODO:CONFIRM
  whatsapp: '+234 800 000 0000', // TODO:CONFIRM
  email: 'hello@dominioncity.org', // TODO:CONFIRM
  social: {
    youtube: 'https://www.youtube.com/@dominioncity',
    instagram: 'https://www.instagram.com/dominioncity',
    facebook: 'https://www.facebook.com/dominioncity',
  },
};

export type Service = {
  name: string;
  day: string;
  time: string;       // human, in WAT
  note?: string;
  streamed?: boolean;
};

// Ordered the way the week actually runs — the rhythm IS the structure.
export const services: Service[] = [
  { name: 'One Service',  day: 'Sunday',    time: '8:00 AM - 12:00 PM',  note: 'Come and be blessed', streamed: true },
  { name: 'Word & Prayer',  day: 'Wednesday', time: '5:30 PM - 8:00 PM',  note: 'Midweek teaching',          streamed: true },
  { name: 'Wailing Women',  day: 'Thursday',   time: '5:00 PM - 7:00 PM',  note: 'Prayer for our homes, city and nation' },
  { name: 'Dominion Hour of Prayer',  day: 'Saturday',    time: '6:00 AM',  note: 'Prayer & Worship' },
];

export const nav = [
  { label: 'Plan Your Visit', href: '/plan-your-visit/' },
  { label: 'Watch', href: '/watch/' },
  { label: 'Sermons', href: '/sermons/' },
  { label: 'Events', href: '/events/' },
  { label: 'Library', href: '/library/' },
  { label: 'About', href: '/about/' },
  { label: 'Contact', href: '/contact/' },
];

export type Sermon = {
  title: string;
  speaker: string;
  series?: string;
  date: string;        // ISO
  scripture: string;
  duration: string;
  blurb: string;
};

export const sermons: Sermon[] = [
  {
    title: 'A City That Cannot Be Hidden',
    speaker: 'Pastor David Ogbueli',
    series: 'Dominion Mandate',
    date: '2026-06-07',
    scripture: 'Matthew 5:14–16',
    duration: '48 min',
    blurb:
      'What it means to be light that a whole region can see — and why a city on a hill was never meant to dim itself to fit in.',
  },
  {
    title: 'Joy Comes in the Morning',
    speaker: 'Pastor Grace Ogbueli',
    series: 'Dominion Mandate',
    date: '2026-05-31',
    scripture: 'Psalm 30:5',
    duration: '41 min',
    blurb:
      'The night is real, but it is not the end of the story. A word for anyone waiting on a morning that feels slow to come.',
  },
  {
    title: 'Take Dominion',
    speaker: 'Pastor David Ogbueli',
    series: 'Dominion Mandate',
    date: '2026-05-24',
    scripture: 'Genesis 1:26–28',
    duration: '52 min',
    blurb:
      'The first assignment ever given to humanity — and how it still reads over your work, your home, and your city today.',
  },
  {
    title: 'Built Together',
    speaker: 'Pastor Emeka Nwosu',
    series: 'The Household',
    date: '2026-05-17',
    scripture: 'Ephesians 2:19–22',
    duration: '44 min',
    blurb:
      'No one is meant to follow Jesus alone. How a church becomes a home, and a crowd becomes a household.',
  },
];

export type ChurchEvent = {
  title: string;
  date: string;        // ISO
  time: string;
  place: string;
  blurb: string;
  tag?: string;
};

export const events: ChurchEvent[] = [
  {
    title: 'First-Timers Lunch',
    date: '2026-06-14',
    time: 'After 2nd Service',
    place: 'The Welcome Room',
    blurb: 'New here? Eat with us, meet a pastor, ask anything. No pressure, no sign-up.',
    tag: "I'm new",
  },
  {
    title: 'City Nights — Worship',
    date: '2026-06-20',
    time: '6:00 PM',
    place: 'Main Auditorium',
    blurb: 'An evening of worship and prayer for the whole city. Bring a friend.',
    tag: 'Worship',
  },
  {
    title: 'Dominion Kids Holiday Club',
    date: '2026-07-05',
    time: '10:00 AM',
    place: 'Kids City',
    blurb: 'A week of stories, games and songs for ages 3–11. Free; register at the desk.',
    tag: 'Families',
  },
];

// ---------------------------------------------------------------------------
// LIBRARY — titles available to borrow or buy from the resource desk.
// TODO:CONFIRM — placeholder catalogue; confirm titles, authors and stock with
// the resource desk before launch.
export type Book = {
  title: string;
  author: string;
  category: string;       // shelf / theme
  format: 'Paperback' | 'Ebook' | 'Audiobook';
  pages?: number;
  blurb: string;
  available: boolean;     // on the shelf now vs all copies out on loan
};

export const books: Book[] = [
  {
    title: 'The Dominion Mandate',
    author: 'Pastor David Ogbueli',
    category: 'Foundations',
    format: 'Paperback',
    pages: 184,
    blurb: 'Where our name begins — the call in Genesis to take responsibility, and what it means for ordinary people today.',
    available: true,
  },
  {
    title: 'The Year of the Eagle',
    author: 'Pastor David Ogbueli',
    category: 'Devotional',
    format: 'Paperback',
    pages: 152,
    blurb: 'Thirty-one reflections on renewal, vision and rising again — one for each day of the month.',
    available: true,
  },
  {
    title: 'A City Set on a Hill',
    author: 'Dominion City Press',
    category: 'Church Life',
    format: 'Ebook',
    pages: 96,
    blurb: 'The story and beliefs of Dominion City, and an invitation into the life of the church.',
    available: true,
  },
  {
    title: 'The Wealthy Place',
    author: 'Pastor David Ogbueli',
    category: 'Stewardship',
    format: 'Audiobook',
    blurb: 'A practical, scriptural look at provision, generosity and building well with what you have.',
    available: false,
  },
  {
    title: 'Raising Dominion Kids',
    author: 'Dominion Kids Team',
    category: 'Family',
    format: 'Paperback',
    pages: 128,
    blurb: 'A warm guide for parents on nurturing faith at home, from the team behind Dominion Kids.',
    available: true,
  },
  {
    title: 'First Sunday',
    author: 'The Welcome Team',
    category: 'New Here',
    format: 'Ebook',
    pages: 64,
    blurb: 'Everything a first-time visitor wonders — what to expect, what to wear, and where to start.',
    available: true,
  },
];
