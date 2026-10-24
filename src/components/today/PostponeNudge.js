'use client';

// ============================================================
// POSTPONE MESSAGE — shows on Today when a task has been moved
// 4 times (POSTPONE_NUDGE in src/lib/tasks.js):
//
//   ⏳ You moved "Pay electricity bill" 4 times.
//   What do you want to do?
//   [✅ Do it now] [🪜 Break into small steps] [🗑️ Drop it]   Not now
//
// After an answer it asks again only after 4 more moves.
// ============================================================

import { useState } from 'react';
import { needsNudge } from '@/lib/tasks';
import { usePreferences } from '../Preferences';

export default function PostponeNudge({ tasks, actions }) {
  const { t } = usePreferences();
  const [hidden, setHidden] = useState([]); // "Not now" — hidden until the page is opened again
  const [going, setGoing] = useState(null); // title shown with "Go for it!"

  const task = tasks.find((x) => !x.habit && needsNudge(x) && !hidden.includes(x.id));

  if (going) {
    return (
      <section className="card nudge-card" role="status">
        <p className="nudge-go">{t('nudgeGo')}</p>
      </section>
    );
  }
  if (!task) return null;

  const canSplit = !task.parent_id && !task.routine_id;

  function doNow() {
    actions.answerNudge(task);
    setGoing(task.title);
    setTimeout(() => setGoing(null), 3500);
  }

  function split() {
    actions.answerNudge(task);
    actions.open(task); // the edit panel has the Steps box
  }

  return (
    <section className="card nudge-card" aria-live="polite">
      <p className="nudge-title">{t('nudgeTitle', { title: task.title, count: task.postpone_count })}</p>
      <p className="nudge-question">{t('nudgeQuestion')}</p>
      <div className="nudge-actions">
        <button type="button" className="save-btn small" onClick={doNow}>
          ✅ {t('nudgeDoNow')}
        </button>
        {canSplit && (
          <button type="button" className="ghost-btn small" onClick={split}>
            🪜 {t('nudgeSteps')}
          </button>
        )}
        <button type="button" className="delete-btn small" onClick={() => actions.remove(task)}>
          🗑️ {t('nudgeDrop')}
        </button>
        <span className="spacer" />
        <button type="button" className="text-link" onClick={() => setHidden((list) => [...list, task.id])}>
          {t('nudgeLater')}
        </button>
      </div>
    </section>
  );
}
