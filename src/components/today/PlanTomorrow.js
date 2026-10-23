'use client';

// ============================================================
// "PLAN TOMORROW" BOX — at the top of the Today page.
// In the evening (3 hours before your night planning time) it glows
// and invites you to spend 5 minutes planning tomorrow.
// It lists tomorrow's tasks (not the daily routine).
// ============================================================

import { formatTime } from '@/lib/dates';
import { usePreferences } from '../Preferences';
import { MoonStarIcon, PlusIcon } from '../Icons';

export default function PlanTomorrow({ tasks, isEvening, onAdd, onOpen, onStartPlanning }) {
  const { t, lang } = usePreferences();

  return (
    <section className={`plan-tomorrow card${isEvening ? ' evening' : ''}`} aria-labelledby="plan-tomorrow-title">
      <div className="plan-tomorrow-head">
        <MoonStarIcon className="plan-tomorrow-icon" />
        <div>
          <h2 id="plan-tomorrow-title">{t('planTomorrowTitle')}</h2>
          <p>{isEvening ? t('planTomorrowEvening') : t('planTomorrowDay')}</p>
        </div>
        <div className="plan-tomorrow-buttons">
          {isEvening && onStartPlanning && (
            <button type="button" className="save-btn small" onClick={onStartPlanning}>
              🌙 {t('startNightPlanning')}
            </button>
          )}
          <button type="button" className={isEvening ? 'ghost-btn small' : 'save-btn small'} onClick={onAdd}>
            <PlusIcon /> {t('addForTomorrow')}
          </button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <p className="plan-tomorrow-empty">{t('planTomorrowNone')}</p>
      ) : (
        <>
          <p className="plan-tomorrow-count">{t('planTomorrowCount', { count: tasks.length })}</p>
          <ul className="plan-tomorrow-list">
            {tasks.map((task) => (
              <li key={task.id}>
                <button type="button" onClick={() => onOpen(task)}>
                  <span className={`prio-dot ${task.priority}`} aria-hidden="true" />
                  <span className="pt-time">{formatTime(task.due_at, lang)}</span>
                  <span className="pt-title">{task.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
