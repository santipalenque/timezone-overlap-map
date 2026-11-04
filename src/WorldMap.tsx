import { useMemo } from 'react';
import { LAND_PATH, MAP_HEIGHT, MAP_NORTH, MAP_WIDTH, ZONE_COORDS } from './geo';
import { offsetMinutes } from './overlap';
import { nightPath, subsolarPoint } from './sun';

type Side = 'home' | 'visitor';

/** The 15°-wide strip of a UTC offset; offsets past ±12 h also appear on the other edge. */
function Band({ zone, date, side }: { zone: string; date: Date; side: Side }) {
  const x = (offsetMinutes(zone, date) / 60) * 15 + 180 - 7.5;
  return (
    <g className={`band ${side}`}>
      {[x - MAP_WIDTH, x, x + MAP_WIDTH].map((bx) => (
        <rect key={bx} x={bx} y={0} width={15} height={MAP_HEIGHT} />
      ))}
    </g>
  );
}

function Dot({ zone, side }: { zone: string; side: Side }) {
  const coords = ZONE_COORDS[zone];
  if (!coords) return null; // UTC and other non-geographic zones
  const [lat, lon] = coords;
  return <circle className={`dot ${side}`} cx={lon + 180} cy={MAP_NORTH - lat} r={2.5} />;
}

export function WorldMap({ homeZone, visitorZone, now }: { homeZone: string; visitorZone: string; now: Date }) {
  const night = useMemo(() => nightPath(now), [now]);
  const sun = subsolarPoint(now);

  return (
    <svg className="map" viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} aria-hidden="true">
      <path className="land" d={LAND_PATH} />
      <Band zone={homeZone} date={now} side="home" />
      <Band zone={visitorZone} date={now} side="visitor" />
      <path className="night" d={night} />
      <g transform={`translate(${sun.lon + 180} ${MAP_NORTH - sun.lat})`}>
        <circle className="sun-halo" r={7} />
        <circle className="sun" r={2.5} />
      </g>
      <Dot zone={homeZone} side="home" />
      <Dot zone={visitorZone} side="visitor" />
    </svg>
  );
}
