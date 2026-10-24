// ============================================================
// DAILY ROUTINE, REPEATING TASKS AND SETTINGS
// Tables: supabase/migrations/0004_routine_repeat_settings.sql
//
// • Habits are saved as "minutes after wake-up", so switching between
//   day shift and night shift moves the whole routine automatically.
// • Repeating tasks have a fixed clock time and a rule
//   (every day, weekdays, weekly, monthly, every 2 months, every year).
// • Each day's copy ("occurrence") is created only once, a few days
//   ahead, when the planner is opened.
// ============================================================

import { createClient } from '@/lib/supabase/client';
import { addDays, startOfDay, toDateInput } from '@/lib/dates';

// How far ahead copies are created
const HABIT_DAYS_AHEAD = 2; // today + tomorrow
const REPEAT_DAYS_AHEAD = 8; // today + the next 7 days (the Upcoming page)

export const REPEAT_RULES = ['daily', 'weekdays', 'weekly', 'monthly', 'bimonthly', 'yearly'];

export const DEFAULT_SETTINGS = {
  shift: 'day',
  day_wake: '06:00',
  night_wake: '14:00',
  planning_offset: 900, // 15 hours after waking up → 9:00 PM on day shift
  routine_set_up: false,
  night_planned_on: null,
  week_start: 1, // 1 = Monday, 0 = Sunday
};

const db = () => createClient();

async function run(query) {
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// ------------------------------------------------------------
// Time helpers
// ------------------------------------------------------------

// "06:30" or "06:30:00" → 390 minutes
export function minutesOf(timeText) {
  const [h, m] = String(timeText).split(':').map(Number);
  return h * 60 + m;
}

// 390 → "06:30"
export function timeOfMinutes(total) {
  const m = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

// Wake-up time (minutes after midnight) for the current shift
export function wakeMinutes(settings) {
  return minutesOf(settings.shift === 'night' ? settings.night_wake : settings.day_wake);
}

// A habit's clock time ("14:10") for the current shift
export function habitClock(offset, settings) {
  return timeOfMinutes(wakeMinutes(settings) + offset);
}

// Clock time typed by the user → habit offset after wake-up
export function offsetFromClock(timeText, settings) {
  return (((minutesOf(timeText) - wakeMinutes(settings)) % 1440) + 1440) % 1440;
}

// Today's night planning moment (e.g. 9:00 PM on day shift)
export function planningMoment(settings, now = new Date()) {
  const minutes = (wakeMinutes(settings) + settings.planning_offset) % 1440;
  const moment = startOfDay(now);
  moment.setMinutes(minutes);
  return moment;
}

// Minutes since waking up (for "Good morning / afternoon / evening")
export function minutesAwake(settings, now = new Date()) {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return (((nowMinutes - wakeMinutes(settings)) % 1440) + 1440) % 1440;
}

// ------------------------------------------------------------
// Repeat rules
// ------------------------------------------------------------

const lastDayOfMonth = (y, m) => new Date(y, m + 1, 0).getDate();

// Does this routine happen on `date`?
export function happensOn(routine, date) {
  const start = new Date(`${routine.start_date}T00:00`);
  const day = startOfDay(date);
  if (day < start) return false;

  const sameDayOfMonth = () =>
    day.getDate() === Math.min(start.getDate(), lastDayOfMonth(day.getFullYear(), day.getMonth()));
  const monthsApart = (day.getFullYear() - start.getFullYear()) * 12 + (day.getMonth() - start.getMonth());

  switch (routine.repeat) {
    case 'daily':
      return true;
    case 'weekdays':
      return day.getDay() >= 1 && day.getDay() <= 5;
    case 'weekly':
      return (routine.weekdays || []).includes(day.getDay());
    case 'monthly':
      return sameDayOfMonth();
    case 'bimonthly':
      return monthsApart % 2 === 0 && sameDayOfMonth();
    case 'yearly':
      return day.getMonth() === start.getMonth() && sameDayOfMonth();
    default:
      return false;
  }
}

// When does this routine happen on `date`?
function occurrenceTime(routine, date, settings) {
  const moment = startOfDay(date);
  const minutes = routine.kind === 'habit' ? wakeMinutes(settings) + routine.offset_minutes : minutesOf(routine.time_of_day);
  moment.setMinutes(minutes);
  return moment;
}

// ------------------------------------------------------------
// Settings
// ------------------------------------------------------------

// Returns the saved settings, or null if the user has none yet
export async function fetchSettings() {
  const rows = await run(db().from('user_settings').select('*').limit(1));
  return rows[0] ?? null;
}

export async function saveSettings(changes) {
  return run(
    db()
      .from('user_settings')
      .upsert({ ...changes, updated_at: new Date().toISOString() })
      .select('*')
      .single()
  );
}

// ------------------------------------------------------------
// Routines
// ------------------------------------------------------------

export async function fetchRoutines() {
  return run(db().from('routines').select('*').eq('active', true).order('created_at', { ascending: true }));
}

export async function createRoutines(rows) {
  return run(db().from('routines').insert(rows).select('*'));
}

export async function updateRoutine(id, changes) {
  await run(db().from('routines').update(changes).eq('id', id));
  await clearFutureCopies({ routineId: id });
}

// Stop a routine: no more copies (past copies stay for the reports)
export async function stopRoutine(id) {
  return updateRoutine(id, { active: false });
}

// Removes copies that are not done yet and still in the future,
// so they can be created again with new times.
export async function clearFutureCopies({ routineId, habitsOnly } = {}) {
  let query = db()
    .from('tasks')
    .delete()
    .eq('done', false)
    .gte('due_at', new Date().toISOString())
    .not('routine_id', 'is', null);
  if (routineId) query = query.eq('routine_id', routineId);
  if (habitsOnly) query = query.eq('habit', true);
  await run(query);
}

// Creates the missing copies of every habit and repeating task.
// Safe to call often: a copy that exists (or was deleted) is never made twice.
export async function ensureCopies() {
  const [settingsRow, routines] = await Promise.all([fetchSettings(), fetchRoutines()]);
  if (!routines.length) return;
  const settings = settingsRow || DEFAULT_SETTINGS;

  const today = startOfDay();
  const rows = [];
  for (const routine of routines) {
    const days = routine.kind === 'habit' ? HABIT_DAYS_AHEAD : REPEAT_DAYS_AHEAD;
    for (let i = 0; i < days; i++) {
      const date = addDays(today, i);
      if (!happensOn(routine, date)) continue;
      const due = occurrenceTime(routine, date, settings);
      // Don't create copies for times before the routine was made
      if (due < new Date(routine.created_at)) continue;
      rows.push({
        title: routine.emoji ? `${routine.emoji} ${routine.title}` : routine.title,
        due_at: due.toISOString(),
        priority: routine.priority,
        ball: routine.ball,
        list_id: routine.list_id,
        routine_id: routine.id,
        occurrence_date: toDateInput(date),
        habit: routine.kind === 'habit',
      });
    }
  }
  if (rows.length) {
    await run(db().from('tasks').upsert(rows, { onConflict: 'routine_id,occurrence_date', ignoreDuplicates: true }));
  }
}

// Builds a repeating-task routine from the add-task form
export function repeatRoutineFrom(fields, repeat, weekdays) {
  const due = new Date(fields.due_at);
  return {
    kind: 'repeat',
    title: fields.title,
    time_of_day: `${String(due.getHours()).padStart(2, '0')}:${String(due.getMinutes()).padStart(2, '0')}`,
    repeat,
    weekdays: repeat === 'weekly' ? weekdays : null,
    start_date: toDateInput(due),
    priority: fields.priority,
    ball: fields.ball,
    list_id: fields.list_id || null,
  };
}
