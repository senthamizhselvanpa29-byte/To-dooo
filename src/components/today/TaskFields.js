'use client';

// ============================================================
// TASK DETAILS PICKERS — used when adding AND when editing a task
//   📅 Date:      Today / Tomorrow / any date
//   ⏰ Time:      Morning / Afternoon / Evening / Night, or exact hh:mm
//   🔴🟡🟢 Priority
//   🔮 Glass / 🏀 Rubber
//
// `value` = { date: '2026-10-23', time: '17:30', priority, ball }
// `onChange(changes)` is called with only what changed.
// ============================================================

import { addDays, QUICK_TIMES, toDateInput } from '@/lib/dates';
import { PRIORITIES } from '@/lib/tasks';
import { usePreferences } from '../Preferences';
import { CalendarIcon, ClockIcon } from '../Icons';

const PRIORITY_KEYS = { high: 'priorityHigh', medium: 'priorityMedium', low: 'priorityLow' };

export default function TaskFields({ idPrefix, value, onChange, timeMissing }) {
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

      {/* ----- Priority colour ----- */}
      <div className="field-group">
        <span className="field-group-label">{t('priorityLabel')}</span>
        <div className="chip-row" role="radiogroup" aria-label={t('priorityLabel')}>
          {PRIORITIES.map((p) => (
            <Chip key={p} role="radio" active={value.priority === p} className={`prio-chip ${p}`} onClick={() => onChange({ priority: p })}>
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
    </div>
  );
}

// A small rounded button that can be "selected"
function Chip({ active, className = '', role, children, onClick }) {
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
