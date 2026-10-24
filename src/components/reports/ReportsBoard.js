'use client';

// ============================================================
// REPORTS — 📊 how did my week / month go?
//
//   [ Weekly | Monthly ✨Pro ]
//   ‹  This week · 19 Oct – 25 Oct  ›
//   1. Big number: 34 of 40 done (85%) 🟢 + "12% better than last week"
//   2. By colour: 🔴 High / 🟡 Medium / 🟢 Low bars
//   3. My routine %, 🔮 glass balls kept, ⭐ best day, 😓 weakest day
//   4. Day by day: every day coloured green / yellow / red
//   5. ⏳ Most postponed tasks
//
// The numbers are worked out in src/lib/reports.js
// (Monthly becomes a Pro feature when payments are added in Week 6.)
// ============================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  addDays,
  formatDuration,
  formatMonth,
  formatShortDate,
  localeFor,
  startOfMonth,
  startOfWeek,
} from '@/lib/dates';
import { buildReport } from '@/lib/reports';
import { fetchReportTasks, POSTPONE_NUDGE, PRIORITIES, taskErrorKey } from '@/lib/tasks';
import { usePreferences } from '../Preferences';
import { ChevronIcon } from '../Icons';
import { useSettings } from '../routine/useSettings';
import WeekStartSwitch from '../settings/WeekStartSwitch';

const PRIORITY_KEYS = { high: 'priorityHigh', medium: 'priorityMedium', low: 'priorityLow' };
const COLOUR_EMOJI = { green: '🟢', yellow: '🟡', red: '🔴', none: '⚪' };

// Start and end of the period that contains `date`
function periodOf(view, date, weekStart) {
  if (view === 'week') {
    const from = startOfWeek(date, weekStart);
    return { from, to: addDays(from, 7) };
  }
  const from = startOfMonth(date);
  return { from, to: new Date(from.getFullYear(), from.getMonth() + 1, 1) };
}

// The period just before
function previousOf(view, from, weekStart) {
  return periodOf(view, addDays(from, -1), weekStart);
}

export default function ReportsBoard() {
  const { t, lang } = usePreferences();
  const { settings, update } = useSettings();
  const [view, setView] = useState('week');
  const [anchor, setAnchor] = useState(null); // any day inside the shown period
  const [now, setNow] = useState(null);
  const [data, setData] = useState(null); // { tasks, prevFrom } for the shown + previous period
  const [errorKey, setErrorKey] = useState(null);

  useEffect(() => {
    const today = new Date();
    setNow(today);
    setAnchor(today);
  }, []);

  const weekStart = settings?.week_start ?? 1;
  const period = useMemo(
    () => (anchor && settings ? periodOf(view, anchor, weekStart) : null),
    [view, anchor, weekStart, settings]
  );
  const previous = useMemo(() => (period ? previousOf(view, period.from, weekStart) : null), [view, period, weekStart]);

  // One load for this period + the one before (for "better than last week")
  const load = useCallback(async () => {
    if (!period || !previous) return;
    setData(null);
    try {
      setData({ tasks: await fetchReportTasks(previous.from, period.to), from: period.from });
      setErrorKey(null);
    } catch (error) {
      setData({ tasks: [], from: period.from });
      setErrorKey(taskErrorKey(error) === 'errDbNotReady' ? 'errDbNotReady' : 'errLoadTasks');
    }
  }, [period, previous]);

  useEffect(() => {
    load();
  }, [load]);

  const reports = useMemo(() => {
    if (!data || !period || !now || data.from.getTime() !== period.from.getTime()) return null;
    const inside = (from, to) => data.tasks.filter((x) => new Date(x.due_at) >= from && new Date(x.due_at) < to);
    return {
      current: buildReport(inside(period.from, period.to), period.from, period.to, now),
      previous: buildReport(inside(previous.from, previous.to), previous.from, previous.to, now),
    };
  }, [data, period, previous, now]);

  if (!period || !now) {
    return (
      <div className="today-board">
        <p className="loading-text" role="status">
          {t('loadingTasks')}
        </p>
      </div>
    );
  }

  const isCurrent = period.from <= now && now < period.to;
  const switchView = (next) => {
    setView(next);
    setAnchor(now); // start again from this week / month
  };
  const move = (step) =>
    setAnchor(view === 'week' ? addDays(period.from, step * 7) : new Date(period.from.getFullYear(), period.from.getMonth() + step, 1));
  const title =
    view === 'week'
      ? `${formatShortDate(period.from, lang)} – ${formatShortDate(addDays(period.to, -1), lang)}`
      : formatMonth(period.from, lang);

  return (
    <div className="today-board">
      <div className="page-head">
        <h1>📊 {t('navReports')}</h1>
        <div className="segmented" role="tablist">
          <button type="button" role="tab" aria-selected={view === 'week'} onClick={() => switchView('week')}>
            {t('reportWeekly')}
          </button>
          <button type="button" role="tab" aria-selected={view === 'month'} onClick={() => switchView('month')}>
            {t('reportMonthly')} <span className="pro-badge">✨{t('proBadge')}</span>
          </button>
        </div>
      </div>

      {errorKey && (
        <div className="form-alert error" role="alert">
          {t(errorKey)}
        </div>
      )}

      <section className="card report-period">
        <button type="button" className="icon-round" aria-label={t('prevPeriod')} onClick={() => move(-1)}>
          <ChevronIcon className="chev-left" />
        </button>
        <div className="report-period-text">
          {isCurrent && <span className="report-period-now">{t(view === 'week' ? 'thisWeek' : 'thisMonth')}</span>}
          <h2>{title}</h2>
        </div>
        <button
          type="button"
          className="icon-round"
          aria-label={t('nextPeriod')}
          onClick={() => move(1)}
          disabled={isCurrent}
        >
          <ChevronIcon className="chev-right" />
        </button>
      </section>

      {view === 'week' && settings && (
        <WeekStartSwitch settings={settings} onSave={update} onError={setErrorKey} compact />
      )}
      {view === 'month' && <p className="steps-hint">✨ {t('monthlyProNote')}</p>}

      {!reports ? (
        <p className="loading-text" role="status">
          {t('loadingTasks')}
        </p>
      ) : reports.current.overall.total === 0 ? (
        <p className="empty-state">{t('reportNothing')}</p>
      ) : (
        <Report
          report={reports.current}
          previous={reports.previous}
          view={view}
          weekStart={weekStart}
          now={now}
        />
      )}
    </div>
  );
}

// ------------------------------------------------------------
// The report itself
// ------------------------------------------------------------
function Report({ report, previous, view, weekStart, now }) {
  const { t, lang } = usePreferences();
  const { overall, byPriority, routine, glass, best, weakest, postponed } = report;

  // "12% better than last week"
  let compare = null;
  if (overall.pct !== null && previous.overall.pct !== null) {
    const diff = overall.pct - previous.overall.pct;
    const periodWord = t(view === 'week' ? 'lastWeek' : 'lastMonth');
    if (diff > 0) compare = { tone: 'up', text: t('reportBetter', { pct: diff, period: periodWord }) };
    else if (diff < 0) compare = { tone: 'down', text: t('reportWorse', { pct: -diff, period: periodWord }) };
    else compare = { tone: 'same', text: t('reportSame', { period: periodWord }) };
  }

  const dayName = (day) => day.date.toLocaleDateString(localeFor(lang), { weekday: 'long', day: 'numeric', month: 'short' });

  return (
    <>
      {/* 1. Big number */}
      <section className={`card report-hero colour-${overall.colour}`}>
        <div className="report-ring" style={{ '--pct': overall.pct }} aria-hidden="true">
          <span>{overall.pct}%</span>
        </div>
        <div className="report-hero-text">
          <p className="report-big">
            {COLOUR_EMOJI[overall.colour]} {t('reportDone', { done: overall.done, total: overall.total })}
          </p>
          {compare && <p className={`report-compare ${compare.tone}`}>{compare.text}</p>}
        </div>
      </section>

      {/* 2. By colour */}
      <section className="card report-card">
        <h2>{t('reportByColour')}</h2>
        <ul className="report-bars">
          {PRIORITIES.map((p) => {
            const s = byPriority[p];
            return (
              <li key={p}>
                <span className="report-bar-label">
                  <span className={`prio-dot ${p}`} aria-hidden="true" /> {t(PRIORITY_KEYS[p])}
                </span>
                <span className="report-bar" aria-hidden="true">
                  <span className={`report-bar-fill ${p}`} style={{ width: `${s.pct ?? 0}%` }} />
                </span>
                <span className="report-bar-count">
                  {s.done}/{s.total}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* 3. Small numbers */}
      <section className="report-stats">
        {routine.total > 0 && (
          <div className="card report-stat">
            <span className="report-stat-label">🔁 {t('reportRoutine')}</span>
            <span className="report-stat-value">{routine.pct}%</span>
            <span className="report-stat-sub">
              {routine.done}/{routine.total}
            </span>
          </div>
        )}
        {glass.total > 0 && (
          <div className="card report-stat">
            <span className="report-stat-label">{t('reportGlass')}</span>
            <span className="report-stat-value">
              {glass.done}/{glass.total}
            </span>
          </div>
        )}
        {best && (
          <div className="card report-stat">
            <span className="report-stat-label">{t('reportBestDay')}</span>
            <span className="report-stat-day">{dayName(best)}</span>
            <span className="report-stat-sub">{best.pct}%</span>
          </div>
        )}
        {weakest && (
          <div className="card report-stat">
            <span className="report-stat-label">{t('reportWeakDay')}</span>
            <span className="report-stat-day">{dayName(weakest)}</span>
            <span className="report-stat-sub">{weakest.pct}%</span>
          </div>
        )}
      </section>

      {/* 4. Day by day */}
      <section className="card report-card">
        <h2>{t('reportDays')}</h2>
        <DayGrid days={report.days} view={view} weekStart={weekStart} now={now} />
        <p className="steps-hint">{t('colourGuide')}</p>
      </section>

      {/* 5. Most postponed */}
      <section className="card report-card">
        <h2>{t('reportPostponed')}</h2>
        {postponed.length === 0 ? (
          <p className="steps-hint">{t('reportNoPostponed')}</p>
        ) : (
          <ul className="report-postponed">
            {postponed.map((task) => (
              <li key={task.id}>
                <span className={`prio-dot ${task.priority}`} aria-hidden="true" />
                <span className="report-postponed-title">{task.title}</span>
                <span className={`postpone-badge${task.postpone_count >= POSTPONE_NUDGE ? ' strong' : ''}`}>
                  {t('postponedInfo', { count: task.postpone_count, time: formatDuration(task.postponed_minutes, t) })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

// ------------------------------------------------------------
// Coloured days: one row for a week, a calendar for a month
// ------------------------------------------------------------
function DayGrid({ days, view, weekStart, now }) {
  const { t, lang } = usePreferences();
  const blanks = view === 'month' ? (days[0].date.getDay() - weekStart + 7) % 7 : 0;
  const headers = Array.from({ length: 7 }, (_, i) =>
    addDays(startOfWeek(now, weekStart), i).toLocaleDateString(localeFor(lang), { weekday: 'narrow' })
  );

  return (
    <div className={`report-days ${view}`} role="list">
      {view === 'month' &&
        headers.map((name, i) => (
          <span key={`h${i}`} className="calendar-weekday" aria-hidden="true">
            {name}
          </span>
        ))}
      {Array.from({ length: blanks }, (_, i) => (
        <span key={`b${i}`} aria-hidden="true" />
      ))}
      {days.map((day) => {
        const label = day.date.toLocaleDateString(localeFor(lang), { weekday: 'short', day: 'numeric', month: 'short' });
        const value = day.future ? '' : day.total ? `${day.pct}%` : '–';
        return (
          <div
            key={day.date.getTime()}
            role="listitem"
            className={`report-day colour-${day.future ? 'future' : day.colour}`}
            title={day.total ? `${label}: ${t('reportDone', { done: day.done, total: day.total })}` : `${label}: ${t('dayNoTasks')}`}
          >
            {view === 'week' && (
              <span className="report-day-name">
                {day.date.toLocaleDateString(localeFor(lang), { weekday: 'short' })}
              </span>
            )}
            <span className="report-day-num">{day.date.getDate()}</span>
            <span className="report-day-pct">{value}</span>
          </div>
        );
      })}
    </div>
  );
}
