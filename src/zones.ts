/** "America/Argentina/Buenos_Aires" → "Buenos Aires". */
export function cityName(zone: string): string {
  return (zone.split('/').pop() ?? zone).replaceAll('_', ' ');
}

export function detectZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/** Every zone the runtime knows, plus `extra` (a detected alias like America/Buenos_Aires may be missing). */
export function listZones(extra: string[] = []): string[] {
  const known = Intl.supportedValuesOf('timeZone');
  return [...new Set([...known, ...extra])].sort();
}
