/**
 * Swedish personnummer and samordningsnummer.
 *
 * Accepted input: 10 or 12 digits, with or without a '-' or '+' separator,
 * spaces ignored. Output is always the 12-digit form `YYYYMMDD-XXXX`.
 */

function utcDay(d: Date): number {
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Day of month with the samordningsnummer offset (+60) removed. */
function realDay(dd: string): number {
  const n = Number(dd);
  return n > 60 ? n - 60 : n;
}

function luhnOk(tenDigits: string): boolean {
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    let d = Number(tenDigits[i]) * (i % 2 === 0 ? 2 : 1);
    if (d > 9) d -= 9;
    sum += d;
  }
  return sum % 10 === 0;
}

/**
 * Normalise a personnummer or samordningsnummer to `YYYYMMDD-XXXX`.
 * Returns `null` if the format, the date or the Luhn check digit is wrong.
 *
 * For the 10-digit form the century is derived from `today`:
 * - the person is assumed to be under 100, unless the separator is '+'
 *   ('+' means 100 years or older, per folkbokföringslagen);
 * - the full birth DATE is compared with today, not only the year. A person
 *   born on 15 December 1926 who writes `261215-XXXX` in October 2026 is 99,
 *   not unborn.
 */
export function normalizePersonnummer(raw: string, today: Date = new Date()): string | null {
  if (typeof raw !== 'string') return null;
  const s = raw.replace(/\s/g, '');
  const m = /^(\d{2})?(\d{2})(\d{2})(\d{2})([-+]?)(\d{4})$/.exec(s);
  if (!m) return null;
  const [, centIn, yy, mm, dd, sep, last] = m;
  let cent = centIn;
  if (!cent) {
    let full = 2000 + Number(yy);
    if (Date.UTC(full, Number(mm) - 1, realDay(dd)) > utcDay(today)) full -= 100;
    if (sep === '+') full -= 100;
    cent = String(full).slice(0, 2);
  }
  if (!luhnOk(`${yy}${mm}${dd}${last}`)) return null;
  const day = realDay(dd);
  const year = Number(cent + yy);
  const date = new Date(Date.UTC(year, Number(mm) - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== Number(mm) - 1 || date.getUTCDate() !== day) return null;
  return `${cent}${yy}${mm}${dd}-${last}`;
}

/** True if `raw` is a valid personnummer or samordningsnummer. */
export function isValidPersonnummer(raw: string, today: Date = new Date()): boolean {
  return normalizePersonnummer(raw, today) !== null;
}

/** True if the number is a samordningsnummer (day of month + 60). */
export function isSamordningsnummer(raw: string, today: Date = new Date()): boolean {
  const n = normalizePersonnummer(raw, today);
  return n !== null && Number(n.slice(6, 8)) > 60;
}

/**
 * Age in whole years on the date `onIso` (`YYYY-MM-DD`).
 * Accepts any form `normalizePersonnummer` accepts; a 10-digit number is
 * resolved relative to `onIso`. Returns `null` for an invalid number or date.
 */
export function ageFromPersonnummer(pnr: string, onIso: string): number | null {
  const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(onIso);
  if (!dm) return null;
  const [y, mo, d] = [Number(dm[1]), Number(dm[2]), Number(dm[3])];
  const on = new Date(y, mo - 1, d);
  if (on.getFullYear() !== y || on.getMonth() !== mo - 1 || on.getDate() !== d) return null;
  const n = normalizePersonnummer(pnr, on);
  if (!n) return null;
  const by = Number(n.slice(0, 4));
  const bm = Number(n.slice(4, 6));
  const bd = realDay(n.slice(6, 8));
  let age = y - by;
  if (mo < bm || (mo === bm && d < bd)) age--;
  return age;
}
