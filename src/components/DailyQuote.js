'use client';

// ============================================================
// DAILY QUOTE — shown next to the login box
// (above it on phones). Today's quote is picked by
// src/lib/dailyQuote.js; the quotes are in src/data/quotes.js
// ============================================================

import { usePreferences } from './Preferences';

export default function DailyQuote({ quote }) {
  const { t, lang } = usePreferences();

  const text = quote[lang] || quote.en;
  const author = quote.author[lang] || quote.author.en;

  // Avatar letters from the English name, e.g. "Jack Ma" → "JM"
  const initials = quote.author.en
    .split(/\s+/)
    .filter((word) => /^[A-Z]/.test(word))
    .slice(0, 2)
    .map((word) => word[0])
    .join('');

  return (
    <section className="quote-section" aria-label={t('quotePill')}>
      <div className="quote-pill">
        <span className="pill-dot" />
        <span>{t('quotePill')}</span>
      </div>

      <figure className="quote-card">
        <blockquote className="quote-text" lang={lang}>
          {text}
        </blockquote>
        <figcaption className="quote-author-row">
          <span className="author-avatar" aria-hidden="true">
            {initials || '✦'}
          </span>
          <span className="author-name">{author}</span>
        </figcaption>
      </figure>
    </section>
  );
}
