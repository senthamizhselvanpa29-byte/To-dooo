'use client';

// ============================================================
// ADD A TASK — the box at the top of Today, Upcoming and Lists.
// Type a name → choose the time (required) → Save.
// The task will NOT save without a date and a time.
// 🔁 Repeat makes it a repeating task (saved as a routine).
// ============================================================

import { useImperativeHandle, useRef, useState } from 'react';
import { usePreferences } from '../Preferences';
import { PlusIcon } from '../Icons';
import TaskFields, { emptyPickers, pickersToFields } from './TaskFields';

export default function AddTaskForm({ ref, onAdd, lists, defaults }) {
  const { t } = usePreferences();
  const titleRef = useRef(null);
  const [title, setTitle] = useState('');
  const [pickers, setPickers] = useState(() => emptyPickers(defaults));
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // Lets other parts of the page open this form with a date already chosen
  // (e.g. "Add for tomorrow", or the ＋ next to a day on Upcoming)
  useImperativeHandle(ref, () => ({
    startFor(dateText) {
      setPickers((p) => ({ ...p, date: dateText }));
      setOpen(true);
      titleRef.current?.focus();
      titleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
  }));

  const fields = pickersToFields(pickers);
  const weeklyMissingDays = pickers.repeat === 'weekly' && pickers.repeatDays.length === 0;
  const canSave = title.trim().length > 0 && fields !== null && !weeklyMissingDays && !busy;
  const endDateError = pickers.duration === 'days' && pickers.endDate && pickers.endDate < pickers.date;

  // What is still missing (shown under the form)
  let hint = null;
  if (title.trim() && !pickers.time) hint = t('chooseTime');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSave) return;
    setBusy(true);
    const repeat = pickers.repeat !== 'never' ? { repeat: pickers.repeat, repeatDays: pickers.repeatDays } : {};
    const ok = await onAdd({ title: title.trim(), ...fields, ...repeat });
    setBusy(false);
    if (ok) {
      // Keep the chosen date and list (handy when adding several tasks)
      setTitle('');
      setPickers((p) => emptyPickers({ ...defaults, date: p.date, listId: p.listId }));
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
            value={pickers}
            onChange={(changes) => setPickers((p) => ({ ...p, ...changes }))}
            timeMissing={Boolean(title.trim()) && !pickers.time}
            endDateError={endDateError}
            lists={lists}
            showRepeat
          />
          <div className="add-task-footer">
            <span className="form-hint" role="status">
              {hint}
            </span>
            <button type="submit" className="save-btn" disabled={!canSave}>
              {t('saveTask')}
            </button>
          </div>
        </>
      )}
    </form>
  );
}
