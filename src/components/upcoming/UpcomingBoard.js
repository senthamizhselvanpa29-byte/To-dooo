'use client';

// ============================================================
// UPCOMING — what's coming after today.
//   [ List | Calendar ] switch at the top
//   List:     the next 7 days, one block per day, then "Later"
//   Calendar: month view (see CalendarView.js)
// The ＋ next to a day opens the add box with that date chosen.
// ============================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { addDays, formatDayLabel, startOfDay, toDateInput } from '@/lib/dates';
import { fetchUpcomingTasks, PRIORITIES, taskErrorKey, withPlanDetails } from '@/lib/tasks';
import { usePreferences } from '../Preferences';
import { PlusIcon } from '../Icons';
import AddTaskForm from '../tasks/AddTaskForm';
import TaskItem from '../tasks/TaskItem';
import TaskOverlays from '../tasks/TaskOverlays';
import TaskSection from '../tasks/TaskSection';
import { useLists } from '../tasks/useLists';
import { useTaskActions } from '../tasks/useTaskActions';
import CalendarView from './CalendarView';

// How many days are shown one by one before "Later"
const DAYS_SHOWN = 7;

export default function UpcomingBoard() {
  const { t } = usePreferences();
  const [view, setView] = useState('list');

  return (
    <div className="today-board">
      <div className="page-head">
        <h1>{t('navUpcoming')}</h1>
        <div className="segmented" role="tablist">
          <button type="button" role="tab" aria-selected={view === 'list'} onClick={() => setView('list')}>
            {t('listView')}
          </button>
          <button type="button" role="tab" aria-selected={view === 'calendar'} onClick={() => setView('calendar')}>
            {t('calendarView')}
          </button>
        </div>
      </div>
      {view === 'list' ? <UpcomingList /> : <CalendarView />}
    </div>
  );
}

function UpcomingList() {
  const { t, lang } = usePreferences();
  const addFormRef = useRef(null);
  const { lists, listsById } = useLists();
  const [now, setNow] = useState(null);
  const [tasks, setTasks] = useState(null);
  const [loadErrorKey, setLoadErrorKey] = useState(null);

  useEffect(() => setNow(new Date()), []);

  const reload = useCallback(async () => {
    try {
      setTasks(await withPlanDetails(await fetchUpcomingTasks()));
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

  // ----- One block per day, then "Later" -----
  const groups = useMemo(() => {
    if (!tasks || !now) return null;
    const start = startOfDay(now);
    const days = [];
    for (let i = 1; i <= DAYS_SHOWN; i++) {
      const from = addDays(start, i);
      const to = addDays(start, i + 1);
      days.push({
        date: from,
        tasks: tasks.filter((x) => new Date(x.due_at) >= from && new Date(x.due_at) < to),
      });
    }
    const laterFrom = addDays(start, DAYS_SHOWN + 1);
    return { days, later: tasks.filter((x) => new Date(x.due_at) >= laterFrom) };
  }, [tasks, now]);

  if (!groups) {
    return (
      <p className="loading-text" role="status">
        {t('loadingTasks')}
      </p>
    );
  }

  const errorKey = actions.errorKey || loadErrorKey;
  const item = (task, showDay) => (
    <TaskItem
      key={task.id}
      task={task}
      now={now}
      showDay={showDay}
      listsById={listsById}
      onToggle={actions.toggle}
      onOpen={actions.open}
    />
  );

  return (
    <>
      {errorKey && (
        <div className="form-alert error" role="alert">
          {t(errorKey)}
        </div>
      )}

      <AddTaskForm ref={addFormRef} onAdd={(fields) => actions.save(fields)} lists={lists} />

      {tasks.length === 0 && <p className="empty-state">{t('nothingUpcoming')}</p>}

      {groups.days.map(({ date, tasks: dayTasks }) => {
        const label = formatDayLabel(date, lang, t);
        return (
          <TaskSection
            key={date.toISOString()}
            title={label}
            action={
              <span className="day-head-right">
                <ColourCounts tasks={dayTasks} />
                <button
                  type="button"
                  className="icon-round small"
                  aria-label={t('addForDay', { day: label })}
                  onClick={() => addFormRef.current?.startFor(toDateInput(date))}
                >
                  <PlusIcon />
                </button>
              </span>
            }
          >
            {dayTasks.map((task) => item(task, false))}
          </TaskSection>
        );
      })}

      {groups.later.length > 0 && (
        <TaskSection title={t('later')} count={groups.later.length}>
          {groups.later.map((task) => item(task, true))}
        </TaskSection>
      )}

      <TaskOverlays actions={actions} lists={lists} />
    </>
  );
}

// 🔴2 🟡1 🟢3 — how many tasks of each colour on a day
export function ColourCounts({ tasks }) {
  return (
    <span className="colour-counts">
      {PRIORITIES.map((p) => {
        const count = tasks.filter((x) => x.priority === p).length;
        return count ? (
          <span key={p} className="colour-count">
            <span className={`prio-dot ${p}`} aria-hidden="true" />
            {count}
          </span>
        ) : null;
      })}
    </span>
  );
}
