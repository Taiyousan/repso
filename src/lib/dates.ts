// Hand-rolled French formatting: Intl is slow on Hermes and its output varies between engines.

const WEEKDAYS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
const MONTHS = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];
const SHORT_MONTHS = [
  'janv.',
  'févr.',
  'mars',
  'avr.',
  'mai',
  'juin',
  'juil.',
  'août',
  'sept.',
  'oct.',
  'nov.',
  'déc.',
];

/** "lun. 12 oct.", with the year when it isn't the current one. */
export function formatDay(date: Date, now = new Date()): string {
  const year = date.getFullYear() === now.getFullYear() ? '' : ` ${date.getFullYear()}`;
  return `${WEEKDAYS[date.getDay()]} ${date.getDate()} ${SHORT_MONTHS[date.getMonth()]}${year}`;
}

/** "18:05" */
export function formatTime(date: Date): string {
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/** "Octobre 2026" */
export function formatMonth(date: Date): string {
  const month = MONTHS[date.getMonth()];
  return `${month[0].toUpperCase()}${month.slice(1)} ${date.getFullYear()}`;
}

/** Same calendar month, e.g. to group a history list. */
export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

/** 3_100_000 -> "52 min", 4_500_000 -> "1 h 15" */
export function formatDurationLong(ms: number): string {
  const totalMinutes = Math.max(0, Math.round(ms / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  return `${hours} h ${String(minutes).padStart(2, '0')}`;
}

/** "12 oct.", with the year when it isn't the current one. */
export function formatShortDay(date: Date, now = new Date()): string {
  const year = date.getFullYear() === now.getFullYear() ? '' : ` ${date.getFullYear()}`;
  return `${date.getDate()} ${SHORT_MONTHS[date.getMonth()]}${year}`;
}

/** "oct." */
export function formatShortMonth(date: Date): string {
  return SHORT_MONTHS[date.getMonth()];
}
