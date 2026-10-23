'use client';

// ============================================================
// ONE TASK IN THE LIST
//   ○ circle  → tick done / not done (with a small ✨)
//   name      → tap to open the edit panel
//   🔴 🔮 5:30 PM   ·  "Postponed 2× · 1d 3h late"
// ============================================================

import { useState } from 'react';
import { formatDayLabel, formatDuration, formatTime } from '@/lib/dates';
import { usePreferences } from '../Preferences';
import { CheckIcon } from '../Icons';

export default function TaskItem({ task, now, showDay, onToggle, onOpen }) {
  const { t, lang } = usePreferences();
  const [sparkle, setSparkle] = useState(false);

  const due = new Date(task.due_at);
  const isLate = !task.done && due < now;

  function handleToggle() {
    if (!task.done) {
      setSparkle(true);
      setTimeout(() => setSparkle(false), 700);
    }
    onToggle(task);
  }

  return (
    <li className={`task-item prio-${task.priority}${task.done ? ' done' : ''}`}>
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
        <span className="task-title">{task.title}</span>
        <span className="task-meta">
          <span className={`prio-dot ${task.priority}`} aria-hidden="true" />
          <span aria-hidden="true">{task.ball === 'glass' ? '🔮' : '🏀'}</span>
          <span className={isLate ? 'task-time late' : 'task-time'}>
            {showDay && `${formatDayLabel(due, lang, t)} · `}
            {formatTime(due, lang)}
          </span>
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
