'use client';

// ============================================================
// EDIT A TASK — opens when you tap a task.
// Slides in from the side on computers, from the bottom on phones.
// Change name, date, time, how long, colour, glass/rubber, list, note,
// add STEPS (for big plans) — or Delete.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { formatDateTime } from '@/lib/dates';
import { usePreferences } from '../Preferences';
import { TrashIcon, XIcon } from '../Icons';
import StepsEditor from './StepsEditor';
import TaskFields, { pickersFromTask, pickersToFields } from './TaskFields';

export default function EditTaskPanel({ task, lists, actions }) {
  const { t, lang } = usePreferences();
  const titleRef = useRef(null);
  const [title, setTitle] = useState(task.title);
  const [note, setNote] = useState(task.note || '');
  const [pickers, setPickers] = useState(() => pickersFromTask(task));
  const [busy, setBusy] = useState(false);
  const { close } = actions;

  // Focus the name box, close with Escape
  useEffect(() => {
    titleRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [close]);

  const fields = pickersToFields(pickers);
  const isStep = Boolean(task.parent_id);

  // A step can't be after its plan ends
  const stepTooLate = isStep && fields && task.parentEnd && new Date(fields.due_at) > new Date(task.parentEnd);
  const endDateError = pickers.duration === 'days' && pickers.endDate && pickers.endDate < pickers.date;
  const canSave = title.trim().length > 0 && fields !== null && !stepTooLate && !busy;

  let hint = null;
  if (!title.trim()) hint = t('enterTitle');
  else if (!pickers.time) hint = t('chooseTime');
  else if (stepTooLate) hint = t('errStepAfterPlan', { date: formatDateTime(task.parentEnd, lang) });

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSave) return;
    setBusy(true);
    const ok = await actions.save({ ...fields, title: title.trim(), note: note.trim() || null }, task);
    setBusy(false);
    if (ok) close();
  }

  return (
    <div className="panel-overlay" onClick={(e) => e.target === e.currentTarget && close()}>
      <form
        className="edit-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-title"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="edit-panel-head">
          <h2 id="edit-title">{t('editTask')}</h2>
          <button type="button" className="icon-round" aria-label={t('close')} onClick={close}>
            <XIcon />
          </button>
        </div>

        {task.parentTitle && <p className="part-of">↳ {t('partOf', { title: task.parentTitle })}</p>}

        <input
          ref={titleRef}
          className="edit-title-input"
          aria-label={t('addPlaceholder')}
          maxLength={200}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <TaskFields
          idPrefix="edit"
          value={pickers}
          onChange={(changes) => setPickers((p) => ({ ...p, ...changes }))}
          timeMissing={!pickers.time}
          endDateError={endDateError}
          lists={isStep ? undefined : lists}
        />

        {!isStep && <StepsEditor plan={task} actions={actions} />}

        <label className="field-group">
          <span className="field-group-label">{t('noteLabel')}</span>
          <textarea
            className="edit-note"
            rows={3}
            maxLength={1000}
            placeholder={t('notePlaceholder')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>

        {hint && (
          <p className="form-hint" role="status">
            {hint}
          </p>
        )}

        <div className="edit-panel-actions">
          <button type="button" className="delete-btn" onClick={() => actions.remove(task)}>
            <TrashIcon /> {t('deleteTask')}
          </button>
          <span className="spacer" />
          <button type="button" className="ghost-btn" onClick={close}>
            {t('cancel')}
          </button>
          <button type="submit" className="save-btn" disabled={!canSave}>
            {t('saveTask')}
          </button>
        </div>
      </form>
    </div>
  );
}
