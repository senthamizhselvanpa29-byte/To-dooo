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
// Saving, clash check, delete and Undo are in ../tasks/useTaskActions.js
// ============================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { addDays, startOfDay, toDateInput } from '@/lib/dates';
import { fetchTodayTasks, PRIORITY_RANK, taskErrorKey, withPlanDetails } from '@/lib/tasks';
import { usePreferences } from '../Preferences';
import { ChevronIcon } from '../Icons';
import AddTaskForm from '../tasks/AddTaskForm';
import TaskItem from '../tasks/TaskItem';
import TaskOverlays from '../tasks/TaskOverlays';
import TaskSection from '../tasks/TaskSection';
import { useLists } from '../tasks/useLists';
import { useTaskActions } from '../tasks/useTaskActions';
import Greeting from './Greeting';
import PlanTomorrow from './PlanTomorrow';

const byDue = (a, b) => new Date(a.due_at) - new Date(b.due_at);
const byPriorityThenDue = (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || byDue(a, b);

export default function TodayBoard({ name, quote }) {
  const { t } = usePreferences();
  const addFormRef = useRef(null);
  const { lists, listsById } = useLists();

  const [now, setNow] = useState(null); // set in the browser (user's own clock)
  const [tasks, setTasks] = useState(null); // null = still loading
  const [loadErrorKey, setLoadErrorKey] = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);

  // ----- Clock: update every minute (greeting, late times, evening box) -----
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  // ----- Load tasks -----
  const reload = useCallback(async () => {
    try {
      setTasks(await withPlanDetails(await fetchTodayTasks()));
      setLoadErrorKey(null);
    } catch (error) {
      setTasks((current) => current || []);
      setLoadErrorKey(taskErrorKey(error) === 'errDbNotReady' ? 'errDbNotReady' : 'errLoadTasks');
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const actions = useTaskActions({ tasks, setTasks, reload });

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

    return {
      overdue: tasks.filter((x) => !x.done && new Date(x.due_at) < startToday).sort(byDue),
      today: tasks.filter((x) => !x.done && inRange(x, startToday, startTomorrow)).sort(byPriorityThenDue),
      completed: tasks
        .filter((x) => x.done && inRange(x, startToday, startTomorrow))
        .sort((a, b) => new Date(b.done_at) - new Date(a.done_at)),
      tomorrow: tasks.filter((x) => !x.done && inRange(x, startTomorrow, startDayAfter)).sort(byDue),
    };
  }, [tasks, now]);

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
  const errorKey = actions.errorKey || loadErrorKey;
  const item = (task, extra) => (
    <TaskItem
      key={task.id}
      task={task}
      now={now}
      listsById={listsById}
      onToggle={actions.toggle}
      onOpen={actions.open}
      {...extra}
    />
  );

  return (
    <div className="today-board">
      <Greeting name={name} now={now} done={completed.length} total={today.length + completed.length} quote={quote} />

      {errorKey && (
        <div className="form-alert error" role="alert">
          {t(errorKey)}
        </div>
      )}

      <PlanTomorrow
        tasks={tomorrow}
        now={now}
        onOpen={actions.open}
        onAdd={() => addFormRef.current?.startFor(toDateInput(addDays(now, 1)))}
      />

      <AddTaskForm ref={addFormRef} onAdd={(fields) => actions.save(fields)} lists={lists} />

      {overdue.length > 0 && (
        <TaskSection title={t('sectionOverdue')} count={overdue.length} tone="overdue">
          {overdue.map((task) => item(task, { showDay: true }))}
        </TaskSection>
      )}

      <TaskSection title={t('sectionToday')} count={today.length}>
        {today.length === 0 ? (
          <li className="empty-state">{completed.length > 0 ? t('allDoneToday') : t('emptyToday')}</li>
        ) : (
          today.map((task) => item(task))
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
          {showCompleted && <ul className="task-list">{completed.map((task) => item(task))}</ul>}
        </section>
      )}

      <TaskOverlays actions={actions} lists={lists} />
    </div>
  );
}
