'use client';

// ============================================================
// EDIT A TASK — opens when you tap a task.
// Slides in from the side on computers, from the bottom on phones.
// Change name, date, time, colour, glass/rubber, note — or Delete.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { combineDateTime, toDateInput, toTimeInput } from '@/lib/dates';
import { usePreferences } from '../Preferences';
import { TrashIcon, XIcon } from '../Icons';
import TaskFields from './TaskFields';

export default function EditTaskPanel({ task, onSave, onDelete, onClose }) {
  const { t } = usePreferences();
  const titleRef = useRef(null);
  const [title, setTitle] = useState(task.title);
  const [note, setNote] = useState(task.note || '');
  const [details, setDetails] = useState({
    date: toDateInput(task.due_at),
    time: toTimeInput(task.due_at),
    priority: task.priority,
    ball: task.ball,
  });
  const [busy, setBusy] = useState(false);

  // Focus the name box, close with Escape
  useEffect(() => {
    titleRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const dueAt = combineDateTime(details.date, details.time);
  const canSave = title.trim().length > 0 && dueAt !== null && !busy;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSave) return;
    setBusy(true);
    const ok = await onSave(task.id, {
      title: title.trim(),
      note: note.trim() || null,
      due_at: dueAt.toISOString(),
      priority: details.priority,
      ball: details.ball,
    });
    setBusy(false);
    if (ok) onClose();
  }

  return (
    <div className="panel-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form className="edit-panel" role="dialog" aria-modal="true" aria-labelledby="edit-title" onSubmit={handleSubmit} noValidate>
        <div className="edit-panel-head">
          <h2 id="edit-title">{t('editTask')}</h2>
          <button type="button" className="icon-round" aria-label={t('close')} onClick={onClose}>
            <XIcon />
          </button>
        </div>

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
          value={details}
          onChange={(changes) => setDetails((d) => ({ ...d, ...changes }))}
          timeMissing={!details.time}
        />

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

        <div className="edit-panel-actions">
          <button type="button" className="delete-btn" onClick={() => onDelete(task)}>
            <TrashIcon /> {t('deleteTask')}
          </button>
          <span className="spacer" />
          <button type="button" className="ghost-btn" onClick={onClose}>
            {t('cancel')}
          </button>
          <button type="submit" className="save-btn" disabled={!canSave}>
            {t('saveTask')}
          </button>
        </div>
        {(!title.trim() || !details.time) && (
          <p className="form-hint" role="status">
            {!title.trim() ? t('enterTitle') : t('chooseTime')}
          </p>
        )}
      </form>
    </div>
  );
}
