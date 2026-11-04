export type Messages = {
  /** Accessible name of the zone picker. */
  zoneLabel: string;
  /** `duration` is already formatted ("2 h 30 min"), `ranges` is in the visitor's local time. */
  overlap: (duration: string, home: string, ranges: string) => string;
  none: (home: string) => string;
};

const en: Messages = {
  zoneLabel: 'Your time zone',
  overlap: (duration, home, ranges) => `${duration} of overlap with ${home}: ${ranges} your time.`,
  none: (home) => `No working-hours overlap with ${home}.`,
};

const es: Messages = {
  zoneLabel: 'Tu zona horaria',
  overlap: (duration, home, ranges) => `${duration} en común con ${home}: ${ranges} en tu horario.`,
  none: (home) => `No hay horario laboral en común con ${home}.`,
};

export const MESSAGES = { en, es } satisfies Record<string, Messages>;

export type Lang = keyof typeof MESSAGES;

/** "es-AR" → "es"; anything without a translation → "en". */
export function resolveLang(tag: string | null | undefined): Lang {
  const base = (tag ?? '').toLowerCase().split('-')[0] ?? '';
  return base in MESSAGES ? (base as Lang) : 'en';
}
