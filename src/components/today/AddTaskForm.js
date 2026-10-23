'use client';

// ============================================================
// ADD A TASK — the box at the top of the Today page.
// Type a name → choose the time (required) → Save.
// The task will NOT save without a date and a time.
// ============================================================

import { useImperativeHandle, useRef, useState } from 'react';
import { combineDateTime, toDateInput } from '@/lib/dates';
import { usePreferences } from '../Preferences';
import { PlusIcon } from '../Icons';
import TaskFields from './TaskFields';

const emptyDetails = () => ({ date: toDateInput(new Date()), time: '', priority: 'medium', ball: 'rubber' });

export default function AddTaskForm({ ref, onAdd }) {
  const { t } = usePreferences();
  const titleRef = useRef(null);
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState(emptyDetails);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [triedSave, setTriedSave] = useState(false);

  // Lets the "Plan tomorrow" box open this form with a date already chosen
  useImperativeHandle(ref, () => ({
    startFor(dateText) {
      setDetails((d) => ({ ...d, date: dateText }));
      setOpen(true);
      titleRef.current?.focus();
      titleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
  }));

  const dueAt = combineDateTime(details.date, details.time);
  const canSave = title.trim().length > 0 && dueAt !== null && !busy;

  // What is still missing (shown under the form)
  let hint = null;
  if (!title.trim()) hint = triedSave ? t('enterTitle') : null;
  else if (!details.time) hint = t('chooseTime');

  async function handleSubmit(e) {
    e.preventDefault();
    setTriedSave(true);
    if (!canSave) {
      if (title.trim() && !details.time) document.getElementById('add-time')?.focus();
      return;
    }
    setBusy(true);
    const ok = await onAdd({ title, dueAt, priority: details.priority, ball: details.ball });
    setBusy(false);
    if (ok) {
      // Keep the chosen date (handy when adding several tasks for one day)
      setTitle('');
      setDetails((d) => ({ ...emptyDetails(), date: d.date }));
      setTriedSave(false);
      titleRef.current?.focus();
    }
  }

  return (
    <form className={`add-task card${open ? ' open' : ''}`} onSubmit={handleSubmit} noValidate>
      <div className="add-task-row">
        <PlusIcon className="add-task-icon" />
        <input
          ref={titleRef}
          className="add-task-input"
          placeholder={t('addPlaceholder')}
          aria-label={t('addPlaceholder')}
          maxLength={200}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setOpen(true)}
        />
      </div>

      {open && (
        <>
          <TaskFields
            idPrefix="add"
            value={details}
            onChange={(changes) => setDetails((d) => ({ ...d, ...changes }))}
            timeMissing={Boolean(title.trim()) && !details.time}
          />
          <div className="add-task-footer">
            <span className="form-hint" role="status">
              {hint}
            </span>
            <button type="submit" className="save-btn" disabled={!canSave} aria-disabled={!canSave}>
              {t('saveTask')}
            </button>
          </div>
        </>
      )}
    </form>
  );
}
