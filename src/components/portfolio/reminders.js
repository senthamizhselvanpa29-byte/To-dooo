// ============================================================
// PORTFOLIO REMINDERS (they appear as normal tasks on Today)
//   • FD / RD / PPF… matures: 7 days before and on the day, 10:00 AM
//   • Loan: "Pay Home loan (SBI) — ₹26,035" every month on the EMI day
//     (ticking it asks "How much did you pay?" → daily Money)
//   • Optional: "Update investment values" on the 1st of every month
// ============================================================

import { addDays, formatShortDate, toDateInput } from '@/lib/dates';
import { formatMoney } from '@/lib/money';
import { emiFor, MATURITY_NOTICE_DAYS, REMINDER_TIME, toDate, typeName, loanType } from '@/lib/portfolio';
import { createRoutines, stopRoutine } from '@/lib/routines';
import { createTask, deleteTask } from '@/lib/tasks';

const [HOUR, MINUTE] = REMINDER_TIME.split(':').map(Number);
const atReminderTime = (date) => {
  const d = new Date(date);
  d.setHours(HOUR, MINUTE, 0, 0);
  return d;
};

// "Matures soon" + "matures today" tasks → their ids (saved on the investment)
export async function makeMaturityTasks(inv, t, lang) {
  const maturity = toDate(inv.matures_on);
  if (!maturity || inv.closed_on) return [];
  const now = new Date();
  const ids = [];
  const soon = atReminderTime(addDays(maturity, -MATURITY_NOTICE_DAYS));
  const onDay = atReminderTime(maturity);
  const date = `${formatShortDate(maturity, lang)} ${maturity.getFullYear()}`;
  if (soon > now) {
    const task = await createTask({ title: t('maturesSoonTask', { name: inv.name, date }).slice(0, 200), due_at: soon.toISOString(), priority: 'medium', ball: 'glass' });
    ids.push(task.id);
  }
  if (onDay > now) {
    const task = await createTask({ title: t('maturesTodayTask', { name: inv.name }).slice(0, 200), due_at: onDay.toISOString(), priority: 'high', ball: 'glass' });
    ids.push(task.id);
  }
  return ids;
}

export async function removeTasks(ids) {
  for (const id of ids || []) {
    try {
      await deleteTask(id);
    } catch {
      // already gone
    }
  }
}

// What one month costs: EMI, or the interest for interest-only loans
export function monthlyDue(loan) {
  if (loan.style === 'emi') return Number(loan.emi) || emiFor(loan.principal, loan.rate, loan.tenure_months);
  if (loan.style === 'interest_only') return Math.round((Number(loan.principal) * Number(loan.rate || 0)) / 1200);
  return null;
}

// Monthly "pay" reminder for a loan → routine id
export async function makeLoanReminder(loan, t, lang) {
  if (!['emi', 'interest_only', 'manual'].includes(loan.style) || loan.closed_on) return null;
  const start = toDate(loan.started_on);
  const day = Number(loan.emi_day) || start.getDate();
  // Next due day from today
  const today = new Date();
  let first = new Date(today.getFullYear(), today.getMonth(), Math.min(day, new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()));
  if (first < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
    first = new Date(today.getFullYear(), today.getMonth() + 1, Math.min(day, new Date(today.getFullYear(), today.getMonth() + 2, 0).getDate()));
  }
  const name = `${typeName(loanType(loan.type), lang)} (${loan.name})`;
  const due = monthlyDue(loan);
  const amount = due ? formatMoney(due, lang, { whole: true }) : '';
  const key = loan.style === 'interest_only' ? 'loanInterestReminder' : due ? 'loanEmiReminder' : 'loanPayReminder';
  const [routine] = await createRoutines([
    {
      kind: 'repeat',
      title: t(key, { loan: name, amount }).slice(0, 200),
      emoji: '🏦',
      time_of_day: REMINDER_TIME,
      repeat: 'monthly',
      start_date: toDateInput(first),
      priority: 'high',
      ball: 'glass',
    },
  ]);
  return routine?.id || null;
}

export async function stopReminder(routineId) {
  if (!routineId) return;
  try {
    await stopRoutine(routineId);
  } catch {
    // already stopped
  }
}

// "📈 Update investment values" on the 1st of every month
export async function makeValueReminder(t) {
  const today = new Date();
  const first = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const [routine] = await createRoutines([
    {
      kind: 'repeat',
      title: t('valueReminderTask').slice(0, 200),
      emoji: '📈',
      time_of_day: REMINDER_TIME,
      repeat: 'monthly',
      start_date: toDateInput(first),
      priority: 'low',
      ball: 'rubber',
    },
  ]);
  return routine?.id || null;
}
