'use client';

// ============================================================
// CALENDAR — one month at a time.
// Each day shows coloured dots (🔴🟡🟢) for its unfinished tasks.
// Long plans ("Many days") show on every day they cover.
// Tap a day to see its tasks below the calendar.
// (Pro feature — the lock is added with payments in Week 6.)
// ============================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { addDays, formatDayLabel, formatMonth, localeFor, startOfDay, startOfWeek, toDateInput } from '@/lib/dates';
import { taskRange } from '@/lib/clash';
import { fetchTasksBetween, PRIORITIES, taskErrorKey, withPlanDetails } from '@/lib/tasks';
import { usePreferences } from '../Preferences';
import { ChevronIcon, PlusIcon } from '../Icons';
import AddTaskForm from '../tasks/AddTaskForm';
import TaskItem from '../tasks/TaskItem';
import TaskOverlays from '../tasks/TaskOverlays';
import TaskSection from '../tasks/TaskSection';
import { useSettings } from '../routine/useSettings';
import { useLists } from '../tasks/useLists';
import { useTaskActions } from '../tasks/useTaskActions';

// Weeks start on Monday or Sunday (chosen in Settings)
const gridStartFor = (month, weekStart) => startOfWeek(month, weekStart);

export default function CalendarView() {
  const { t, lang } = usePreferences();
  const addFormRef = useRef(null);
  const { lists, listsById } = useLists();
  const { settings } = useSettings();
  const weekStart = settings?.week_start ?? 1;
  const [now, setNow] = useState(null);
  const [month, setMonth] = useState(null);
  const [selected, setSelected] = useState(null);
  const [tasks, setTasks] = useState(null);
  const [loadErrorKey, setLoadErrorKey] = useState(null);

  useEffect(() => {
    const today = new Date();
    setNow(today);
    setMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelected(startOfDay(today));
  }, []);

  const gridStart = useMemo(() => (month ? gridStartFor(month, weekStart) : null), [month, weekStart]);

  const reload = useCallback(async () => {
    if (!gridStart) return;
    try {
      const all = await fetchTasksBetween(gridStart, addDays(gridStart, 42));
      setTasks(await withPlanDetails(all.filter((x) => !x.habit))); // routine habits stay on Today
      setLoadErrorKey(null);
    } catch (error) {
      setTasks((current) => current || []);
      setLoadErrorKey(taskErrorKey(error) === 'errDbNotReady' ? 'errDbNotReady' : 'errLoadTasks');
    }
  }, [gridStart]);

  useEffect(() => {
    reload();
  }, [reload]);

  const actions = useTaskActions({ tasks, setTasks, reload });

  // Tasks touching a given day
  const tasksOn = useCallback(
    (day) => {
      const from = startOfDay(day);
      const to = addDays(from, 1);
      return (tasks || []).filter((task) => {
        const { start, end } = taskRange(task);
        return start < to && end >= from;
      });
    },
    [tasks]
  );

  const cells = useMemo(() => {
    if (!gridStart) return [];
    return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  }, [gridStart]);

  if (!month || !now) return null;

  const weekdayNames = Array.from({ length: 7 }, (_, i) =>
    addDays(gridStart, i).toLocaleDateString(localeFor(lang), { weekday: 'narrow' })
  );
  const todayKey = startOfDay(now).getTime();
  const selectedTasks = selected ? tasksOn(selected) : [];
  const errorKey = actions.errorKey || loadErrorKey;
  const selectedLabel = selected ? formatDayLabel(selected, lang, t) : '';

  return (
    <>
      {errorKey && (
        <div className="form-alert error" role="alert">
          {t(errorKey)}
        </div>
      )}

      <section className="calendar card">
        <div className="calendar-head">
          <button
            type="button"
            className="icon-round"
            aria-label={t('prevMonth')}
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          >
            <ChevronIcon className="chev-left" />
          </button>
          <h2>{formatMonth(month, lang)}</h2>
          <button
            type="button"
            className="icon-round"
            aria-label={t('nextMonth')}
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          >
            <ChevronIcon className="chev-right" />
          </button>
        </div>

        <div className="calendar-grid" role="grid">
          {weekdayNames.map((name, i) => (
            <span key={i} className="calendar-weekday" role="columnheader">
              {name}
            </span>
          ))}
          {cells.map((day) => {
            const key = day.getTime();
            const open = tasksOn(day).filter((x) => !x.done);
            const colours = PRIORITIES.filter((p) => open.some((x) => x.priority === p));
            const classes = ['calendar-day'];
            if (day.getMonth() !== month.getMonth()) classes.push('other-month');
            if (key === todayKey) classes.push('today');
            if (selected && key === selected.getTime()) classes.push('selected');
            return (
              <button
                key={key}
                type="button"
                role="gridcell"
                className={classes.join(' ')}
                aria-label={`${day.toLocaleDateString(localeFor(lang), { day: 'numeric', month: 'long' })}, ${open.length}`}
                aria-selected={selected && key === selected.getTime()}
                onClick={() => setSelected(day)}
              >
                <span className="calendar-num">{day.getDate()}</span>
                <span className="calendar-dots" aria-hidden="true">
                  {colours.map((p) => (
                    <span key={p} className={`prio-dot ${p}`} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <AddTaskForm ref={addFormRef} onAdd={(fields) => actions.save(fields)} lists={lists} />

      {selected && (
        <TaskSection
          title={selectedLabel}
          count={selectedTasks.length}
          action={
            <button
              type="button"
              className="icon-round small"
              aria-label={t('addForDay', { day: selectedLabel })}
              onClick={() => addFormRef.current?.startFor(toDateInput(selected))}
            >
              <PlusIcon />
            </button>
          }
        >
          {selectedTasks.length === 0 ? (
            <li className="empty-state">{t('noTasksThisDay')}</li>
          ) : (
            selectedTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                now={now}
                listsById={listsById}
                onToggle={actions.toggle}
                onOpen={actions.open}
              />
            ))
          )}
        </TaskSection>
      )}

      <TaskOverlays actions={actions} lists={lists} />
    </>
  );
}
