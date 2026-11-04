// Where the sun is overhead, and the night side of the map. Low-precision solar formulas
// (Astronomical Almanac), good to a fraction of a degree: far below a pixel on this map.

import { MAP_NORTH, MAP_WIDTH } from './geo';

const RAD = Math.PI / 180;
const J2000 = Date.UTC(2000, 0, 1, 12);

const wrap = (deg: number) => ((((deg + 180) % 360) + 360) % 360) - 180;

/** Latitude and longitude, in degrees, of the point with the sun at its zenith. */
export function subsolarPoint(date: Date): { lat: number; lon: number } {
  const d = (date.getTime() - J2000) / 86_400_000;
  const g = (357.529 + 0.98560028 * d) * RAD; // mean anomaly
  const q = 280.459 + 0.98564736 * d; // mean longitude
  const L = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * RAD; // ecliptic longitude
  const e = (23.439 - 0.00000036 * d) * RAD; // obliquity of the ecliptic

  const rightAscension = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)) / RAD;
  const declination = Math.asin(Math.sin(e) * Math.sin(L)) / RAD;
  const gmstHours = (((18.697374558 + 24.06570982441908 * d) % 24) + 24) % 24;

  return { lat: declination, lon: wrap(rightAscension - gmstHours * 15) };
}

/** Latitude of the day/night line at `lon`, for the sun over `sun`. */
export function terminatorLat(lon: number, sun: { lat: number; lon: number }): number {
  // at an equinox the line is a meridian pair; a tiny tilt keeps the formula finite
  const decl = Math.abs(sun.lat) < 0.01 ? 0.01 : sun.lat;
  return Math.atan(-Math.cos((lon - sun.lon) * RAD) / Math.tan(decl * RAD)) / RAD;
}

/** The night side as an SVG path in map coordinates (x = lon + 180, y = MAP_NORTH - lat). */
export function nightPath(date: Date, step = 2): string {
  const sun = subsolarPoint(date);
  // with the sun north of the equator the south pole is in the dark, and the other way round
  const edge = sun.lat >= 0 ? MAP_NORTH + 90 : MAP_NORTH - 90;
  let d = `M0 ${edge}`;
  for (let lon = -180; lon <= 180; lon += step) {
    d += `L${lon + 180} ${(MAP_NORTH - terminatorLat(lon, sun)).toFixed(1)}`;
  }
  return `${d}L${MAP_WIDTH} ${edge}Z`;
}
