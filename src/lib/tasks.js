// ============================================================
// TASKS — reading and saving tasks in the Supabase database
// (the "tasks" table is created by supabase/migrations/0002_tasks.sql)
// ============================================================

import { createClient } from '@/lib/supabase/client';
import { addDays, startOfDay } from '@/lib/dates';

// Colours in order of importance (used for sorting)
export const PRIORITIES = ['high', 'medium', 'low'];
export const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

const COLUMNS =
  'id, title, note, due_at, priority, ball, done, done_at, postpone_count, postponed_minutes, created_at';

// Turns a database error into a message key (words are in src/locales).
export function taskErrorKey(error) {
  const text = `${error?.code} ${error?.message}`;
  if (/PGRST205|42P01|relation .*tasks|schema cache/i.test(text)) return 'errDbNotReady';
  return 'errSaveTask';
}

// Loads what the Today page needs:
// - unfinished tasks up to the end of tomorrow (includes overdue ones)
// - finished tasks that were due today
export async function fetchTodayTasks() {
  const supabase = createClient();
  const startToday = startOfDay();
  const endToday = addDays(startToday, 1);
  const endTomorrow = addDays(startToday, 2);

  const { data, error } = await supabase
    .from('tasks')
    .select(COLUMNS)
    .is('deleted_at', null)
    .lt('due_at', endTomorrow.toISOString())
    .or(
      `done.eq.false,and(due_at.gte.${startToday.toISOString()},due_at.lt.${endToday.toISOString()})`
    )
    .order('due_at', { ascending: true });

  if (error) throw error;
  return data;
}

// Adds a new task. dueAt must be a full date + time.
export async function createTask({ title, dueAt, priority, ball, note }) {
  const { data, error } = await createClient()
    .from('tasks')
    .insert({
      title: title.trim(),
      due_at: dueAt.toISOString(),
      priority,
      ball,
      note: note?.trim() || null,
    })
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return data;
}

// Changes a task. Only the given fields are changed.
export async function updateTask(id, changes) {
  const { data, error } = await createClient()
    .from('tasks')
    .update(changes)
    .eq('id', id)
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return data;
}

// Deletes a task. It is only hidden, so "Undo" can bring it back.
export async function deleteTask(id) {
  return updateTask(id, { deleted_at: new Date().toISOString() });
}

export async function restoreTask(id) {
  return updateTask(id, { deleted_at: null });
}
