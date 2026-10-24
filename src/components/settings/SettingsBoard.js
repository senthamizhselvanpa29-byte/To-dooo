'use client';

// ============================================================
// SETTINGS
//   1. My shift: ☀️ Day / 🌙 Night, wake-up time for each,
//      night planning time. Switching shift moves the whole routine.
//   2. My week: Monday or Sunday first (reports + calendar)
//   3. My daily routine: habits with their times (add / change / remove)
//   4. Repeating tasks: list with "Stop repeating"
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { formatTime, toDateInput } from '@/lib/dates';
import {
  clearFutureCopies,
  createRoutines,
  ensureCopies,
  fetchRoutines,
  habitClock,
  minutesOf,
  offsetFromClock,
  stopRoutine,
  timeOfMinutes,
  updateRoutine,
  wakeMinutes,
} from '@/lib/routines';
import { taskErrorKey } from '@/lib/tasks';
import { usePreferences } from '../Preferences';
import { PlusIcon, TrashIcon } from '../Icons';
import { useSettings } from '../routine/useSettings';
import WeekStartSwitch from './WeekStartSwitch';

const REPEAT_KEYS = {
  daily: 'repeatDaily',
  weekdays: 'repeatWeekdays',
  weekly: 'repeatWeekly',
  monthly: 'repeatMonthly',
  bimonthly: 'repeatBimonthly',
  yearly: 'repeatYearly',
};

export default function SettingsBoard() {
  const { t } = usePreferences();
  const { settings, available, update } = useSettings();
  const [routines, setRoutines] = useState(null);
  const [errorKey, setErrorKey] = useState(null);

  const loadRoutines = useCallback(async () => {
    try {
      setRoutines(await fetchRoutines());
    } catch (error) {
      setRoutines([]);
      setErrorKey(taskErrorKey(error));
    }
  }, []);

  useEffect(() => {
    loadRoutines();
  }, [loadRoutines]);

  if (!settings || !routines) {
    return (
      <div className="today-board">
        <p className="loading-text" role="status">
          {t('loadingTasks')}
        </p>
      </div>
    );
  }

  return (
    <div className="today-board">
      <div className="page-head">
        <h1>{t('navSettings')}</h1>
      </div>

      {(!available || errorKey) && (
        <div className="form-alert error" role="alert">
          {t(errorKey || 'errDbNotReady')}
        </div>
      )}

      <ShiftCard settings={settings} onSave={update} onError={setErrorKey} />
      <section className="card settings-card">
        <h2>📅 {t('myWeek')}</h2>
        <WeekStartSwitch settings={settings} onSave={update} onError={setErrorKey} />
        <p className="steps-hint">{t('weekHint')}</p>
      </section>
      <RoutineCard
        settings={settings}
        habits={routines.filter((r) => r.kind === 'habit')}
        onChanged={loadRoutines}
        onError={setErrorKey}
      />
      <RepeatsCard repeats={routines.filter((r) => r.kind === 'repeat')} onChanged={loadRoutines} onError={setErrorKey} />
    </div>
  );
}

// ------------------------------------------------------------
// 1. My shift
// ------------------------------------------------------------
function ShiftCard({ settings, onSave, onError }) {
  const { t } = usePreferences();
  const [shift, setShift] = useState(settings.shift);
  const [dayWake, setDayWake] = useState(String(settings.day_wake).slice(0, 5));
  const [nightWake, setNightWake] = useState(String(settings.night_wake).slice(0, 5));
  // Planning time is shown as a clock time for the chosen shift
  const [planning, setPlanning] = useState(habitClock(settings.planning_offset, settings));
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const wake = shift === 'night' ? nightWake : dayWake;

  // Switching shift keeps the same gap between wake-up and planning
  function switchShift(next) {
    const offset = (minutesOf(planning) - minutesOf(wake) + 1440) % 1440;
    const nextWake = next === 'night' ? nightWake : dayWake;
    setPlanning(timeOfMinutes(minutesOf(nextWake) + offset));
    setShift(next);
    setSaved(false);
  }

  async function save() {
    setBusy(true);
    onError(null);
    try {
      const draft = { ...settings, shift, day_wake: dayWake, night_wake: nightWake };
      await onSave({
        shift,
        day_wake: dayWake,
        night_wake: nightWake,
        planning_offset: offsetFromClock(planning, draft),
      });
      // Move today's and tomorrow's habits to the new times
      await clearFutureCopies({ habitsOnly: true });
      await ensureCopies();
      setSaved(true);
    } catch (error) {
      onError(taskErrorKey(error));
    }
    setBusy(false);
  }

  return (
    <section className="card settings-card">
      <h2>{t('myShift')}</h2>
      <div className="segmented big" role="radiogroup" aria-label={t('myShift')}>
        <button type="button" role="radio" aria-checked={shift === 'day'} onClick={() => switchShift('day')}>
          ☀️ {t('dayShift')}
        </button>
        <button type="button" role="radio" aria-checked={shift === 'night'} onClick={() => switchShift('night')}>
          🌙 {t('nightShift')}
        </button>
      </div>
      <p className="steps-hint">{t('shiftHint')}</p>

      <div className="settings-grid">
        <label className="field-group">
          <span className="field-group-label">☀️ {t('dayShift')} · {t('wakeUpAt')}</span>
          <input type="time" step="60" className="chip-input" value={dayWake} onChange={(e) => { setDayWake(e.target.value); setSaved(false); }} />
        </label>
        <label className="field-group">
          <span className="field-group-label">🌙 {t('nightShift')} · {t('wakeUpAt')}</span>
          <input type="time" step="60" className="chip-input" value={nightWake} onChange={(e) => { setNightWake(e.target.value); setSaved(false); }} />
        </label>
        <label className="field-group">
          <span className="field-group-label">🌙 {t('planningTime')}</span>
          <input type="time" step="60" className="chip-input" value={planning} onChange={(e) => { setPlanning(e.target.value); setSaved(false); }} />
        </label>
      </div>

      <div className="edit-panel-actions">
        {saved && <span className="saved-note">{t('settingsSaved')}</span>}
        <span className="spacer" />
        <button type="button" className="save-btn" onClick={save} disabled={busy || !dayWake || !nightWake || !planning}>
          {t('saveTask')}
        </button>
      </div>
    </section>
  );
}

// ------------------------------------------------------------
// 3. My daily routine
// ------------------------------------------------------------
function RoutineCard({ settings, habits, onChanged, onError }) {
  const { t, lang } = usePreferences();
  const [name, setName] = useState('');
  const [time, setTime] = useState('');
  const [busy, setBusy] = useState(false);

  // In time order, starting from wake-up
  const ordered = [...habits].sort((a, b) => a.offset_minutes - b.offset_minutes);

  async function run(work) {
    setBusy(true);
    onError(null);
    try {
      await work();
      await ensureCopies();
      await onChanged();
    } catch (error) {
      onError(taskErrorKey(error));
    }
    setBusy(false);
  }

  const changeTime = (habit, value) =>
    value && run(() => updateRoutine(habit.id, { offset_minutes: offsetFromClock(value, settings) }));

  const add = () =>
    run(async () => {
      await createRoutines([
        {
          kind: 'habit',
          repeat: 'daily',
          title: name.trim(),
          emoji: '✅',
          offset_minutes: offsetFromClock(time, settings),
          priority: 'medium',
          ball: 'glass',
          start_date: toDateInput(new Date()),
        },
      ]);
      setName('');
      setTime('');
    });

  return (
    <section className="card settings-card">
      <h2>🔁 {t('myRoutine')}</h2>
      <p className="steps-hint">
        {t('routineHint')} ({t('wakeUpAt')}: {formatTime(new Date(2000, 0, 1, 0, wakeMinutes(settings)), lang)})
      </p>

      {ordered.length === 0 && <p className="steps-hint">{t('noHabits')}</p>}
      <ul className="habit-pick-list">
        {ordered.map((habit) => (
          <li key={habit.id} className="on">
            <span className="habit-pick">
              <span className="habit-emoji" aria-hidden="true">
                {habit.emoji}
              </span>
              <span className="habit-title">{habit.title}</span>
            </span>
            <input
              type="time"
              step="60"
              className="chip-input"
              aria-label={`${habit.title} — ${t('timeLabel')}`}
              defaultValue={habitClock(habit.offset_minutes, settings)}
              onBlur={(e) => e.target.value !== habitClock(habit.offset_minutes, settings) && changeTime(habit, e.target.value)}
              disabled={busy}
            />
            <button
              type="button"
              className="icon-round small"
              aria-label={`${t('removeHabit')}: ${habit.title}`}
              onClick={() => run(() => stopRoutine(habit.id))}
              disabled={busy}
            >
              <TrashIcon />
            </button>
          </li>
        ))}
      </ul>

      <div className="step-add">
        <input
          className="step-add-title"
          placeholder={t('habitNamePlaceholder')}
          aria-label={t('habitNamePlaceholder')}
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input type="time" step="60" className="chip-input" aria-label={t('timeLabel')} value={time} onChange={(e) => setTime(e.target.value)} />
        <button type="button" className="save-btn small" onClick={add} disabled={!name.trim() || !time || busy}>
          <PlusIcon /> {t('addHabit')}
        </button>
      </div>
    </section>
  );
}

// ------------------------------------------------------------
// 4. Repeating tasks
// ------------------------------------------------------------
function RepeatsCard({ repeats, onChanged, onError }) {
  const { t, lang } = usePreferences();
  const [busy, setBusy] = useState(false);

  async function stop(id) {
    setBusy(true);
    onError(null);
    try {
      await stopRoutine(id);
      await onChanged();
    } catch (error) {
      onError(taskErrorKey(error));
    }
    setBusy(false);
  }

  return (
    <section className="card settings-card">
      <h2>{t('myRepeats')}</h2>
      {repeats.length === 0 && <p className="steps-hint">{t('noRepeats')}</p>}
      <ul className="habit-pick-list">
        {repeats.map((r) => (
          <li key={r.id} className="on">
            <span className="habit-pick">
              <span className={`prio-dot ${r.priority}`} aria-hidden="true" />
              <span className="habit-title">{r.title}</span>
            </span>
            <span className="meta-tag">
              🔁 {t(REPEAT_KEYS[r.repeat])} · {formatTime(new Date(`2000-01-01T${String(r.time_of_day).slice(0, 5)}`), lang)}
            </span>
            <button type="button" className="ghost-btn small" onClick={() => stop(r.id)} disabled={busy}>
              {t('stopRepeating')}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
