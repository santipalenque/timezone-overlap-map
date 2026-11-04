import { describe, expect, it } from 'vitest';
import { subsolarPoint, terminatorLat } from './sun';

describe('subsolarPoint', () => {
  it('follows the seasons', () => {
    expect(subsolarPoint(new Date('2026-06-21T12:00:00Z')).lat).toBeCloseTo(23.44, 0);
    expect(subsolarPoint(new Date('2026-12-21T12:00:00Z')).lat).toBeCloseTo(-23.44, 0);
    expect(Math.abs(subsolarPoint(new Date('2026-03-20T15:00:00Z')).lat)).toBeLessThan(0.5);
  });

  it('is near Greenwich at noon UTC and near the antimeridian at midnight', () => {
    // the equation of time moves solar noon by up to ~16 minutes: ±4°
    expect(Math.abs(subsolarPoint(new Date('2026-06-21T12:00:00Z')).lon)).toBeLessThan(4);
    expect(Math.abs(subsolarPoint(new Date('2026-06-21T00:00:00Z')).lon)).toBeGreaterThan(176);
  });

  it('moves west 15° per hour', () => {
    const a = subsolarPoint(new Date('2026-11-04T12:00:00Z')).lon;
    const b = subsolarPoint(new Date('2026-11-04T13:00:00Z')).lon;
    expect(a - b).toBeCloseTo(15, 0);
  });
});

describe('terminatorLat', () => {
  it('reaches the polar circle opposite the sun at a solstice', () => {
    const sun = { lat: 23.44, lon: 0 };
    expect(terminatorLat(180, sun)).toBeCloseTo(66.56, 1);
    expect(terminatorLat(0, sun)).toBeCloseTo(-66.56, 1);
    expect(terminatorLat(90, sun)).toBeCloseTo(0, 5);
  });
});
