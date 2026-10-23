'use client';

// ============================================================
// GREETING — "Good morning, Senthamizh", today's date,
// the progress circle ("2 of 5 done") and today's quote.
// Morning / afternoon / evening follow the user's wake-up time,
// so night-shift workers get "Good morning" when they wake up.
// ============================================================

import { formatLongDate } from '@/lib/dates';
import { usePreferences } from '../Preferences';

export default function Greeting({ name, now, done, total, quote, awakeMinutes }) {
  const { t, lang } = usePreferences();

  // Up to 6 hours after waking → morning, up to 11 hours → afternoon
  const greetingKey = awakeMinutes < 360 ? 'goodMorning' : awakeMinutes < 660 ? 'goodAfternoon' : 'goodEvening';

  // Progress circle maths
  const ratio = total === 0 ? 0 : done / total;
  const radius = 26;
  const circumference = 2 * Math.PI * radius;

  return (
    <section className="greeting">
      <span className="greeting-stars" aria-hidden="true">✦ ✧ ·</span>
      <div className="greeting-text">
        <h1>{t(greetingKey, { name })}</h1>
        <p className="greeting-date">{formatLongDate(now, lang)}</p>
        {quote && (
          <p className="greeting-quote" lang={lang}>
            “{quote[lang] || quote.en}” <span>— {quote.author[lang] || quote.author.en}</span>
          </p>
        )}
      </div>

      <div className="progress-ring">
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <circle className="ring-bg" cx="32" cy="32" r={radius} />
          <circle
            className="ring-fill"
            cx="32"
            cy="32"
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - ratio)}
          />
        </svg>
        <span className="ring-text" aria-hidden="true">
          {done}/{total}
        </span>
        <span className="ring-label">{t('progressLabel', { done, total })}</span>
      </div>
    </section>
  );
}
