'use client';

// ============================================================
// ONE TASK IN A LIST
//   ○ circle  → tick done / not done (with a small ✨)
//   name      → tap to open the edit panel
//   🔴 🔮 5:30 PM · all day · 📁 Home · 2/3 steps · "Part of Vacation"
//   "Postponed 2× · 1d 3h late"
// ============================================================

import { useState } from 'react';
import { DURATIONS, formatDayLabel, formatDuration, formatShortDate, formatTime } from '@/lib/dates';
import { usePreferences } from '../Preferences';
import { CheckIcon } from '../Icons';

export default function TaskItem({ task, now, showDay, listsById, onToggle, onOpen }) {
  const { t, lang } = usePreferences();
  const [sparkle, setSparkle] = useState(false);

  const due = new Date(task.due_at);
  const isLate = !task.done && due < now;
  const list = task.list_id && listsById?.[task.list_id];
  const steps = task.steps || [];
  const stepsDone = steps.filter((s) => s.done).length;

  function handleToggle() {
    if (!task.done) {
      setSparkle(true);
      setTimeout(() => setSparkle(false), 700);
    }
    onToggle(task);
  }

  // "1 hr", "all day" or "1 Jan – 5 Jan"
  let span = null;
  const preset = DURATIONS.find((d) => d.key === task.duration && d.minutes);
  if (preset) span = t(preset.label);
  if (task.duration === 'all_day') span = t('allDay');
  if (task.duration === 'days' && task.end_at) span = `${formatShortDate(due, lang)} – ${formatShortDate(task.end_at, lang)}`;

  return (
    <li className={`task-item prio-${task.priority}${task.done ? ' done' : ''}${task.parent_id ? ' is-step' : ''}`}>
      <button
        type="button"
        className={`task-check${sparkle ? ' sparkle' : ''}`}
        aria-label={task.done ? t('markNotDone') : t('markDone')}
        aria-pressed={task.done}
        onClick={handleToggle}
      >
        {task.done && <CheckIcon />}
      </button>

      <button type="button" className="task-body" onClick={() => onOpen(task)}>
        {task.parentTitle && <span className="part-of">↳ {t('partOf', { title: task.parentTitle })}</span>}
        <span className="task-title">{task.title}</span>
        <span className="task-meta">
          <span className={`prio-dot ${task.priority}`} aria-hidden="true" />
          <span aria-hidden="true">{task.ball === 'glass' ? '🔮' : '🏀'}</span>
          <span className={isLate ? 'task-time late' : 'task-time'}>
            {showDay && `${formatDayLabel(due, lang, t)} · `}
            {formatTime(due, lang)}
          </span>
          {span && <span className="meta-tag">{span}</span>}
          {task.routine_id && !task.habit && <span className="meta-tag">🔁</span>}
          {list && (
            <span className="meta-tag">
              {list.emoji} {list.name}
            </span>
          )}
          {steps.length > 0 && (
            <span className={`meta-tag steps-tag${stepsDone === steps.length ? ' complete' : ''}`}>
              {t('stepsProgress', { done: stepsDone, total: steps.length })}
            </span>
          )}
          {task.postpone_count > 0 && (
            <span className="postpone-badge">
              {t('postponedInfo', {
                count: task.postpone_count,
                time: formatDuration(task.postponed_minutes, t),
              })}
            </span>
          )}
        </span>
      </button>
    </li>
  );
}
