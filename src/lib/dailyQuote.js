// ============================================================
// DAILY QUOTE PICKER
// Picks one quote from src/data/quotes.js for today.
// Everyone sees the same quote on the same day.
// It changes at midnight India time (IST).
// ============================================================

import { QUOTES } from '@/data/quotes';

export function getTodaysQuote(now = new Date()) {
  // Today's date in India, e.g. "2026-10-22"
  const indiaDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);

  const [year, month, day] = indiaDate.split('-').map(Number);

  // Day number in the year: 1 January = 1, 31 December = 365 (or 366)
  const dayOfYear = (Date.UTC(year, month - 1, day) - Date.UTC(year, 0, 1)) / 86400000 + 1;

  // Quote 1 on day 1, quote 2 on day 2 … (day 366 in a leap year wraps to quote 1)
  return QUOTES[(dayOfYear - 1) % QUOTES.length];
}
