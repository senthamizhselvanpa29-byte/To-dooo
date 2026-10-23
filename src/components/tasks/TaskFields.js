'use client';

// ============================================================
// TASK DETAILS PICKERS — used when adding AND when editing a task
//   📅 Date:      Today / Tomorrow / any date
//   ⏰ Time:      Morning / Afternoon / Evening / Night, or exact hh:mm
//   ⏳ How long:  15 min … All day / Many days (optional, for the clash check)
//   🔴🟡🟢 Priority
//   🔮 Glass / 🏀 Rubber
//   📁 List      (only when `lists` is given)
//
// `value` = { date, time, duration, endDate, priority, ball, listId }
// `onChange(changes)` is called with only what changed.
// ============================================================

import { addDays, combineDateTime, computeEnd, DURATIONS, QUICK_TIMES, toDateInput, toTimeInput } from '@/lib/dates';
import { PRIORITIES } from '@/lib/tasks';
import { usePreferences } from '../Preferences';
import { CalendarIcon, ClockIcon } from '../Icons';

const PRIORITY_KEYS = { high: 'priorityHigh', medium: 'priorityMedium', low: 'priorityLow' };

export default function TaskFields({ idPrefix, value, onChange, timeMissing, endDateError, lists }) {
  const { t } = usePreferences();
  const todayText = toDateInput(new Date());
  const tomorrowText = toDateInput(addDays(new Date(), 1));

  return (
    <div className="task-fields">
      {/* ----- Date ----- */}
      <div className="field-group">
        <span className="field-group-label">
          <CalendarIcon className="mini-icon" /> {t('dateLabel')}
        </span>
        <div className="chip-row">
          <Chip active={value.date === todayText} onClick={() => onChange({ date: todayText })}>
            {t('today')}
          </Chip>
          <Chip active={value.date === tomorrowText} onClick={() => onChange({ date: tomorrowText })}>
            {t('tomorrow')}
          </Chip>
          <input
            type="date"
            className="chip-input"
            aria-label={t('dateLabel')}
            value={value.date}
            onChange={(e) => onChange({ date: e.target.value })}
          />
        </div>
      </div>

      {/* ----- Time (required, with minutes) ----- */}
      <div className="field-group">
        <span className="field-group-label">
          <ClockIcon className="mini-icon" /> {t('timeLabel')}
        </span>
        <div className="chip-row">
          {QUICK_TIMES.map(({ key, time }) => (
            <Chip key={key} active={value.time === time} onClick={() => onChange({ time })}>
              {t(key)}
            </Chip>
          ))}
          <input
            id={`${idPrefix}-time`}
            type="time"
            step="60"
            className={`chip-input${timeMissing ? ' missing' : ''}`}
            aria-label={t('timeLabel')}
            aria-invalid={timeMissing || undefined}
            value={value.time}
            onChange={(e) => onChange({ time: e.target.value })}
          />
        </div>
      </div>

      {/* ----- How long? (optional; tap again to clear) ----- */}
      <div className="field-group">
        <span className="field-group-label">{t('durationLabel')}</span>
        <div className="chip-row">
          {DURATIONS.map(({ key, label }) => (
            <Chip
              key={key}
              active={value.duration === key}
              onClick={() => onChange({ duration: value.duration === key ? null : key })}
            >
              {t(label)}
            </Chip>
          ))}
          {value.duration === 'days' && (
            <label className="end-date">
              {t('endDateLabel')}
              <input
                type="date"
                className={`chip-input${endDateError ? ' missing' : ''}`}
                min={value.date}
                value={value.endDate || ''}
                onChange={(e) => onChange({ endDate: e.target.value })}
              />
            </label>
          )}
        </div>
        {endDateError && <span className="field-error">{t('errEndBeforeStart')}</span>}
      </div>

      {/* ----- Priority colour ----- */}
      <div className="field-group">
        <span className="field-group-label">{t('priorityLabel')}</span>
        <div className="chip-row" role="radiogroup" aria-label={t('priorityLabel')}>
          {PRIORITIES.map((p) => (
            <Chip
              key={p}
              role="radio"
              active={value.priority === p}
              className={`prio-chip ${p}`}
              onClick={() => onChange({ priority: p })}
            >
              <span className={`prio-dot ${p}`} aria-hidden="true" /> {t(PRIORITY_KEYS[p])}
            </Chip>
          ))}
        </div>
      </div>

      {/* ----- Glass or rubber ball ----- */}
      <div className="field-group">
        <span className="field-group-label">{t('ballLabel')}</span>
        <div className="chip-row" role="radiogroup" aria-label={t('ballLabel')}>
          <Chip role="radio" active={value.ball === 'glass'} onClick={() => onChange({ ball: 'glass' })}>
            🔮 {t('ballGlass')} <small>· {t('ballGlassHint')}</small>
          </Chip>
          <Chip role="radio" active={value.ball === 'rubber'} onClick={() => onChange({ ball: 'rubber' })}>
            🏀 {t('ballRubber')} <small>· {t('ballRubberHint')}</small>
          </Chip>
        </div>
      </div>

      {/* ----- List (optional) ----- */}
      {lists && lists.length > 0 && (
        <div className="field-group">
          <span className="field-group-label">{t('listLabel')}</span>
          <div className="chip-row" role="radiogroup" aria-label={t('listLabel')}>
            <Chip role="radio" active={!value.listId} onClick={() => onChange({ listId: null })}>
              {t('noList')}
            </Chip>
            {lists.map((list) => (
              <Chip key={list.id} role="radio" active={value.listId === list.id} onClick={() => onChange({ listId: list.id })}>
                {list.emoji} {list.name}
              </Chip>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Picker values → what is saved in the database.
// Returns null when the date or time is missing, or the last day is wrong.
export function pickersToFields(value) {
  const due = combineDateTime(value.date, value.time);
  if (!due) return null;
  if (value.duration === 'days' && (!value.endDate || value.endDate < value.date)) return null;
  const end = computeEnd(due, value.duration, value.endDate);
  return {
    due_at: due.toISOString(),
    end_at: end ? end.toISOString() : null,
    duration: value.duration || null,
    priority: value.priority,
    ball: value.ball,
    list_id: value.listId || null,
  };
}

// A saved task → picker values (for the edit panel)
export function pickersFromTask(task) {
  return {
    date: toDateInput(task.due_at),
    time: toTimeInput(task.due_at),
    duration: task.duration || null,
    endDate: task.duration === 'days' && task.end_at ? toDateInput(task.end_at) : '',
    priority: task.priority,
    ball: task.ball,
    listId: task.list_id || null,
  };
}

// Empty picker values for a new task (date = today, NO time)
export function emptyPickers(overrides = {}) {
  return {
    date: toDateInput(new Date()),
    time: '',
    duration: null,
    endDate: '',
    priority: 'medium',
    ball: 'rubber',
    listId: null,
    ...overrides,
  };
}

// A small rounded button that can be "selected"
export function Chip({ active, className = '', role, children, onClick }) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={role === 'radio' ? active : undefined}
      aria-pressed={role ? undefined : active}
      className={`chip${active ? ' active' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
