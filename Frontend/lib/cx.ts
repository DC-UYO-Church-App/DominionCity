/* Tiny classNames helper — the React stand-in for Astro's `class:list`.
   Accepts strings and { 'class-name': boolean } maps, drops the falsy ones. */
type CxArg = string | false | null | undefined | Record<string, boolean | undefined>;

export function cx(...args: CxArg[]): string {
  const out: string[] = [];
  for (const a of args) {
    if (!a) continue;
    if (typeof a === 'string') out.push(a);
    else for (const [k, v] of Object.entries(a)) if (v) out.push(k);
  }
  return out.join(' ');
}
