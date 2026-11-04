import { describe, expect, it } from 'vitest';
import { DAY, joinAcrossMidnight, offsetMinutes, overlap, shift } from './overlap';

const BA = 'America/Argentina/Buenos_Aires';
const JANUARY = new Date('2026-01-15T12:00:00Z');
const JULY = new Date('2026-07-15T12:00:00Z');
const hours = { workStart: 9, workEnd: 18 };

describe('offsetMinutes', () => {
  it('reads offsets from Intl, including half hours and DST', () => {
    expect(offsetMinutes(BA, JANUARY)).toBe(-180);
    expect(offsetMinutes('Asia/Kolkata', JANUARY)).toBe(330);
    expect(offsetMinutes('America/New_York', JANUARY)).toBe(-300);
    expect(offsetMinutes('America/New_York', JULY)).toBe(-240);
    expect(offsetMinutes('UTC', JANUARY)).toBe(0);
  });
});

describe('overlap', () => {
  it('is the whole day for the same zone', () => {
    expect(overlap(BA, BA, { ...hours, date: JANUARY }).minutes).toBe(9 * 60);
  });

  it('follows daylight saving time on the other side', () => {
    // BA works 12:00–21:00 UTC; New York 14:00–23:00 UTC in winter, 13:00–22:00 in summer
    expect(overlap(BA, 'America/New_York', { ...hours, date: JANUARY }).both).toEqual([
      { start: 14 * 60, end: 21 * 60 },
    ]);
    expect(overlap(BA, 'America/New_York', { ...hours, date: JULY }).minutes).toBe(8 * 60);
  });

  it('works ahead of UTC', () => {
    // Madrid in winter: 08:00–17:00 UTC
    expect(overlap(BA, 'Europe/Madrid', { ...hours, date: JANUARY }).minutes).toBe(5 * 60);
  });

  it('finds no overlap when the days do not meet', () => {
    expect(overlap(BA, 'Asia/Tokyo', { ...hours, date: JANUARY }).both).toEqual([]);
  });

  it('handles working hours that cross midnight in UTC', () => {
    // Auckland in January (UTC+13): 20:00–05:00 UTC, so one hour with BA (20:00–21:00)
    const result = overlap(BA, 'Pacific/Auckland', { ...hours, date: JANUARY });
    expect(result.visitor).toEqual([
      { start: 0, end: 5 * 60 },
      { start: 20 * 60, end: DAY },
    ]);
    expect(result.both).toEqual([{ start: 20 * 60, end: 21 * 60 }]);
  });

  it('supports night shifts', () => {
    const result = overlap(BA, BA, { workStart: 22, workEnd: 6, date: JANUARY });
    expect(result.minutes).toBe(8 * 60);
  });
});

describe('display helpers', () => {
  it('shifts UTC segments into local time', () => {
    expect(shift([{ start: 12 * 60, end: 21 * 60 }], -180)).toEqual([{ start: 9 * 60, end: 18 * 60 }]);
  });

  it('joins ranges split at midnight', () => {
    expect(joinAcrossMidnight([{ start: 9 * 60, end: 10 * 60 }])).toEqual([{ start: 9 * 60, end: 10 * 60 }]);
    expect(
      joinAcrossMidnight([
        { start: 0, end: 120 },
        { start: 22 * 60, end: DAY },
      ]),
    ).toEqual([{ start: 22 * 60, end: DAY + 120 }]);
  });
});
