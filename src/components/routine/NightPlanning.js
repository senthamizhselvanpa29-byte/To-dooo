'use client';

// ============================================================
// NIGHT PLANNING (5 minutes) — opens by itself once per night at the
// planning time (Settings), or from the "Plan tomorrow" box.
//   1. Unfinished tasks → move to tomorrow (pick a time) or drop
//   2. 💰 Today's money: "spent ₹640 · anything missed? [+ Add]"
//      (only when the money tables are set up)
//   3. Tomorrow's routine is ready
//   4. Add tomorrow's tasks
//   ✅ Summary → "Done — good night"
// "Tomorrow" means the next day you wake up (night shift too).
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { addDays, formatDayLabel, formatTime, toDateInput } from '@/lib/dates';
import { announceMoneyChange, createMoneyEntry, fetchMoneyEntries, formatMoney, MONEY_CHANGED, moneyTotals } from '@/lib/money';
import { usePreferences } from '../Preferences';
import { PlusIcon } from '../Icons';
import MoneyForm from '../money/MoneyForm';
import { useMoneyCategories } from '../money/useMoneyCategories';
import { useMoneyHidden } from '../money/useMoneyHidden';
import AddTaskForm from '../tasks/AddTaskForm';
import { pickersFromTask, pickersToFields } from '../tasks/TaskFields';

export default function NightPlanning({ tasks, targetDay, moneySince, settings, lists, actions, onFinish }) {
  const { t, lang } = usePreferences();
  const dayStart = targetDay;
  const dayEnd = addDays(targetDay, 1);
  const dayLabel = formatDayLabel(targetDay, lang, t);
  const dayText = toDateInput(targetDay);

  const inTarget = (task) => new Date(task.due_at) >= dayStart && new Date(task.due_at) < dayEnd;
  const unfinished = tasks.filter((x) => !x.done && !x.habit && new Date(x.due_at) < dayStart);
  const routine = tasks.filter((x) => x.habit && inTarget(x)).sort((a, b) => new Date(a.due_at) - new Date(b.due_at));
  const planned = tasks.filter((x) => !x.done && inTarget(x)).sort((a, b) => new Date(a.due_at) - new Date(b.due_at));

  // 💰 Money since waking up (null = money tables not set up → no section)
  const money = useMoneySince(moneySince);

  // Section numbers (the money check only shows when money is set up)
  const n = { unfinished: 1 };
  let next = 2;
  if (money) n.money = next++;
  n.routine = next++;
  n.add = next++;

  return (
    <div className="panel-overlay center">
      <div className="setup-dialog night" role="dialog" aria-modal="true" aria-labelledby="np-title">
        <h2 id="np-title">{t('npTitle', { day: dayLabel })}</h2>
        <p className="steps-hint">{t('npSubtitle')}</p>

        {/* ----- 1. Unfinished ----- */}
        <section className="np-section">
          <h3>{`${n.unfinished}. ${t('npUnfinished')}`}</h3>
          {unfinished.length === 0 ? (
            <p className="steps-hint">{t('npNoUnfinished')}</p>
          ) : (
            <ul className="np-list">
              {unfinished.map((task) => (
                <MoveRow key={task.id} task={task} dayText={dayText} actions={actions} />
              ))}
            </ul>
          )}
        </section>

        {/* ----- 2. Today's money ----- */}
        {money && <MoneyCheck number={n.money} entries={money} settings={settings} />}

        {/* ----- 3. Routine ----- */}
        <section className="np-section">
          <h3>{`${n.routine}. ${t('npRoutine')}`}</h3>
          <p className="steps-hint">
            {routine.length > 0
              ? `✓ ${t('npRoutineCount', { count: routine.length, time: formatTime(routine[0].due_at, lang) })}`
              : t('npNoRoutine')}
          </p>
        </section>

        {/* ----- 4. Add tasks ----- */}
        <section className="np-section">
          <h3>{`${n.add}. ${t('npAdd', { day: dayLabel })}`}</h3>
          <AddTaskForm onAdd={(fields) => actions.save(fields)} lists={lists} defaults={{ date: dayText }} />
        </section>

        {/* ----- Summary ----- */}
        <p className="np-summary">
          ✅{' '}
          {planned.length > 0
            ? t('npSummary', { day: dayLabel, count: planned.length, time: formatTime(planned[0].due_at, lang) })
            : t('npSummaryEmpty', { day: dayLabel })}
        </p>

        <div className="edit-panel-actions">
          <button type="button" className="ghost-btn" onClick={onFinish}>
            {t('npSkip')}
          </button>
          <span className="spacer" />
          <button type="button" className="save-btn" onClick={onFinish}>
            {t('npDone')}
          </button>
        </div>
      </div>
    </div>
  );
}

// One unfinished task: pick a time → Move, or Drop
function MoveRow({ task, dayText, actions }) {
  const { t } = usePreferences();
  const [time, setTime] = useState('');
  const [busy, setBusy] = useState(false);

  async function move() {
    setBusy(true);
    const fields = pickersToFields({ ...pickersFromTask(task), date: dayText, time, duration: task.duration === 'days' ? null : task.duration });
    if (fields) await actions.save({ ...fields, title: task.title, note: task.note }, task);
    setBusy(false);
  }

  return (
    <li>
      <span className={`prio-dot ${task.priority}`} aria-hidden="true" />
      <span className="np-name">{task.title}</span>
      <input
        type="time"
        step="60"
        className={`chip-input${!time ? ' missing' : ''}`}
        aria-label={t('timeLabel')}
        value={time}
        onChange={(e) => setTime(e.target.value)}
      />
      <button type="button" className="save-btn small" onClick={move} disabled={!time || busy}>
        {t('npMove')}
      </button>
      <button type="button" className="ghost-btn small" onClick={() => actions.remove(task)} disabled={busy}>
        {t('npDrop')}
      </button>
    </li>
  );
}

// Money added since `since` (keeps itself up to date). null = not available.
function useMoneySince(since) {
  const [entries, setEntries] = useState(null);
  const sinceMinute = since ? Math.floor(new Date(since).getTime() / 60000) : null; // stable between re-renders

  const reload = useCallback(async () => {
    if (sinceMinute === null) return;
    try {
      setEntries(await fetchMoneyEntries(new Date(sinceMinute * 60000), new Date(Date.now() + 60000)));
    } catch {
      setEntries(null); // money tables not set up yet
    }
  }, [sinceMinute]);

  useEffect(() => {
    reload();
    window.addEventListener(MONEY_CHANGED, reload);
    return () => window.removeEventListener(MONEY_CHANGED, reload);
  }, [reload]);

  return entries;
}

// 💰 "Since you woke up: spent ₹640 · earned ₹0 — anything missed? [+ Add]"
function MoneyCheck({ number, entries, settings }) {
  const { t, lang } = usePreferences();
  const [hidden] = useMoneyHidden(settings);
  const own = useMoneyCategories();
  const [formOpen, setFormOpen] = useState(false);

  const totals = moneyTotals(entries);
  const money = (amount) => formatMoney(amount, lang, { hidden });

  async function save(fields) {
    try {
      await createMoneyEntry(fields);
      announceMoneyChange();
      return true;
    } catch {
      return false;
    }
  }

  return (
    <section className="np-section">
      <h3>{`${number}. 💰 ${t('npMoney')}`}</h3>
      <div className="np-money">
        <p className="steps-hint">
          {entries.length > 0
            ? t('npMoneySummary', { spent: money(totals.spent + totals.saved), earned: money(totals.income), count: entries.length })
            : t('npMoneyNone')}
        </p>
        <button type="button" className="ghost-btn small" onClick={() => setFormOpen(true)}>
          <PlusIcon /> {t('npMoneyAdd')}
        </button>
      </div>
      {formOpen && (
        <MoneyForm
          initial={{ kind: 'expense' }}
          customCategories={own.categories}
          onAddCategory={async (fields) => {
            try {
              return await own.add(fields);
            } catch {
              return null;
            }
          }}
          defaultMode={settings?.money_default_mode}
          onSave={save}
          onClose={() => setFormOpen(false)}
        />
      )}
    </section>
  );
}
