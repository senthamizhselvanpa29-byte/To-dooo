'use client';

// ============================================================
// CLASH WINDOW — shows when a new or changed task overlaps another.
//
//   ⚠️ Clash on Thu, 1 Jan
//   🔴 🔮 Friend's marriage   10:00 am · all day
//   🟡 🏀 Vacation (New)      1 Jan – 5 Jan
//   "Vacation" is less important.
//   Move "Vacation" to: [Fri 2 Jan] [Sat 3 Jan] …
//   [Keep both]  [Change the time]
//
// The rules (which one moves, free days) are in src/lib/clash.js
// ============================================================

import { useEffect } from 'react';
import { formatDayLabel, formatShortDate, formatTime } from '@/lib/dates';
import { usePreferences } from '../Preferences';

export default function ClashDialog({ clash, onDecide }) {
  const { t, lang } = usePreferences();
  const { draft, others, lower, suggestions } = clash;

  // Escape = "Change the time"
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onDecide({ action: 'cancel' });
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onDecide]);

  const describe = (task) => {
    if (task.duration === 'days' && task.end_at) {
      return `${formatShortDate(task.due_at, lang)} – ${formatShortDate(task.end_at, lang)}`;
    }
    const time = `${formatDayLabel(task.due_at, lang, t)} · ${formatTime(task.due_at, lang)}`;
    return task.duration === 'all_day' ? `${time} · ${t('allDay')}` : time;
  };

  const rows = [draft, ...others];

  return (
    <div className="panel-overlay center">
      <div className="clash-dialog" role="alertdialog" aria-modal="true" aria-labelledby="clash-title">
        <h2 id="clash-title">⚠️ {t('clashTitle', { date: formatDayLabel(draft.due_at, lang, t) })}</h2>
        <p className="clash-explain">{t('clashExplain')}</p>

        <ul className="clash-list">
          {rows.map((task) => (
            <li key={task.id} className={task === lower ? 'lower' : ''}>
              <span className={`prio-dot ${task.priority}`} aria-hidden="true" />
              <span aria-hidden="true">{task.ball === 'glass' ? '🔮' : '🏀'}</span>
              <span className="clash-name">
                {task.title}
                {task === draft && <em> ({t('newTaskLabel')})</em>}
              </span>
              <span className="clash-when">{describe(task)}</span>
            </li>
          ))}
        </ul>

        <p className="clash-less">{t('clashLess', { title: lower.title })}</p>

        <p className="field-group-label">{t('moveTo', { title: lower.title })}</p>
        <div className="chip-row">
          {suggestions.length === 0 && <span className="steps-hint">{t('noFreeDays')}</span>}
          {suggestions.map((s) => (
            <button
              key={s.days}
              type="button"
              className="chip"
              onClick={() => onDecide({ action: 'move', taskId: lower.id, due_at: s.due_at, end_at: s.end_at })}
            >
              {formatDayLabel(s.due_at, lang, t)} · {formatTime(s.due_at, lang)}
            </button>
          ))}
        </div>

        <div className="edit-panel-actions">
          <button type="button" className="ghost-btn" onClick={() => onDecide({ action: 'cancel' })}>
            {t('changeTime')}
          </button>
          <span className="spacer" />
          <button type="button" className="save-btn" onClick={() => onDecide({ action: 'keep' })}>
            {t('keepBoth')}
          </button>
        </div>
      </div>
    </div>
  );
}
