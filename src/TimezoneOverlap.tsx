import { useEffect, useMemo, useState } from 'react';
import { joinAcrossMidnight, mod, offsetMinutes, overlap, shift, type Segment } from './overlap';
import { MESSAGES, type Lang } from './messages';
import { WorldMap } from './WorldMap';
import { cityName, listZones } from './zones';

export type TimezoneOverlapProps = {
  homeZone: string;
  homeLabel?: string;
  visitorZone: string;
  /** Working hours, in each zone's local time. */
  workStart: number;
  workEnd: number;
  lang: Lang;
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

// 24-hour, like the timeline and the summary
const clock = (date: Date, timeZone: string, lang: Lang) =>
  new Intl.DateTimeFormat(lang, { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date);

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

export function TimezoneOverlap({
  homeZone,
  homeLabel,
  visitorZone: initialVisitorZone,
  workStart,
  workEnd,
  lang,
  onVisitorZoneChange,
}: TimezoneOverlapProps) {
  const t = MESSAGES[lang];
  const now = useNow();
  const [visitorZone, setVisitorZone] = useState(initialVisitorZone);
  const zones = useMemo(() => listZones([homeZone, visitorZone]), [homeZone, visitorZone]);

  const result = useMemo(
    () => overlap(homeZone, visitorZone, { workStart, workEnd, date: now }),
    [homeZone, visitorZone, workStart, workEnd, now],
  );

  // the map is drawn in the home zone's day: home hours stay put, the visitor's move with their zone
  const axis = offsetMinutes(homeZone, now);
  const nowMinute = mod(now.getUTCHours() * 60 + now.getUTCMinutes() + axis);
  const home = homeLabel || cityName(homeZone);
  const both = shift(result.both, axis);
  // the summary speaks in the visitor's own time
  const visitorBoth = shift(result.both, offsetMinutes(visitorZone, now));

  function choose(zone: string) {
    setVisitorZone(zone);
    onVisitorZoneChange?.(zone);
  }

  return (
    <div className="widget">
      <div className="chart">
        <WorldMap
          homeZone={homeZone}
          visitorZone={visitorZone}
          now={now}
          home={shift(result.home, axis)}
          visitor={shift(result.visitor, axis)}
          both={both}
          nowMinute={nowMinute}
          label={duration(result.minutes)}
        />
        {/* the map's width is the home zone's day */}
        <div className="ticks" aria-hidden="true">
          {[0, 6, 12, 18, 24].map((h) => (
            <span key={h} style={{ left: `${(h / 24) * 100}%` }}>
              {hhmm(h * 60).slice(0, 2)}
            </span>
          ))}
        </div>
        <p className="axis-name" aria-hidden="true">{t.axis(home)}</p>
      </div>

      <div className="clocks">
        <p className="clock">
          <span className="swatch home" aria-hidden="true" />
          {home} <time>{clock(now, homeZone, lang)}</time>
        </p>
        <label className="clock">
          <span className="swatch visitor" aria-hidden="true" />
          <select aria-label={t.zoneLabel} value={visitorZone} onChange={(event) => choose(event.target.value)}>
            {zones.map((zone) => (
              <option key={zone} value={zone}>
                {zone.replaceAll('_', ' ')}
              </option>
            ))}
          </select>
          <time>{clock(now, visitorZone, lang)}</time>
        </label>
      </div>

      <p className="summary" role="status">
        {result.minutes > 0
          ? t.overlap(duration(result.minutes), home, ranges(visitorBoth))
          : t.none(home)}
      </p>
    </div>
  );
}
