'use client';

// ============================================================
// STEPS INSIDE A BIG PLAN (shown in the edit panel)
// Example: ✈️ Vacation → Book tickets, Book hotel, Pack bags
//
// Every step needs a date + time, and it can't be after the plan
// ends (for a "Many days" plan: up to its last day).
// ============================================================

import { useState } from 'react';
import { combineDateTime, formatDateTime, toDateInput } from '@/lib/dates';
import { usePreferences } from '../Preferences';
import { CheckIcon, PlusIcon } from '../Icons';

export default function StepsEditor({ plan, actions }) {
  const { t, lang } = usePreferences();
  const steps = plan.steps || [];
  const planEnd = new Date(plan.end_at || plan.due_at);

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => toDateInput(new Date() < planEnd ? new Date() : planEnd));
  const [time, setTime] = useState('');
  const [busy, setBusy] = useState(false);

  const due = combineDateTime(date, time);
  const tooLate = due && due > planEnd;
  const canAdd = title.trim() && due && !tooLate && !busy;

  async function handleAdd() {
    if (!canAdd) return;
    setBusy(true);
    const ok = await actions.addStep(plan, { title: title.trim(), due_at: due.toISOString() });
    setBusy(false);
    if (ok) {
      setTitle('');
      setTime('');
    }
  }

  const done = steps.filter((s) => s.done).length;

  return (
    <div className="field-group steps-editor">
      <span className="field-group-label">
        {t('stepsLabel')}
        {steps.length > 0 && ` · ${t('stepsProgress', { done, total: steps.length })}`}
      </span>
      {steps.length === 0 && <p className="steps-hint">{t('stepsHint')}</p>}

      {steps.length > 0 && (
        <>
          <div className="steps-bar" aria-hidden="true">
            <span style={{ width: `${(done / steps.length) * 100}%` }} />
          </div>
          <ul className="steps-list">
            {steps.map((step) => (
              <li key={step.id} className={step.done ? 'done' : ''}>
                <button
                  type="button"
                  className="step-check"
                  aria-label={step.done ? t('markNotDone') : t('markDone')}
                  aria-pressed={step.done}
                  onClick={() => actions.toggle(step)}
                >
                  {step.done && <CheckIcon />}
                </button>
                <button type="button" className="step-body" onClick={() => actions.open(step)}>
                  <span className="step-title">{step.title}</span>
                  <span className="step-time">{formatDateTime(step.due_at, lang)}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* ----- Add a step ----- */}
      <div className="step-add">
        <input
          className="step-add-title"
          placeholder={t('stepPlaceholder')}
          aria-label={t('stepPlaceholder')}
          maxLength={200}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <input
          type="date"
          className="chip-input"
          aria-label={t('dateLabel')}
          max={toDateInput(planEnd)}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <input
          type="time"
          step="60"
          className={`chip-input${title.trim() && !time ? ' missing' : ''}`}
          aria-label={t('timeLabel')}
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />
        <button type="button" className="save-btn small" onClick={handleAdd} disabled={!canAdd}>
          <PlusIcon /> {t('addStep')}
        </button>
      </div>
      {tooLate && (
        <p className="form-hint" role="status">
          {t('errStepAfterPlan', { date: formatDateTime(planEnd, lang) })}
        </p>
      )}
      {title.trim() && !time && !tooLate && (
        <p className="form-hint" role="status">
          {t('chooseTime')}
        </p>
      )}
    </div>
  );
}
