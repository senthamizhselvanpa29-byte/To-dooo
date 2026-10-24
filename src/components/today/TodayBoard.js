'use client';

// ============================================================
// TODAY BOARD — the main part of the Today page.
//
// Order on the page:
//   1. Greeting + progress circle + quote
//   2. Plan tomorrow box
//   2b. "You moved this 4 times" message (only when needed)
//   3. Add a task
//   4. Overdue (from earlier days, not done — habits never pile up here)
//   5. Today (High first, then by time)
//   6. My routine (today's habits, by time)
//   7. Completed today (folded; tap to open)
//
// Also opens:
//   • the daily routine setup the first time (../routine/RoutineSetup.js)
//   • night planning once per night at the planning time (../routine/NightPlanning.js)
//
// Tasks are loaded in the browser so times show in the user's own time zone.
// Saving, clash check, delete and Undo are in ../tasks/useTaskActions.js
// ============================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { addDays, EVENING_GLOW_MINUTES, startOfDay, toDateInput } from '@/lib/dates';
import { ensureCopies, minutesAwake } from '@/lib/routines';
import { fetchTodayTasks, PRIORITY_RANK, taskErrorKey, withPlanDetails } from '@/lib/tasks';
import { usePreferences } from '../Preferences';
import { ChevronIcon } from '../Icons';
import NightPlanning from '../routine/NightPlanning';
import RoutineSetup from '../routine/RoutineSetup';
import { useSettings } from '../routine/useSettings';
import AddTaskForm from '../tasks/AddTaskForm';
import TaskItem from '../tasks/TaskItem';
import TaskOverlays from '../tasks/TaskOverlays';
import TaskSection from '../tasks/TaskSection';
import { useLists } from '../tasks/useLists';
import { useTaskActions } from '../tasks/useTaskActions';
import Greeting from './Greeting';
import PlanTomorrow from './PlanTomorrow';
import PostponeNudge from './PostponeNudge';

const byDue = (a, b) => new Date(a.due_at) - new Date(b.due_at);
const byPriorityThenDue = (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || byDue(a, b);

export default function TodayBoard({ name, quote }) {
  const { t } = usePreferences();
  const addFormRef = useRef(null);
  const { lists, listsById } = useLists();
  const { settings, needsSetup, update: updateSettings } = useSettings();

  const [now, setNow] = useState(null); // set in the browser (user's own clock)
  const [tasks, setTasks] = useState(null); // null = still loading
  const [loadErrorKey, setLoadErrorKey] = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [planningOpen, setPlanningOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);

  // ----- Clock: update every minute (greeting, late times, evening box) -----
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  // ----- Load tasks (first make today's habit / repeat copies) -----
  const reload = useCallback(async () => {
    try {
      await ensureCopies().catch(() => {}); // routines table may not exist yet
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

  // ----- Shift-aware times -----
  const awake = settings && now ? minutesAwake(settings, now) : 0;
  const lastWake = now ? new Date(now.getTime() - awake * 60000) : null;
  const wakeKey = lastWake ? toDateInput(lastWake) : null; // "this day" for night planning
  const nextWakeDay = lastWake ? startOfDay(addDays(lastWake, 1)) : null; // "tomorrow"
  const isEvening = settings ? awake >= settings.planning_offset - EVENING_GLOW_MINUTES : false;
  const planningDue = settings && awake >= settings.planning_offset && settings.night_planned_on !== wakeKey;

  // The routine setup opens the first time (and stays open until finished)
  useEffect(() => {
    if (needsSetup) setSetupOpen(true);
  }, [needsSetup]);

  // Night planning opens by itself once per night
  useEffect(() => {
    if (planningDue && !needsSetup && !setupOpen && tasks) setPlanningOpen(true);
  }, [planningDue, needsSetup, setupOpen, tasks]);

  async function finishPlanning() {
    setPlanningOpen(false);
    try {
      await updateSettings({ night_planned_on: wakeKey });
    } catch {
      // settings table missing — planning simply shows again next time
    }
  }

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
    const todayAll = tasks.filter((x) => inRange(x, startToday, startTomorrow));

    return {
      overdue: tasks.filter((x) => !x.done && !x.habit && new Date(x.due_at) < startToday).sort(byDue),
      today: todayAll.filter((x) => !x.done && !x.habit).sort(byPriorityThenDue),
      routine: todayAll.filter((x) => x.habit).sort(byDue),
      completed: todayAll.filter((x) => x.done && !x.habit).sort((a, b) => new Date(b.done_at) - new Date(a.done_at)),
      tomorrow: tasks.filter((x) => !x.done && !x.habit && inRange(x, startTomorrow, startDayAfter)).sort(byDue),
    };
  }, [tasks, now]);

  // ----- Still loading -----
  if (!sections || !settings) {
    return (
      <div className="today-board">
        <p className="loading-text" role="status">
          {t('loadingTasks')}
        </p>
      </div>
    );
  }

  const { overdue, today, routine, completed, tomorrow } = sections;
  const routineDone = routine.filter((x) => x.done).length;
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
      <Greeting
        name={name}
        now={now}
        awakeMinutes={awake}
        done={completed.length + routineDone}
        total={today.length + completed.length + routine.length}
        quote={quote}
      />

      {errorKey && (
        <div className="form-alert error" role="alert">
          {t(errorKey)}
        </div>
      )}

      <PlanTomorrow
        tasks={tomorrow}
        isEvening={isEvening}
        onOpen={actions.open}
        onAdd={() => addFormRef.current?.startFor(toDateInput(addDays(now, 1)))}
        onStartPlanning={() => setPlanningOpen(true)}
      />

      <PostponeNudge tasks={[...overdue, ...today, ...tomorrow]} actions={actions} />

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

      {routine.length > 0 && (
        <TaskSection title={`🔁 ${t('myRoutine')}`} count={`${routineDone}/${routine.length}`} tone="routine">
          {routine.map((task) => item(task))}
        </TaskSection>
      )}

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

      {setupOpen && (
        <RoutineSetup
          settings={settings}
          onSave={updateSettings}
          onDone={() => {
            setSetupOpen(false);
            reload();
          }}
        />
      )}

      {planningOpen && (
        <NightPlanning
          tasks={tasks}
          targetDay={nextWakeDay}
          lists={lists}
          actions={actions}
          onFinish={finishPlanning}
        />
      )}

      <TaskOverlays actions={actions} lists={lists} />
    </div>
  );
}
