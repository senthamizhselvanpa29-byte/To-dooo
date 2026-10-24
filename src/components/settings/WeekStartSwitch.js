'use client';

// ============================================================
// "Week starts on: [Monday | Sunday]" — each user chooses.
// Used on the Settings page and at the top of the weekly report.
// Saves straight away.
// ============================================================

import { useState } from 'react';
import { localeFor } from '@/lib/dates';
import { taskErrorKey } from '@/lib/tasks';
import { usePreferences } from '../Preferences';

// 1 Jan 2024 was a Monday, 31 Dec 2023 a Sunday (only used for the names)
const SAMPLE_DAYS = { 1: new Date(2024, 0, 1), 0: new Date(2023, 11, 31) };

export default function WeekStartSwitch({ settings, onSave, onError, compact = false }) {
  const { t, lang } = usePreferences();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const current = settings.week_start ?? 1;

  async function choose(value) {
    if (value === current || busy) return;
    setBusy(true);
    setSaved(false);
    onError?.(null);
    try {
      await onSave({ week_start: value });
      setSaved(true);
    } catch (error) {
      onError?.(taskErrorKey(error));
    }
    setBusy(false);
  }

  const name = (value) =>
    SAMPLE_DAYS[value].toLocaleDateString(localeFor(lang), { weekday: compact ? 'short' : 'long' });

  return (
    <div className="week-start">
      <span className="field-group-label">{t('weekStartsOn')}</span>
      <div className="segmented" role="radiogroup" aria-label={t('weekStartsOn')}>
        {[1, 0].map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={current === value}
            onClick={() => choose(value)}
            disabled={busy}
          >
            {name(value)}
          </button>
        ))}
      </div>
      {saved && !compact && <span className="saved-note">{t('settingsSaved')}</span>}
    </div>
  );
}
