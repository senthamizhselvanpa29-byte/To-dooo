'use client';

// ============================================================
// "Task deleted — Undo" message at the bottom (disappears after 5 seconds)
// `text` changes the message (e.g. "Saved: ☕ Tea ₹20")
// ============================================================

import { useEffect } from 'react';
import { usePreferences } from '../Preferences';

export const UNDO_SECONDS = 5;

export default function UndoToast({ onUndo, onDone, text }) {
  const { t } = usePreferences();

  useEffect(() => {
    const timer = setTimeout(onDone, UNDO_SECONDS * 1000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="undo-toast" role="status">
      <span>{text || t('taskDeleted')}</span>
      <button type="button" onClick={onUndo}>
        {t('undo')}
      </button>
    </div>
  );
}
