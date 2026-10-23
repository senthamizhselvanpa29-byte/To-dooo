'use client';

// ============================================================
// TASK ACTIONS — shared by Today, Upcoming, Calendar and Lists.
//
// Saving a task goes through these checks:
//   1. Every task has a date + time (checked in the forms)
//   2. Clash check: if it overlaps another plan, the clash window asks
//      what to do (move the less important one / keep both / change time)
//   3. Save, then reload the page's tasks
// Repeating tasks are saved as a routine; their daily copies are made
// by src/lib/routines.js. Daily-routine habits never clash.
//
// Also: tick done, delete (with Undo), add steps, open the edit panel.
// Each page shows the windows with <TaskOverlays actions={…} />.
// ============================================================

import { useCallback, useRef, useState } from 'react';
import { addDays } from '@/lib/dates';
import { clashes, importance, LOOK_AHEAD_DAYS, lessImportant, suggestFreeDays, taskRange } from '@/lib/clash';
import { createRoutines, ensureCopies, repeatRoutineFrom, stopRoutine } from '@/lib/routines';
import {
  createTask,
  deleteTask,
  fetchOverlapping,
  restoreTask,
  taskErrorKey,
  updateTask,
} from '@/lib/tasks';

// Finds a task by id in the page's tasks, including steps inside plans
function findTask(tasks, id) {
  for (const task of tasks || []) {
    if (task.id === id) return task;
    const step = task.steps?.find((s) => s.id === id);
    if (step) return { ...step, parentTitle: task.title, parentEnd: task.end_at || task.due_at };
  }
  return null;
}

// Changes one task (or step) in the page's list without reloading
function patchTasks(tasks, id, changes) {
  return tasks.map((task) => {
    if (task.id === id) return { ...task, ...changes };
    if (task.steps?.some((s) => s.id === id)) {
      return { ...task, steps: task.steps.map((s) => (s.id === id ? { ...s, ...changes } : s)) };
    }
    return task;
  });
}

export function useTaskActions({ tasks, setTasks, reload }) {
  const [editingId, setEditingId] = useState(null);
  const snapshot = useRef(null);
  const [deleted, setDeleted] = useState(null);
  const [clash, setClash] = useState(null);
  const [errorKey, setErrorKey] = useState(null);

  const editing = editingId ? findTask(tasks, editingId) || snapshot.current : null;

  const open = useCallback((task) => {
    snapshot.current = task;
    setEditingId(task.id);
  }, []);
  const close = useCallback(() => setEditingId(null), []);

  // ----- Clash check: returns the user's decision -----
  async function askAboutClash(draft) {
    const range = taskRange(draft);
    const others = (await fetchOverlapping(range.start, range.end)).filter(
      (o) =>
        o.id !== draft.id && o.id !== draft.parent_id && o.parent_id !== draft.id && !o.habit && clashes(draft, o)
    );
    if (others.length === 0) return { action: 'none' };

    // Compare with the most important clashing plan
    const top = others.reduce((a, b) => (importance(b) < importance(a) ? b : a));
    const lower = lessImportant(draft, top);

    // Free days for the one that should move
    const lowerRange = taskRange(lower);
    const nearby = await fetchOverlapping(addDays(lowerRange.start, 1), addDays(lowerRange.end, LOOK_AHEAD_DAYS + 1));
    const busy = lower === draft ? nearby : [...nearby, draft];
    const suggestions = suggestFreeDays(lower, busy);

    return new Promise((resolve) => setClash({ draft, others, lower, suggestions, resolve }));
  }

  const decideClash = useCallback(
    (decision) => {
      setClash((current) => {
        current?.resolve(decision);
        return null;
      });
    },
    []
  );

  // ----- Save a new task (existing = null) or a changed one -----
  async function save({ repeat, repeatDays, ...fields }, existing = null) {
    setErrorKey(null);
    let toSave = fields;
    try {
      // 🔁 New repeating task → save the routine and make its copies
      if (repeat && !existing) {
        await createRoutines([repeatRoutineFrom(fields, repeat, repeatDays)]);
        await ensureCopies();
        await reload();
        return true;
      }

      const timeChanged =
        !existing || existing.due_at !== fields.due_at || (existing.end_at || null) !== (fields.end_at || null);

      // Steps (getting-ready jobs) and routine habits skip the clash check
      if (timeChanged && !(existing?.parent_id || fields.parent_id) && !existing?.habit) {
        const draft = { ...existing, ...fields, id: existing?.id ?? 'new' };
        const decision = await askAboutClash(draft);
        if (decision.action === 'cancel') return false;
        if (decision.action === 'move') {
          const moved = { due_at: decision.due_at, end_at: decision.end_at };
          if (decision.taskId === draft.id) toSave = { ...fields, ...moved };
          else await updateTask(decision.taskId, moved);
        }
      }

      if (existing) await updateTask(existing.id, toSave);
      else await createTask(toSave);
      await reload();
      return true;
    } catch (error) {
      setErrorKey(taskErrorKey(error));
      return false;
    }
  }

  // ----- Stop a repeating task (future copies are removed) -----
  async function stopRepeating(task) {
    setErrorKey(null);
    setEditingId(null);
    try {
      await stopRoutine(task.routine_id);
      await reload();
    } catch (error) {
      setErrorKey(taskErrorKey(error));
    }
  }

  // ----- Add a step inside a big plan -----
  async function addStep(plan, { title, due_at }) {
    setErrorKey(null);
    try {
      await createTask({
        title,
        due_at,
        parent_id: plan.id,
        priority: plan.priority,
        ball: plan.ball,
        list_id: plan.list_id,
      });
      await reload();
      return true;
    } catch (error) {
      setErrorKey(taskErrorKey(error));
      return false;
    }
  }

  // ----- Tick done / not done (shown straight away) -----
  async function toggle(task) {
    setErrorKey(null);
    const done = !task.done;
    setTasks((list) => patchTasks(list, task.id, { done, done_at: done ? new Date().toISOString() : null }));
    try {
      await updateTask(task.id, { done });
      await reload();
    } catch (error) {
      setTasks((list) => patchTasks(list, task.id, { done: task.done, done_at: task.done_at }));
      setErrorKey(taskErrorKey(error));
    }
  }

  // ----- Delete (with Undo) -----
  async function remove(task) {
    setErrorKey(null);
    setEditingId(null);
    try {
      await deleteTask(task.id);
      setDeleted(task);
      await reload();
    } catch (error) {
      setErrorKey(taskErrorKey(error));
    }
  }

  async function undoDelete() {
    const task = deleted;
    setDeleted(null);
    try {
      await restoreTask(task.id);
      await reload();
    } catch (error) {
      setErrorKey(taskErrorKey(error));
    }
  }

  const hideUndo = useCallback(() => setDeleted(null), []);

  return {
    editing,
    clash,
    deleted,
    errorKey,
    setErrorKey,
    open,
    close,
    save,
    addStep,
    stopRepeating,
    toggle,
    remove,
    undoDelete,
    hideUndo,
    decideClash,
  };
}
