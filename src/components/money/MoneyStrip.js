'use client';

// ============================================================
// 💰 MONEY ON TODAY — a small box under "Plan tomorrow"
//   💰 Today: Spent ₹640 · Earned ₹0                 [+ Add]
//   🟢 This month: ₹5,700 left of ₹15,000
//   ⚠️ Budget 85% used — 7 days left   (when 80% or more is used)
// Can be hidden in Settings → Money ("Show money on Today").
// ============================================================

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { addDays, startOfDay } from '@/lib/dates';
import {
  BUDGET_YELLOW_FROM,
  budgetStatus,
  createMoneyEntry,
  fetchMoneyEntries,
  formatMoney,
  MONEY_CHANGED,
  moneyErrorKey,
  moneyPeriod,
  moneyTotals,
  announceMoneyChange,
} from '@/lib/money';
import { usePreferences } from '../Preferences';
import { EyeIcon, EyeOffIcon, PlusIcon } from '../Icons';
import MoneyForm from './MoneyForm';
import { useMoneyCategories } from './useMoneyCategories';
import { useMoneyHidden } from './useMoneyHidden';

export default function MoneyStrip({ settings }) {
  const { t, lang } = usePreferences();
  const [hidden, toggleHidden] = useMoneyHidden(settings);
  const own = useMoneyCategories();
  const [entries, setEntries] = useState(null);
  const [available, setAvailable] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [errorKey, setErrorKey] = useState(null);

  const startDay = settings?.money_month_start || 1;

  const reload = useCallback(async () => {
    const { from, to } = moneyPeriod(new Date(), startDay);
    try {
      setEntries(await fetchMoneyEntries(from, to));
      setAvailable(true);
    } catch {
      setAvailable(false);
    }
  }, [startDay]);

  useEffect(() => {
    reload();
    window.addEventListener(MONEY_CHANGED, reload);
    return () => window.removeEventListener(MONEY_CHANGED, reload);
  }, [reload]);

  if (!settings || settings.money_on_today === false || !available || entries === null) return null;

  const now = new Date();
  const today = startOfDay(now);
  const todayTotals = moneyTotals(entries.filter((e) => new Date(e.spent_at) >= today && new Date(e.spent_at) < addDays(today, 1)));
  const month = moneyTotals(entries);
  const status = budgetStatus(settings.money_budget, month.spent, moneyPeriod(now, startDay), now);
  const money = (amount) => formatMoney(amount, lang, { hidden });
  const dot = status && { green: '🟢', yellow: '🟡', red: '🔴' }[status.colour];

  async function save(fields) {
    setErrorKey(null);
    try {
      await createMoneyEntry(fields);
      announceMoneyChange();
      return true;
    } catch (error) {
      setErrorKey(moneyErrorKey(error));
      return false;
    }
  }

  async function addOwnCategory(fields) {
    try {
      return await own.add(fields);
    } catch (error) {
      setErrorKey(moneyErrorKey(error));
      return null;
    }
  }

  return (
    <section className="card money-strip">
      <div className="money-strip-head">
        <Link href="/money" className="money-strip-title">
          💰 {t('moneyToday')}
        </Link>
        <button
          type="button"
          className="icon-round small"
          aria-pressed={hidden}
          aria-label={hidden ? t('showAmounts') : t('hideAmounts')}
          onClick={toggleHidden}
        >
          {hidden ? <EyeOffIcon /> : <EyeIcon />}
        </button>
        <span className="spacer" />
        <button type="button" className="save-btn small" onClick={() => setFormOpen(true)}>
          <PlusIcon /> {t('add')}
        </button>
      </div>

      <p className="money-strip-line">
        {t('spentToday')} <strong className="expense">{money(todayTotals.spent + todayTotals.saved)}</strong>
        {' · '}
        {t('earnedToday')} <strong className="income">{money(todayTotals.income)}</strong>
      </p>

      {status ? (
        <p className={`money-strip-budget colour-${status.colour}`}>
          {dot}{' '}
          {status.left >= 0
            ? t('monthLeft', { left: money(status.left), budget: money(status.budget) })
            : t('overBudgetBy', { amount: money(-status.left) })}
        </p>
      ) : (
        <p className="money-strip-budget">{t('monthSpent', { amount: money(month.spent) })}</p>
      )}

      {status && settings.money_warnings !== false && status.pct >= BUDGET_YELLOW_FROM && status.left >= 0 && (
        <p className="money-warning" role="status">
          ⚠️ {t('budgetWarning', { pct: status.pct, days: status.daysLeft })}
        </p>
      )}

      {errorKey && (
        <p className="form-hint" role="alert">
          {t(errorKey)}
        </p>
      )}

      {formOpen && (
        <MoneyForm
          initial={{ kind: 'expense' }}
          customCategories={own.categories}
          onAddCategory={addOwnCategory}
          defaultMode={settings.money_default_mode}
          onSave={save}
          onClose={() => setFormOpen(false)}
        />
      )}
    </section>
  );
}
