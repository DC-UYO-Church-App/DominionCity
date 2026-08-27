/* ============================================================================
   VERSE CHECKER — `npm run verses:check`
   ----------------------------------------------------------------------------
   A maintenance script (Node, never shipped to the browser). It reads every
   entry in data/verses.ts and checks the wording and the reference against the
   King James text from bible-api.com — a free, no-key, public-domain service.

   Entries are deliberately trimmed to one readable sentence, so the test is
   "does our text appear inside the verse the API returns for that reference?".
   A FAIL therefore means one of two things: the wording drifted, or the
   reference is wrong. Both are worth knowing before it greets a visitor.

   This is the right place for an API — at author time, run by a person, on a
   file that then ships as static data. The site itself never calls out: the
   verse cloud must render instantly and offline, and 15 rotations a minute
   per visitor would bury a free service (it rate-limits at well under 130
   sequential requests, hence the backoff below).
   ========================================================================== */

import { readFile } from 'node:fs/promises';

const API = (ref) =>
  `https://bible-api.com/${encodeURIComponent(ref)}?translation=kjv`;

/* Lowercase, strip punctuation and collapse whitespace, so that curly
   apostrophes, a trimmed trailing colon or a capitalised first word of an
   excerpt don't read as differences. */
const norm = (s) =>
  s
    .replace(/[’‘]/g, "'")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* References where the API's own KJV text is at fault, not ours. Checked by
   hand against a printed KJV; listed here so a clean run still exits 0.
     Mark 11:24 — the service returns "ye shall havethem" (missing space). */
const UPSTREAM_TYPOS = new Set(['Mark 11:24']);

async function fetchVerse(ref) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(API(ref));
    if (res.status === 429) {          // free service — back off and wait
      await sleep(20_000 * (attempt + 1));
      continue;
    }
    if (!res.ok) return { error: `HTTP ${res.status}` };
    const data = await res.json();
    return data.text ? { text: data.text } : { error: 'reference not found' };
  }
  return { error: 'rate limited' };
}

const src = await readFile(new URL('../data/verses.ts', import.meta.url), 'utf8');
const entries = [...src.matchAll(/\{ text: '(.*?)', ref: '(.*?)' \}/g)].map(
  ([, text, ref]) => ({ text: text.replace(/\\'/g, "'"), ref }),
);

console.log(`Checking ${entries.length} verses against the KJV…\n`);

const problems = [];
for (const [i, { text, ref }] of entries.entries()) {
  const { text: kjv, error } = await fetchVerse(ref);
  const n = String(i + 1).padStart(3);
  if (error) {
    problems.push({ ref, ours: text, kjv: `(${error})` });
    console.log(`${n} ERR  ${ref} — ${error}`);
  } else if (norm(kjv).includes(norm(text))) {
    console.log(`${n} ok   ${ref}`);
  } else if (UPSTREAM_TYPOS.has(ref)) {
    console.log(`${n} ok   ${ref} (skipped — known typo in the API's text)`);
  } else {
    problems.push({ ref, ours: text, kjv: kjv.replace(/\s+/g, ' ').trim() });
    console.log(`${n} FAIL ${ref}`);
  }
  await sleep(1200);
}

console.log(`\n${entries.length - problems.length}/${entries.length} verified`);
for (const p of problems) {
  console.log(`\n${p.ref}\n  ours: ${p.ours}\n  kjv : ${p.kjv.slice(0, 400)}`);
}
process.exit(problems.length ? 1 : 0);
