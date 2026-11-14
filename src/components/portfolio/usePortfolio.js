'use client';

// ============================================================
// PORTFOLIO DATA + ACTIONS (used by the 📈 Portfolio tab)
//
// Loads investments, loans and their history, works out every number
// (src/lib/portfolio.js) and saves changes. Money in / out can also go
// into daily Money (Savings & Investment, Interest, EMI & Loans).
// ============================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import { startOfDay, toDateInput } from '@/lib/dates';
import { announceMoneyChange, createMoneyEntry, deleteMoneyEntry } from '@/lib/money';
import {
  createInvestment,
  createInvestmentTxn,
  createLoan,
  createLoanTxn,
  deleteInvestment,
  deleteInvestmentTxn,
  deleteLoan,
  deleteLoanTxn,
  fetchPortfolio,
  investmentStats,
  investmentType,
  loanStats,
  loanType,
  portfolioErrorKey,
  portfolioSummary,
  updateInvestment,
  updateLoan,
} from '@/lib/portfolio';
import { usePreferences } from '../Preferences';
import { makeLoanReminder, makeMaturityTasks, makeValueReminder, removeTasks, stopReminder } from './reminders';

// "2026-11-14" → when the Money entry happened (now if today, else noon)
function moneyTime(dateText) {
  const today = toDateInput(new Date());
  return dateText === today ? new Date().toISOString() : new Date(`${dateText}T12:00`).toISOString();
}

export function usePortfolio({ settings, updateSettings }) {
  const { t, lang } = usePreferences();
  const [data, setData] = useState(null); // null = loading
  const [available, setAvailable] = useState(true);
  const [errorKey, setErrorKey] = useState(null);
  const [now, setNow] = useState(() => new Date());

  const reload = useCallback(async () => {
    try {
      setData(await fetchPortfolio());
      setAvailable(true);
      setNow(new Date());
    } catch (error) {
      setData({ investments: [], investmentTxns: [], loans: [], loanTxns: [] });
      setAvailable(portfolioErrorKey(error) !== 'errPortfolioNotReady');
      if (portfolioErrorKey(error) !== 'errPortfolioNotReady') setErrorKey('errLoadPortfolio');
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  // ----- Numbers -----
  const rates = useMemo(() => ({ gold_rate: settings?.gold_rate, silver_rate: settings?.silver_rate }), [settings]);
  const computed = useMemo(() => {
    if (!data) return null;
    const today = startOfDay(now);
    const txnsOf = (list, key, id) => list.filter((x) => x[key] === id);
    const investments = data.investments.map((inv) => investmentStats(inv, txnsOf(data.investmentTxns, 'investment_id', inv.id), rates, today));
    const loans = data.loans.map((loan) => loanStats(loan, txnsOf(data.loanTxns, 'loan_id', loan.id), today));
    return { today, investments, loans, summary: portfolioSummary(investments, loans, today) };
  }, [data, rates, now]);

  // Every action: clear the error, run, reload; on failure show why
  const act = useCallback(
    async (work) => {
      setErrorKey(null);
      try {
        const result = await work();
        await reload();
        return result ?? true;
      } catch (error) {
        setErrorKey(portfolioErrorKey(error));
        return false;
      }
    },
    [reload]
  );

  // Daily Money entry for money moving in / out of an investment or loan
  async function moneyFor(fields) {
    const entry = await createMoneyEntry({ pay_mode: settings?.money_default_mode || null, ...fields });
    announceMoneyChange();
    return entry.id;
  }

  // ----- Investments -----
  const saveInvestment = (fields, existing, { alsoMoney } = {}) =>
    act(async () => {
      let inv;
      if (existing) {
        inv = await updateInvestment(existing.id, fields);
        // Maturity date changed → new reminders
        if ((existing.matures_on || null) !== (inv.matures_on || null) || existing.name !== inv.name) {
          await removeTasks(existing.reminder_task_ids);
          inv = await updateInvestment(inv.id, { reminder_task_ids: await makeMaturityTasks(inv, t, lang) });
        }
      } else {
        inv = await createInvestment(fields);
        const ids = await makeMaturityTasks(inv, t, lang);
        if (ids.length) inv = await updateInvestment(inv.id, { reminder_task_ids: ids });
        // Starting money also into today's daily Money (only when asked)
        if (alsoMoney && Number(inv.amount) > 0) {
          await moneyFor({ kind: 'expense', amount: Number(inv.amount), category: 'savings', item: investmentType(inv.type).money, spent_at: moneyTime(inv.started_on), note: inv.name });
        }
      }
      return inv;
    });

  const removeInvestment = (inv) =>
    act(async () => {
      await removeTasks(inv.reminder_task_ids);
      await deleteInvestment(inv.id);
    });

  // action: { kind: 'invest' | 'return' | 'withdraw' | 'value', amount, units, price, rate, on_date, alsoMoney, close }
  const addInvestmentTxn = (inv, action) =>
    act(async () => {
      const type = investmentType(inv.type);
      const changes = {};
      let money_entry_id = null;

      if (action.kind === 'value') {
        if (type.mode === 'metal' && action.rate) {
          // One rate for all your gold (or silver)
          await updateSettings({ [inv.type === 'gold' ? 'gold_rate' : 'silver_rate']: action.rate, metal_rate_on: action.on_date });
          return;
        }
        if (type.mode === 'units' && action.price !== null && action.price !== undefined) {
          changes.price = action.price;
          changes.value_on = action.on_date;
          await createInvestmentTxn({ investment_id: inv.id, kind: 'value', amount: Math.round(Number(inv.units || 0) * action.price * 100) / 100, price: action.price, on_date: action.on_date });
        } else {
          changes.value = action.amount;
          changes.value_on = action.on_date;
          await createInvestmentTxn({ investment_id: inv.id, kind: 'value', amount: action.amount, on_date: action.on_date });
        }
        await updateInvestment(inv.id, changes);
        return;
      }

      if (action.alsoMoney) {
        const fields =
          action.kind === 'invest'
            ? { kind: 'expense', category: 'savings', item: type.money }
            : action.kind === 'return'
              ? { kind: 'income', category: 'interest', item: null }
              : { kind: 'income', category: 'investret', item: null };
        money_entry_id = await moneyFor({ ...fields, amount: action.amount, spent_at: moneyTime(action.on_date), note: inv.name });
      }
      await createInvestmentTxn({
        investment_id: inv.id,
        kind: action.kind,
        amount: action.amount,
        units: action.units ?? null,
        on_date: action.on_date,
        money_entry_id,
      });
      // Units bought / sold
      if (action.units && (type.mode === 'units' || type.mode === 'metal')) {
        const units = Number(inv.units || 0) + (action.kind === 'invest' ? 1 : action.kind === 'withdraw' ? -1 : 0) * Number(action.units);
        changes.units = Math.max(0, Math.round(units * 1e6) / 1e6);
      }
      if (action.close) {
        changes.closed_on = action.on_date;
        await removeTasks(inv.reminder_task_ids);
        changes.reminder_task_ids = [];
      }
      if (Object.keys(changes).length) await updateInvestment(inv.id, changes);
    });

  // Removing a history line also removes its daily Money entry
  const removeInvestmentTxn = (txn) =>
    act(async () => {
      await deleteInvestmentTxn(txn.id);
      if (txn.money_entry_id) {
        await deleteMoneyEntry(txn.money_entry_id).catch(() => {});
        announceMoneyChange();
      }
    });

  const reopenInvestment = (inv) => act(() => updateInvestment(inv.id, { closed_on: null }));

  // ----- Loans -----
  const saveLoan = (fields, existing, { reminder } = {}) =>
    act(async () => {
      let loan = existing ? await updateLoan(existing.id, fields) : await createLoan(fields);
      const reminderChanged =
        !existing ||
        Boolean(existing.reminder_routine_id) !== Boolean(reminder) ||
        ['emi', 'emi_day', 'principal', 'rate', 'tenure_months', 'style', 'name', 'type'].some((k) => String(existing[k] ?? '') !== String(loan[k] ?? ''));
      if (reminderChanged) {
        await stopReminder(existing?.reminder_routine_id);
        const routineId = reminder ? await makeLoanReminder(loan, t, lang) : null;
        loan = await updateLoan(loan.id, { reminder_routine_id: routineId });
      }
      return loan;
    });

  const removeLoan = (loan) =>
    act(async () => {
      await stopReminder(loan.reminder_routine_id);
      await deleteLoan(loan.id);
    });

  // action: { kind: 'payment' | 'borrow' | 'balance', amount, on_date, alsoMoney }
  const addLoanTxn = (loan, action) =>
    act(async () => {
      let money_entry_id = null;
      if (action.kind === 'payment' && action.alsoMoney) {
        money_entry_id = await moneyFor({
          kind: 'expense',
          amount: action.amount,
          category: 'emi',
          item: loanType(loan.type).money,
          spent_at: moneyTime(action.on_date),
          note: loan.name,
        });
      }
      await createLoanTxn({ loan_id: loan.id, kind: action.kind, amount: action.amount, on_date: action.on_date, money_entry_id });
    });

  const removeLoanTxn = (txn) =>
    act(async () => {
      await deleteLoanTxn(txn.id);
      if (txn.money_entry_id) {
        await deleteMoneyEntry(txn.money_entry_id).catch(() => {});
        announceMoneyChange();
      }
    });

  const closeLoan = (loan, closed) =>
    act(async () => {
      if (closed) await stopReminder(loan.reminder_routine_id);
      await updateLoan(loan.id, { closed_on: closed ? toDateInput(new Date()) : null, ...(closed ? { reminder_routine_id: null } : {}) });
    });

  // ----- Settings: gold / silver rate, 80C, monthly reminder -----
  const saveRates = (rates) => act(() => updateSettings({ ...rates, metal_rate_on: toDateInput(new Date()) }));

  const setValueReminder = (on) =>
    act(async () => {
      if (on) await updateSettings({ value_reminder_id: await makeValueReminder(t) });
      else {
        await stopReminder(settings?.value_reminder_id);
        await updateSettings({ value_reminder_id: null });
      }
    });

  const setShow80c = (on) => act(() => updateSettings({ show_80c: on }));

  const txnsOfInvestment = (id) => (data?.investmentTxns || []).filter((x) => x.investment_id === id);
  const txnsOfLoan = (id) => (data?.loanTxns || []).filter((x) => x.loan_id === id);

  return {
    data,
    available,
    computed,
    errorKey,
    setErrorKey,
    reload,
    txnsOfInvestment,
    txnsOfLoan,
    saveInvestment,
    removeInvestment,
    addInvestmentTxn,
    removeInvestmentTxn,
    reopenInvestment,
    saveLoan,
    removeLoan,
    addLoanTxn,
    removeLoanTxn,
    closeLoan,
    saveRates,
    setValueReminder,
    setShow80c,
  };
}
