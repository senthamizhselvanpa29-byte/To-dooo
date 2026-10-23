// ============================================================
// CLASH CHECK — do two plans happen at the same time?
//
// A task lasts from its date + time until its end ("How long?").
// Without "How long?", it is a single moment: it only clashes with
// something at exactly the same time, or with a longer plan around it.
//
// Which one should move? The LESS important one:
//   colour first (🟢 Low before 🟡 Medium before 🔴 High),
//   then 🏀 rubber before 🔮 glass.
// ============================================================

import { PRIORITY_RANK } from './tasks';

// How many free dates to suggest, and how far ahead to look
const SUGGESTIONS = 3;
const LOOK_AHEAD_DAYS = 30;

export function taskRange(task) {
  const start = new Date(task.due_at);
  const end = task.end_at ? new Date(task.end_at) : start;
  return { start, end };
}

export function overlaps(a, b) {
  return a.start <= b.end && b.start <= a.end;
}

// Bigger number = less important
export function importance(task) {
  return PRIORITY_RANK[task.priority] * 2 + (task.ball === 'rubber' ? 1 : 0);
}

// Returns the task that should move. When both are equal, the new one moves.
export function lessImportant(newTask, existingTask) {
  return importance(existingTask) > importance(newTask) ? existingTask : newTask;
}

// Moves a task's start (and end) by a number of days
export function shiftTask(task, days) {
  const { start, end } = taskRange(task);
  const ms = days * 86400000;
  return {
    due_at: new Date(start.getTime() + ms).toISOString(),
    end_at: task.end_at ? new Date(end.getTime() + ms).toISOString() : null,
  };
}

// Finds the next free days (same time of day) for `task`,
// given the other tasks in the following weeks.
export function suggestFreeDays(task, others) {
  const found = [];
  for (let days = 1; days <= LOOK_AHEAD_DAYS && found.length < SUGGESTIONS; days++) {
    const moved = shiftTask(task, days);
    const range = taskRange(moved);
    if (!others.some((o) => o.id !== task.id && overlaps(range, taskRange(o)))) {
      found.push({ days, ...moved });
    }
  }
  return found;
}

export { LOOK_AHEAD_DAYS };
