// ============================================================
// DATE & TIME HELPERS
// Everything here uses the time on the user's own phone/computer.
// ============================================================

// Language code → date/time format used for that language
const LOCALES = { en: 'en-IN', ta: 'ta-IN', ml: 'ml-IN', te: 'te-IN', hi: 'hi-IN' };
export const localeFor = (lang) => LOCALES[lang] || 'en-IN';

// Quick time buttons when adding a task (24-hour "HH:MM").
// Users can change the minutes before saving.
export const QUICK_TIMES = [
  { key: 'morning', time: '09:00' },
  { key: 'afternoon', time: '14:00' },
  { key: 'evening', time: '18:00' },
  { key: 'night', time: '21:00' },
];

// From this hour the "Plan tomorrow" box is highlighted.
export const EVENING_HOUR = 18;

// Midnight at the start of a day
export function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// Date → "2026-10-23" (for date boxes)
export function toDateInput(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Date → "17:30" (for time boxes)
export function toTimeInput(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// "2026-10-23" + "17:30" → exact moment (saved in the database)
export function combineDateTime(dateText, timeText) {
  if (!dateText || !timeText) return null;
  const d = new Date(`${dateText}T${timeText}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

// "5:30 pm" in the user's language
export function formatTime(date, lang) {
  return new Date(date).toLocaleTimeString(localeFor(lang), { hour: 'numeric', minute: '2-digit' });
}

// "Friday, 23 October" in the user's language
export function formatLongDate(date, lang) {
  return new Date(date).toLocaleDateString(localeFor(lang), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

// "Yesterday" / "Today" / "Tomorrow" / "Mon, 26 Oct"
export function formatDayLabel(date, lang, t) {
  const day = startOfDay(date).getTime();
  const today = startOfDay().getTime();
  if (day === today) return t('today');
  if (day === addDays(today, 1).getTime()) return t('tomorrow');
  if (day === addDays(today, -1).getTime()) return t('yesterday');
  return new Date(date).toLocaleDateString(localeFor(lang), { weekday: 'short', day: 'numeric', month: 'short' });
}

// 3065 minutes → "2d 3h" (short units in the user's language)
export function formatDuration(minutes, t) {
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  const parts = [];
  if (days) parts.push(`${days}${t('unitDay')}`);
  if (hours) parts.push(`${hours}${t('unitHour')}`);
  if (!days && mins) parts.push(`${mins}${t('unitMinute')}`);
  return parts.join(' ') || `0${t('unitMinute')}`;
}

// ----- "How long?" (used by the clash check) -----
// Keys are saved in the database; words are in src/locales (dur15, dur30…)
export const DURATIONS = [
  { key: '15m', label: 'dur15', minutes: 15 },
  { key: '30m', label: 'dur30', minutes: 30 },
  { key: '1h', label: 'dur1h', minutes: 60 },
  { key: '2h', label: 'dur2h', minutes: 120 },
  { key: 'all_day', label: 'durAllDay' },
  { key: 'days', label: 'durDays' },
];

// Last second of a day (23:59:59)
export function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 0);
  return d;
}

// When does a task end? Returns null when no "how long" was chosen.
// endDateText is only used for "Many days" (e.g. vacation until 5 Jan).
export function computeEnd(dueAt, duration, endDateText) {
  if (!dueAt || !duration) return null;
  const preset = DURATIONS.find((d) => d.key === duration);
  if (preset?.minutes) return new Date(dueAt.getTime() + preset.minutes * 60000);
  if (duration === 'all_day') return endOfDay(dueAt);
  if (duration === 'days') {
    if (!endDateText) return null;
    return endOfDay(new Date(`${endDateText}T00:00`));
  }
  return null;
}

// "1 Jan" in the user's language
export function formatShortDate(date, lang) {
  return new Date(date).toLocaleDateString(localeFor(lang), { day: 'numeric', month: 'short' });
}

// "Thu, 1 Jan 2026, 10:00 am"
export function formatDateTime(date, lang) {
  return new Date(date).toLocaleString(localeFor(lang), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// Month name + year, e.g. "October 2026"
export function formatMonth(date, lang) {
  return new Date(date).toLocaleDateString(localeFor(lang), { month: 'long', year: 'numeric' });
}
