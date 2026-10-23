'use client';

// ============================================================
// DAILY ROUTINE SETUP — shown the first time the planner opens.
//   Step 1: Day or night shift + wake-up time
//   Step 2: Tick daily habits (times follow the wake-up time)
//   Step 3: "Your day is ready!"
// Habits are saved as "minutes after wake-up", so switching shift
// later moves them all. Starting habits: src/data/habits.js
// ============================================================

import { useState } from 'react';
import { DEFAULT_HABITS } from '@/data/habits';
import { formatTime, toDateInput } from '@/lib/dates';
import { createRoutines, ensureCopies, habitClock, minutesOf, offsetFromClock } from '@/lib/routines';
import { usePreferences } from '../Preferences';
import { PlusIcon } from '../Icons';

export default function RoutineSetup({ settings, onSave, onDone }) {
  const { t, lang } = usePreferences();
  const [step, setStep] = useState(0);
  const [shift, setShift] = useState(settings.shift || 'day');
  const [dayWake, setDayWake] = useState(String(settings.day_wake).slice(0, 5));
  const [nightWake, setNightWake] = useState(String(settings.night_wake).slice(0, 5));
  const [habits, setHabits] = useState([]);
  const [customName, setCustomName] = useState('');
  const [customTime, setCustomTime] = useState('');
  const [busy, setBusy] = useState(false);
  const [errorKey, setErrorKey] = useState(null);

  const draft = { ...settings, shift, day_wake: dayWake, night_wake: nightWake };
  const wake = shift === 'night' ? nightWake : dayWake;

  // Step 1 → 2: work out each habit's clock time from the wake-up time
  function goToHabits() {
    setHabits(
      DEFAULT_HABITS.map((h) => ({ ...h, title: t(h.key), time: habitClock(h.offset, draft) }))
    );
    setStep(1);
  }

  function addCustom() {
    if (!customName.trim() || !customTime) return;
    setHabits((list) => [...list, { key: `custom-${list.length}`, emoji: '✅', title: customName.trim(), time: customTime, on: true }]);
    setCustomName('');
    setCustomTime('');
  }

  async function finish() {
    setBusy(true);
    setErrorKey(null);
    try {
      const saved = await onSave({ shift, day_wake: dayWake, night_wake: nightWake, routine_set_up: true });
      const rows = habits
        .filter((h) => h.on && h.time)
        .map((h) => ({
          kind: 'habit',
          repeat: 'daily',
          title: h.title,
          emoji: h.emoji,
          offset_minutes: offsetFromClock(h.time, saved),
          priority: 'medium',
          ball: 'glass',
          start_date: toDateInput(new Date()),
        }));
      if (rows.length) await createRoutines(rows);
      await ensureCopies();
      setStep(2);
    } catch {
      setErrorKey('errSaveTask');
    }
    setBusy(false);
  }

  async function later() {
    setBusy(true);
    try {
      await onSave({ routine_set_up: true });
    } catch {
      // ignore — the setup simply shows again next time
    }
    onDone();
  }

  // Habits shown in time order, starting from wake-up
  const ordered = [...habits].sort(
    (a, b) => ((minutesOf(a.time) - minutesOf(wake) + 1440) % 1440) - ((minutesOf(b.time) - minutesOf(wake) + 1440) % 1440)
  );

  return (
    <div className="panel-overlay center">
      <div className="setup-dialog" role="dialog" aria-modal="true" aria-labelledby="setup-title">
        <p className="setup-steps" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span key={i} className={i <= step ? 'on' : ''} />
          ))}
        </p>

        {step === 0 && (
          <>
            <h2 id="setup-title">{t('setupTitle')}</h2>
            <p className="field-group-label">{t('setupShift')}</p>
            <div className="segmented big" role="radiogroup">
              <button type="button" role="radio" aria-checked={shift === 'day'} onClick={() => setShift('day')}>
                ☀️ {t('dayShift')}
              </button>
              <button type="button" role="radio" aria-checked={shift === 'night'} onClick={() => setShift('night')}>
                🌙 {t('nightShift')}
              </button>
            </div>
            <label className="field-group">
              <span className="field-group-label">⏰ {t('setupWake')}</span>
              <input
                type="time"
                step="60"
                className="chip-input big"
                value={wake}
                onChange={(e) => (shift === 'night' ? setNightWake(e.target.value) : setDayWake(e.target.value))}
              />
            </label>
            <p className="steps-hint">{t('shiftHint')}</p>
            <div className="edit-panel-actions">
              <button type="button" className="ghost-btn" onClick={later} disabled={busy}>
                {t('setupLater')}
              </button>
              <span className="spacer" />
              <button type="button" className="save-btn" onClick={goToHabits} disabled={!wake}>
                {t('next')}
              </button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2 id="setup-title">{t('setupHabits')}</h2>
            <ul className="habit-pick-list">
              {ordered.map((h) => (
                <li key={h.key} className={h.on ? 'on' : ''}>
                  <label className="habit-pick">
                    <input
                      type="checkbox"
                      checked={h.on}
                      onChange={(e) => setHabits((list) => list.map((x) => (x.key === h.key ? { ...x, on: e.target.checked } : x)))}
                    />
                    <span className="habit-emoji" aria-hidden="true">
                      {h.emoji}
                    </span>
                    <span className="habit-title">{h.title}</span>
                  </label>
                  <input
                    type="time"
                    step="60"
                    className="chip-input"
                    aria-label={`${h.title} — ${t('timeLabel')}`}
                    value={h.time}
                    onChange={(e) => setHabits((list) => list.map((x) => (x.key === h.key ? { ...x, time: e.target.value } : x)))}
                  />
                </li>
              ))}
            </ul>
            <div className="step-add">
              <input
                className="step-add-title"
                placeholder={t('habitNamePlaceholder')}
                aria-label={t('habitNamePlaceholder')}
                maxLength={100}
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
              <input type="time" step="60" className="chip-input" aria-label={t('timeLabel')} value={customTime} onChange={(e) => setCustomTime(e.target.value)} />
              <button type="button" className="save-btn small" onClick={addCustom} disabled={!customName.trim() || !customTime}>
                <PlusIcon /> {t('addHabit')}
              </button>
            </div>
            {errorKey && (
              <div className="form-alert error" role="alert">
                {t(errorKey)}
              </div>
            )}
            <div className="edit-panel-actions">
              <button type="button" className="ghost-btn" onClick={() => setStep(0)}>
                {t('back')}
              </button>
              <span className="spacer" />
              <button type="button" className="save-btn" onClick={finish} disabled={busy}>
                {t('next')}
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 id="setup-title">{t('setupDoneTitle')}</h2>
            <p className="steps-hint">{t('setupDoneText')}</p>
            <ul className="habit-summary">
              {ordered
                .filter((h) => h.on)
                .map((h) => (
                  <li key={h.key}>
                    <span>{formatTime(new Date(`2000-01-01T${h.time}`), lang)}</span> {h.emoji} {h.title}
                  </li>
                ))}
            </ul>
            <div className="edit-panel-actions">
              <span className="spacer" />
              <button type="button" className="save-btn" onClick={onDone}>
                {t('finish')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

