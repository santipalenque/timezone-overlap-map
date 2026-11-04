import { useEffect, useMemo, useState } from 'react';
import { DAY, joinAcrossMidnight, mod, offsetMinutes, overlap, shift, type Segment } from './overlap';
import { WorldMap } from './WorldMap';
import { cityName, listZones } from './zones';

export type TimezoneOverlapProps = {
  homeZone: string;
  homeLabel?: string;
  visitorZone: string;
  /** Working hours, in each zone's local time. */
  workStart: number;
  workEnd: number;
  onVisitorZoneChange?: (zone: string) => void;
};

function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

const clock = (date: Date, timeZone: string) =>
  new Intl.DateTimeFormat(undefined, { timeZone, hour: '2-digit', minute: '2-digit' }).format(date);

const hhmm = (minutes: number) => {
  const m = mod(minutes);
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

const duration = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
};

const ranges = (segments: Segment[]) =>
  joinAcrossMidnight(segments)
    .map((seg) => `${hhmm(seg.start)}–${hhmm(seg.end)}`)
    .join(', ');

function Bar({ segments, className }: { segments: Segment[]; className: string }) {
  return (
    <div className="track">
      {segments.map((seg) => (
        <span
          key={seg.start}
          className={className}
          style={{ left: `${(seg.start / DAY) * 100}%`, width: `${((seg.end - seg.start) / DAY) * 100}%` }}
        />
      ))}
    </div>
  );
}

export function TimezoneOverlap({
  homeZone,
  homeLabel,
  visitorZone: initialVisitorZone,
  workStart,
  workEnd,
  onVisitorZoneChange,
}: TimezoneOverlapProps) {
  const now = useNow();
  const [visitorZone, setVisitorZone] = useState(initialVisitorZone);
  const zones = useMemo(() => listZones([homeZone, visitorZone]), [homeZone, visitorZone]);

  const result = useMemo(
    () => overlap(homeZone, visitorZone, { workStart, workEnd, date: now }),
    [homeZone, visitorZone, workStart, workEnd, now],
  );

  // the timeline is drawn in the visitor's local day
  const local = offsetMinutes(visitorZone, now);
  const nowMinute = mod(now.getUTCHours() * 60 + now.getUTCMinutes() + local);
  const home = homeLabel || cityName(homeZone);

  function choose(zone: string) {
    setVisitorZone(zone);
    onVisitorZoneChange?.(zone);
  }

  return (
    <div className="widget">
      <WorldMap homeZone={homeZone} visitorZone={visitorZone} now={now} />

      <div className="clocks">
        <p className="clock">
          <span className="swatch home" aria-hidden="true" />
          {home} <time>{clock(now, homeZone)}</time>
        </p>
        <label className="clock">
          <span className="swatch visitor" aria-hidden="true" />
          <select value={visitorZone} onChange={(event) => choose(event.target.value)}>
            {zones.map((zone) => (
              <option key={zone} value={zone}>
                {zone.replaceAll('_', ' ')}
              </option>
            ))}
          </select>
          <time>{clock(now, visitorZone)}</time>
        </label>
      </div>

      <div className="timeline" aria-hidden="true">
        <Bar segments={shift(result.home, local)} className="home" />
        <Bar segments={shift(result.visitor, local)} className="visitor" />
        <Bar segments={shift(result.both, local)} className="both" />
        <span className="now" style={{ left: `${(nowMinute / DAY) * 100}%` }} />
        <div className="ticks">
          {[0, 6, 12, 18, 24].map((h) => (
            <span key={h} style={{ left: `${(h / 24) * 100}%` }}>
              {hhmm(h * 60).slice(0, 2)}
            </span>
          ))}
        </div>
      </div>

      <p className="summary" role="status">
        {result.minutes > 0
          ? `${duration(result.minutes)} of overlap with ${home}: ${ranges(shift(result.both, local))} your time.`
          : `No working-hours overlap with ${home}.`}
      </p>
    </div>
  );
}
