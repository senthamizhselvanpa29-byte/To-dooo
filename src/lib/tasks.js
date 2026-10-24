// ============================================================
// TASKS & LISTS — reading and saving in the Supabase database
// Tables: supabase/migrations/0002_tasks.sql and 0003_lists_steps_duration.sql
// ============================================================

import { createClient } from '@/lib/supabase/client';
import { addDays, startOfDay } from '@/lib/dates';

// Colours in order of importance (used for sorting)
export const PRIORITIES = ['high', 'medium', 'low'];
export const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

// Postpone tracker: after this many moves, VdoU asks
// "Do it now, break it into steps, or drop it?"
export const POSTPONE_NUDGE = 4;

// Does this task need the postpone message now?
// (It asks again after every 4 more moves.)
export const needsNudge = (task) =>
  !task.done && task.postpone_count >= (task.nudged_at_count || 0) + POSTPONE_NUDGE;

const COLUMNS =
  'id, title, note, due_at, end_at, duration, priority, ball, done, done_at, postpone_count, postponed_minutes, list_id, parent_id, routine_id, occurrence_date, habit, why, nudged_at_count, created_at';

const db = () => createClient();
const iso = (date) => new Date(date).toISOString();

// Turns a database error into a message key (words are in src/locales).
export function taskErrorKey(error) {
  const text = `${error?.code} ${error?.message}`;
  if (/PGRST205|42P01|42703|relation .*(tasks|lists)|schema cache|column .* does not exist/i.test(text)) {
    return 'errDbNotReady';
  }
  if (/step_after_plan/.test(text)) return 'errStepAfterPlanShort';
  return 'errSaveTask';
}

async function run(query) {
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// ------------------------------------------------------------
// Loading tasks
// ------------------------------------------------------------

// Today page: unfinished tasks up to the end of tomorrow (incl. overdue)
// + finished tasks that were due today.
export async function fetchTodayTasks() {
  const startToday = startOfDay();
  const endToday = addDays(startToday, 1);
  const endTomorrow = addDays(startToday, 2);
  return run(
    db()
      .from('tasks')
      .select(COLUMNS)
      .is('deleted_at', null)
      .lt('due_at', iso(endTomorrow))
      .or(`done.eq.false,and(due_at.gte.${iso(startToday)},due_at.lt.${iso(endToday)})`)
      .order('due_at', { ascending: true })
  );
}

// Upcoming page: unfinished tasks from tomorrow onwards
export async function fetchUpcomingTasks() {
  return run(
    db()
      .from('tasks')
      .select(COLUMNS)
      .is('deleted_at', null)
      .eq('done', false)
      .gte('due_at', iso(addDays(startOfDay(), 1)))
      .order('due_at', { ascending: true })
      .limit(300)
  );
}

// Reports: every task due in [from, to) — done or not (habits too)
export async function fetchReportTasks(from, to) {
  return run(
    db()
      .from('tasks')
      .select('id, title, due_at, priority, ball, done, habit, postpone_count, postponed_minutes, parent_id')
      .is('deleted_at', null)
      .gte('due_at', iso(from))
      .lt('due_at', iso(to))
      .order('due_at', { ascending: true })
      .limit(3000)
  );
}

// Calendar: every task that touches the period [from, to)
export async function fetchTasksBetween(from, to) {
  return run(
    db()
      .from('tasks')
      .select(COLUMNS)
      .is('deleted_at', null)
      .or(`and(due_at.gte.${iso(from)},due_at.lt.${iso(to)}),and(due_at.lt.${iso(from)},end_at.gte.${iso(from)})`)
      .order('due_at', { ascending: true })
      .limit(500)
  );
}

// Lists page: every task in one list
export async function fetchListTasks(listId) {
  return run(
    db()
      .from('tasks')
      .select(COLUMNS)
      .is('deleted_at', null)
      .eq('list_id', listId)
      .order('due_at', { ascending: true })
      .limit(300)
  );
}

// Unfinished tasks that overlap the time [start, end] (for the clash check)
export async function fetchOverlapping(start, end) {
  return run(
    db()
      .from('tasks')
      .select(COLUMNS)
      .is('deleted_at', null)
      .eq('done', false)
      .lte('due_at', iso(end))
      .or(`end_at.gte.${iso(start)},and(end_at.is.null,due_at.gte.${iso(start)})`)
      .limit(200)
  );
}

// Adds what the screens need to show:
//  • big plans get their `steps`
//  • steps get their plan's name (`parentTitle`) and deadline (`parentEnd`)
export async function withPlanDetails(tasks) {
  if (!tasks.length) return tasks;

  const planIds = tasks.filter((x) => !x.parent_id).map((x) => x.id);
  const stepPlanIds = [...new Set(tasks.filter((x) => x.parent_id).map((x) => x.parent_id))];

  const [steps, plans] = await Promise.all([
    planIds.length
      ? run(
          db()
            .from('tasks')
            .select(COLUMNS)
            .is('deleted_at', null)
            .in('parent_id', planIds)
            .order('due_at', { ascending: true })
        )
      : [],
    stepPlanIds.length
      ? run(db().from('tasks').select('id, title, due_at, end_at').in('id', stepPlanIds))
      : [],
  ]);

  const plansById = Object.fromEntries(plans.map((p) => [p.id, p]));
  return tasks.map((task) => {
    if (task.parent_id) {
      const plan = plansById[task.parent_id];
      return { ...task, parentTitle: plan?.title, parentEnd: plan ? plan.end_at || plan.due_at : null };
    }
    return { ...task, steps: steps.filter((s) => s.parent_id === task.id) };
  });
}

// ------------------------------------------------------------
// Saving tasks
// ------------------------------------------------------------

// fields: { title, due_at, end_at, duration, priority, ball, note, why, list_id, parent_id }
export async function createTask(fields) {
  return run(db().from('tasks').insert(fields).select(COLUMNS).single());
}

// Changes a task. Only the given fields are changed.
export async function updateTask(id, changes) {
  return run(db().from('tasks').update(changes).eq('id', id).select(COLUMNS).single());
}

// Deletes a task. It is only hidden, so "Undo" can bring it back.
export async function deleteTask(id) {
  return updateTask(id, { deleted_at: new Date().toISOString() });
}

export async function restoreTask(id) {
  return updateTask(id, { deleted_at: null });
}

// ------------------------------------------------------------
// Lists (Home, Work, Study…)
// ------------------------------------------------------------

export async function fetchLists() {
  return run(db().from('lists').select('id, name, emoji, created_at').order('created_at', { ascending: true }));
}

export async function createList({ name, emoji }) {
  return run(db().from('lists').insert({ name: name.trim(), emoji }).select('id, name, emoji, created_at').single());
}

export async function updateList(id, changes) {
  return run(db().from('lists').update(changes).eq('id', id).select('id, name, emoji, created_at').single());
}

// Deleting a list keeps its tasks (they just have no list any more)
export async function deleteList(id) {
  return run(db().from('lists').delete().eq('id', id));
}
