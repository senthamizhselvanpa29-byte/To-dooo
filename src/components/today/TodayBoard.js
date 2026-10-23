'use client';

// ============================================================
// TODAY BOARD — the main part of the Today page.
//
// Order on the page:
//   1. Greeting + progress circle + quote
//   2. Plan tomorrow box
//   3. Add a task
//   4. Overdue (from earlier days, not done)
//   5. Today (High first, then by time)
//   6. Completed today (folded; tap to open)
//
// Tasks are loaded in the browser so times show in the user's own time zone.
// ============================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { addDays, startOfDay, toDateInput } from '@/lib/dates';
import {
  createTask,
  deleteTask,
  fetchTodayTasks,
  PRIORITY_RANK,
  restoreTask,
  taskErrorKey,
  updateTask,
} from '@/lib/tasks';
import { usePreferences } from '../Preferences';
import { ChevronIcon } from '../Icons';
import AddTaskForm from './AddTaskForm';
import EditTaskPanel from './EditTaskPanel';
import Greeting from './Greeting';
import PlanTomorrow from './PlanTomorrow';
import TaskItem from './TaskItem';
import UndoToast from './UndoToast';

const byDue = (a, b) => new Date(a.due_at) - new Date(b.due_at);
const byPriorityThenDue = (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || byDue(a, b);

export default function TodayBoard({ name, quote }) {
  const { t } = usePreferences();
  const addFormRef = useRef(null);

  const [now, setNow] = useState(null); // set in the browser (user's own clock)
  const [tasks, setTasks] = useState(null); // null = still loading
  const [errorKey, setErrorKey] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleted, setDeleted] = useState(null); // last deleted task (for Undo)
  const [showCompleted, setShowCompleted] = useState(false);

  // ----- Clock: update every minute (greeting, late times, evening box) -----
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  // ----- Load tasks -----
  useEffect(() => {
    fetchTodayTasks()
      .then(setTasks)
      .catch((error) => {
        setTasks([]);
        setErrorKey(taskErrorKey(error) === 'errDbNotReady' ? 'errDbNotReady' : 'errLoadTasks');
      });
  }, []);

  // ----- Split into sections -----
  const sections = useMemo(() => {
    if (!tasks || !now) return null;
    const startToday = startOfDay(now);
    const startTomorrow = addDays(startToday, 1);
    const startDayAfter = addDays(startToday, 2);
    const inRange = (task, from, to) => {
      const due = new Date(task.due_at);
      return due >= from && due < to;
    };

    const overdue = tasks.filter((x) => !x.done && new Date(x.due_at) < startToday).sort(byDue);
    const today = tasks.filter((x) => !x.done && inRange(x, startToday, startTomorrow)).sort(byPriorityThenDue);
    const completed = tasks
      .filter((x) => x.done && inRange(x, startToday, startTomorrow))
      .sort((a, b) => new Date(b.done_at) - new Date(a.done_at));
    const tomorrow = tasks.filter((x) => !x.done && inRange(x, startTomorrow, startDayAfter)).sort(byDue);

    return { overdue, today, completed, tomorrow };
  }, [tasks, now]);

  // ----- Helpers that change the list -----
  const replaceTask = (saved) => setTasks((list) => list.map((x) => (x.id === saved.id ? saved : x)));

  const showError = (error) => setErrorKey(taskErrorKey(error));

  async function handleAdd(newTask) {
    setErrorKey(null);
    try {
      const saved = await createTask(newTask);
      setTasks((list) => [...list, saved]);
      return true;
    } catch (error) {
      showError(error);
      return false;
    }
  }

  async function handleToggle(task) {
    setErrorKey(null);
    const changed = { ...task, done: !task.done, done_at: task.done ? null : new Date().toISOString() };
    replaceTask(changed); // show the change straight away
    try {
      replaceTask(await updateTask(task.id, { done: changed.done }));
    } catch (error) {
      replaceTask(task); // put it back if saving failed
      showError(error);
    }
  }

  async function handleSave(id, changes) {
    setErrorKey(null);
    try {
      replaceTask(await updateTask(id, changes));
      return true;
    } catch (error) {
      showError(error);
      return false;
    }
  }

  async function handleDelete(task) {
    setErrorKey(null);
    setEditing(null);
    setTasks((list) => list.filter((x) => x.id !== task.id));
    try {
      await deleteTask(task.id);
      setDeleted(task);
    } catch (error) {
      setTasks((list) => [...list, task]);
      showError(error);
    }
  }

  async function handleUndo() {
    const task = deleted;
    setDeleted(null);
    try {
      const restored = await restoreTask(task.id);
      setTasks((list) => [...list, restored]);
    } catch (error) {
      showError(error);
    }
  }

  const closeEditor = useCallback(() => setEditing(null), []);
  const hideUndo = useCallback(() => setDeleted(null), []);

  // ----- Still loading -----
  if (!sections) {
    return (
      <div className="today-board">
        <p className="loading-text" role="status">
          {t('loadingTasks')}
        </p>
      </div>
    );
  }

  const { overdue, today, completed, tomorrow } = sections;
  const totalToday = today.length + completed.length;

  return (
    <div className="today-board">
      <Greeting name={name} now={now} done={completed.length} total={totalToday} quote={quote} />

      {errorKey && (
        <div className="form-alert error" role="alert">
          {t(errorKey)}
        </div>
      )}

      <PlanTomorrow
        tasks={tomorrow}
        now={now}
        onOpen={setEditing}
        onAdd={() => addFormRef.current?.startFor(toDateInput(addDays(now, 1)))}
      />

      <AddTaskForm ref={addFormRef} onAdd={handleAdd} />

      {overdue.length > 0 && (
        <TaskSection title={t('sectionOverdue')} count={overdue.length} tone="overdue">
          {overdue.map((task) => (
            <TaskItem key={task.id} task={task} now={now} showDay onToggle={handleToggle} onOpen={setEditing} />
          ))}
        </TaskSection>
      )}

      <TaskSection title={t('sectionToday')} count={today.length}>
        {today.length === 0 ? (
          <li className="empty-state">{completed.length > 0 ? t('allDoneToday') : t('emptyToday')}</li>
        ) : (
          today.map((task) => (
            <TaskItem key={task.id} task={task} now={now} onToggle={handleToggle} onOpen={setEditing} />
          ))
        )}
      </TaskSection>

      {completed.length > 0 && (
        <section className="task-section">
          <button
            type="button"
            className={`section-toggle${showCompleted ? ' open' : ''}`}
            aria-expanded={showCompleted}
            onClick={() => setShowCompleted((v) => !v)}
          >
            <ChevronIcon className="section-chevron" />
            {t('sectionCompleted')} ({completed.length})
          </button>
          {showCompleted && (
            <ul className="task-list">
              {completed.map((task) => (
                <TaskItem key={task.id} task={task} now={now} onToggle={handleToggle} onOpen={setEditing} />
              ))}
            </ul>
          )}
        </section>
      )}

      {editing && (
        <EditTaskPanel task={editing} onSave={handleSave} onDelete={handleDelete} onClose={closeEditor} />
      )}

      {deleted && <UndoToast key={deleted.id} onUndo={handleUndo} onDone={hideUndo} />}
    </div>
  );
}

// A titled group of tasks ("Overdue", "Today")
function TaskSection({ title, count, tone, children }) {
  return (
    <section className={`task-section${tone ? ` ${tone}` : ''}`}>
      <h2 className="section-title">
        {title} <span className="section-count">({count})</span>
      </h2>
      <ul className="task-list">{children}</ul>
    </section>
  );
}
