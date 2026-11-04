// Time math for working-hours overlap. Everything works in minutes of a day (0–1440),
// and offsets come from Intl for a given date, so daylight saving time is always right.

export const DAY = 24 * 60;

/** A half-open range of minutes within one day: [start, end). */
export type Segment = { start: number; end: number };

export type Overlap = {
  /** Working hours of each zone and their intersection, in UTC minutes. */
  home: Segment[];
  visitor: Segment[];
  both: Segment[];
  /** Length of the overlap in minutes. */
  minutes: number;
};

export function mod(n: number, m = DAY): number {
  return ((n % m) + m) % m;
}

export function isValidZone(zone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

/** Minutes ahead of UTC for `timeZone` at `date` (Buenos Aires → -180). */
export function offsetMinutes(timeZone: string, date: Date): number {
  const name = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' })
    .formatToParts(date)
    .find((part) => part.type === 'timeZoneName')?.value;
  const match = name && /^GMT([+-])(\d{2}):(\d{2})$/.exec(name);
  if (!match) return 0; // plain "GMT" is UTC
  const sign = match[1] === '-' ? -1 : 1;
  return sign * (Number(match[2]) * 60 + Number(match[3]));
}

/** A range that may cross midnight, split into segments that don't, in order. */
export function toSegments(start: number, length: number): Segment[] {
  if (length <= 0) return [];
  if (length >= DAY) return [{ start: 0, end: DAY }];
  const s = mod(start);
  const e = s + length;
  return e <= DAY ? [{ start: s, end: e }] : [{ start: 0, end: e - DAY }, { start: s, end: DAY }];
}

/**
 * Moves segments by `minutes` (e.g. UTC → a zone's local time), re-splitting at midnight
 * and joining pieces that now touch: a range split at UTC midnight is whole again locally.
 */
export function shift(segments: Segment[], minutes: number): Segment[] {
  return merge(segments.flatMap((seg) => toSegments(seg.start + minutes, seg.end - seg.start)));
}

export function intersect(a: Segment[], b: Segment[]): Segment[] {
  const out: Segment[] = [];
  for (const x of a) {
    for (const y of b) {
      const start = Math.max(x.start, y.start);
      const end = Math.min(x.end, y.end);
      if (start < end) out.push({ start, end });
    }
  }
  return sortSegments(out);
}

export function totalMinutes(segments: Segment[]): number {
  return segments.reduce((sum, seg) => sum + seg.end - seg.start, 0);
}

/**
 * Ranges for display: a segment ending at midnight joins one starting at midnight,
 * so 22:00–24:00 + 00:00–02:00 reads as 22:00–02:00 (`end` is then past DAY).
 */
export function joinAcrossMidnight(segments: Segment[]): Segment[] {
  const sorted = sortSegments(segments);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  if (sorted.length > 1 && first && last && first.start === 0 && last.end === DAY) {
    return [...sorted.slice(1, -1), { start: last.start, end: DAY + first.end }];
  }
  return sorted;
}

/** Working hours from `startHour` to `endHour` local time (a night shift may wrap), in UTC. */
export function workSegmentsUtc(zone: string, startHour: number, endHour: number, date: Date): Segment[] {
  const length = mod((endHour - startHour) * 60);
  return toSegments(startHour * 60 - offsetMinutes(zone, date), length);
}

export function overlap(
  homeZone: string,
  visitorZone: string,
  { workStart, workEnd, date }: { workStart: number; workEnd: number; date: Date },
): Overlap {
  const home = workSegmentsUtc(homeZone, workStart, workEnd, date);
  const visitor = workSegmentsUtc(visitorZone, workStart, workEnd, date);
  const both = intersect(home, visitor);
  return { home, visitor, both, minutes: totalMinutes(both) };
}

/** Sorted, with touching or overlapping segments joined. */
export function merge(segments: Segment[]): Segment[] {
  const out: Segment[] = [];
  for (const seg of sortSegments(segments)) {
    const last = out[out.length - 1];
    if (last && seg.start <= last.end) last.end = Math.max(last.end, seg.end);
    else out.push({ ...seg });
  }
  return out;
}

function sortSegments(segments: Segment[]): Segment[] {
  return [...segments].sort((a, b) => a.start - b.start);
}
