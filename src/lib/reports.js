// ============================================================
// REPORTS — weekly and monthly numbers (the 📊 Reports page)
//
// What counts:
//   • every task and habit due in the period, that is already due
//     (later ones this week don't count as "not done" yet),
//     plus tasks finished early
//   • "done" = ticked
//
// Day colours (same everywhere):
//   🟢 green  = 80% or more done
//   🟡 yellow = 50–79% done
//   🔴 red    = less than 50% done
//   grey      = nothing planned (or the day hasn't come yet)
// ============================================================

import { addDays, startOfDay } from '@/lib/dates';
import { PRIORITIES } from '@/lib/tasks';

export const GREEN_FROM = 80;
export const YELLOW_FROM = 50;

// How many tasks show in "Most postponed"
const TOP_POSTPONED = 5;

const percent = (done, total) => (total ? Math.round((done * 100) / total) : null);

// 85 → 'green', 60 → 'yellow', 30 → 'red', null → 'none'
export function colourFor(pct) {
  if (pct === null || pct === undefined) return 'none';
  if (pct >= GREEN_FROM) return 'green';
  if (pct >= YELLOW_FROM) return 'yellow';
  return 'red';
}

// Done / total / % for a group of tasks
function score(list) {
  const done = list.filter((x) => x.done).length;
  return { done, total: list.length, pct: percent(done, list.length) };
}

// tasks: from fetchReportTasks(from, to)
// Returns everything the Reports page shows.
export function buildReport(tasks, from, to, now = new Date()) {
  // Only what is already due (or finished early)
  const counted = tasks.filter((x) => x.done || new Date(x.due_at) <= now);

  // One entry per day, with its colour
  const days = [];
  for (let day = startOfDay(from); day < to; day = addDays(day, 1)) {
    const next = addDays(day, 1);
    const onDay = counted.filter((x) => {
      const due = new Date(x.due_at);
      return due >= day && due < next;
    });
    const s = score(onDay);
    days.push({ date: day, future: day > now, ...s, colour: colourFor(s.pct) });
  }

  // Best and weakest day (only when 2 or more days have tasks)
  const scored = days.filter((d) => d.total > 0);
  let best = null;
  let weakest = null;
  if (scored.length >= 2) {
    best = scored.reduce((a, b) => (b.pct > a.pct ? b : a));
    weakest = scored.reduce((a, b) => (b.pct < a.pct ? b : a));
    if (best.pct === weakest.pct) weakest = null;
  }

  // Most postponed tasks (not habits)
  const postponed = tasks
    .filter((x) => !x.habit && x.postpone_count > 0)
    .sort((a, b) => b.postpone_count - a.postpone_count || b.postponed_minutes - a.postponed_minutes)
    .slice(0, TOP_POSTPONED);

  const overall = score(counted);
  return {
    overall: { ...overall, colour: colourFor(overall.pct) },
    byPriority: Object.fromEntries(PRIORITIES.map((p) => [p, score(counted.filter((x) => x.priority === p))])),
    routine: score(counted.filter((x) => x.habit)),
    glass: score(counted.filter((x) => x.ball === 'glass' && !x.habit)),
    days,
    best,
    weakest,
    postponed,
  };
}
