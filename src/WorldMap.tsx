import { useMemo } from 'react';
import { LAND_PATH, MAP_HEIGHT, MAP_NORTH, MAP_WIDTH, ZONE_COORDS } from './geo';
import { DAY, type Segment } from './overlap';
import { nightPath, subsolarPoint } from './sun';

type Side = 'home' | 'visitor';

/** The home zone's day across the map's width: minute 0 at the left edge, 24:00 at the right. */
const x = (minute: number) => (minute / DAY) * MAP_WIDTH;

function Dot({ zone, side }: { zone: string; side: Side }) {
  const coords = ZONE_COORDS[zone];
  if (!coords) return null; // UTC and other non-geographic zones
  const [lat, lon] = coords;
  return <circle className={`dot ${side}`} cx={lon + 180} cy={MAP_NORTH - lat} r={2.5} />;
}

function Window({ segments, className }: { segments: Segment[]; className: string }) {
  return (
    <g className={`window ${className}`}>
      {segments.map((seg) => (
        <rect key={seg.start} x={x(seg.start)} y={0} width={x(seg.end - seg.start)} height={MAP_HEIGHT} />
      ))}
    </g>
  );
}

export type WorldMapProps = {
  homeZone: string;
  visitorZone: string;
  now: Date;
  /** Working hours in the home zone's day (minutes), already split at midnight. */
  home: Segment[];
  visitor: Segment[];
  both: Segment[];
  nowMinute: number;
  /** Written on the overlap, e.g. "4 h". */
  label: string;
};

export function WorldMap({ homeZone, visitorZone, now, home, visitor, both, nowMinute, label }: WorldMapProps) {
  const night = useMemo(() => nightPath(now), [now]);
  const sun = subsolarPoint(now);
  // an overlap across midnight is drawn in two pieces: the label goes on the wider one
  const widest = both.reduce<Segment | undefined>(
    (best, seg) => (!best || seg.end - seg.start > best.end - best.start ? seg : best),
    undefined,
  );

  return (
    <svg className="map" viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} aria-hidden="true">
      <path className="land" d={LAND_PATH} />
      <path className="night" d={night} />
      <Window segments={home} className="home" />
      <Window segments={visitor} className="visitor" />
      <Window segments={both} className="both" />
      <g transform={`translate(${sun.lon + 180} ${MAP_NORTH - sun.lat})`}>
        <circle className="sun-halo" r={7} />
        <circle className="sun" r={2.5} />
      </g>
      <Dot zone={homeZone} side="home" />
      <Dot zone={visitorZone} side="visitor" />
      <line className="now" x1={x(nowMinute)} x2={x(nowMinute)} y1={0} y2={MAP_HEIGHT} />
      {widest && (
        <text className="label" x={x((widest.start + widest.end) / 2)} y={MAP_HEIGHT / 2}>
          {label}
        </text>
      )}
    </svg>
  );
}
