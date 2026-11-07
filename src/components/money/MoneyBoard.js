'use client';

// ============================================================
// 💰 MONEY PAGE (/money)
//
//   ‹ November 2026 ›                        👁️ hide amounts
//   Income ₹35,000 · Spent ₹9,300 · Balance ₹25,700
//   Budget ██████░░░░ 62% 🟢 · Safe to spend ₹814 a day
//   [ Type: tea 20 · petrol 500 upi … ]  ← smart add
//   [ − Expense ]  [ + Income ]
//   ⭐ Tea ₹20 · Bus ₹15  ← one tap saves
//   🔍 search + filters
//   Today · spent ₹640
//     ☕ Tea   ₹20  💵 8:15 am …
//
// Numbers: src/lib/money.js · Smart add: src/lib/moneyParse.js
// ============================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import { PAY_MODES } from '@/data/money';
import { addDays, formatDayLabel, formatTime, toDateInput } from '@/lib/dates';
import {
  announceMoneyChange,
  budgetStatus,
  categoriesFor,
  categoryName,
  createMoneyEntry,
  deleteMoneyEntry,
  describeEntry,
  fetchMoneyEntries,
  fetchRecentEntries,
  findMode,
  formatMoney,
  frequentEntries,
  modeName,
  moneyErrorKey,
  moneyPeriod,
  moneyTotals,
  periodLabel,
  restoreMoneyEntry,
  updateMoneyEntry,
} from '@/lib/money';
import { calcAmount, parseMoneyText } from '@/lib/moneyParse';
import { usePreferences } from '../Preferences';
import { ChevronIcon, EyeIcon, EyeOffIcon, PlusIcon } from '../Icons';
import { useSettings } from '../routine/useSettings';
import UndoToast from '../tasks/UndoToast';
import AmountInput from './AmountInput';
import MoneyForm from './MoneyForm';
import { useMoneyCategories } from './useMoneyCategories';
import { useMoneyHidden } from './useMoneyHidden';

export default function MoneyBoard() {
  const { t, lang } = usePreferences();
  const { settings, update: updateSettings } = useSettings();
  const own = useMoneyCategories();
  const [hidden, toggleHidden] = useMoneyHidden(settings);

  const [now, setNow] = useState(null);
  const [anchor, setAnchor] = useState(null); // any day inside the shown month
  const [entries, setEntries] = useState(null); // null = loading
  const [recent, setRecent] = useState([]);
  const [loadErrorKey, setLoadErrorKey] = useState(null);
  const [errorKey, setErrorKey] = useState(null);
  const [form, setForm] = useState(null); // { entry } or { initial }
  const [undo, setUndo] = useState(null); // { text, run }
  const [filters, setFilters] = useState({ q: '', kind: 'all', category: '', mode: '' });

  useEffect(() => {
    const today = new Date();
    setNow(today);
    setAnchor(today);
  }, []);

  const startDay = settings?.money_month_start || 1;
  const period = useMemo(() => (anchor ? moneyPeriod(anchor, startDay) : null), [anchor, startDay]);

  const reload = useCallback(async () => {
    if (!period) return;
    try {
      const [list, lately] = await Promise.all([fetchMoneyEntries(period.from, period.to), fetchRecentEntries()]);
      setEntries(list);
      setRecent(lately);
      setLoadErrorKey(null);
    } catch (error) {
      setEntries((current) => current || []);
      setLoadErrorKey(moneyErrorKey(error) === 'errMoneyNotReady' ? 'errMoneyNotReady' : 'errLoadMoney');
    }
  }, [period]);

  useEffect(() => {
    reload();
  }, [reload]);

  // ----- Saving -----
  async function save(fields, existing) {
    setErrorKey(null);
    try {
      if (existing) await updateMoneyEntry(existing.id, fields);
      else await createMoneyEntry(fields);
      await reload();
      announceMoneyChange();
      return true;
    } catch (error) {
      setErrorKey(moneyErrorKey(error));
      return false;
    }
  }

  async function remove(entry) {
    setForm(null);
    setErrorKey(null);
    try {
      await deleteMoneyEntry(entry.id);
      setUndo({ text: t('moneyDeleted'), run: () => restoreMoneyEntry(entry.id) });
      await reload();
      announceMoneyChange();
    } catch (error) {
      setErrorKey(moneyErrorKey(error));
    }
  }

  // Quick save (smart add, ⭐ frequent) — with Undo
  async function quickSave(fields) {
    setErrorKey(null);
    try {
      const created = await createMoneyEntry({ ...fields, spent_at: new Date().toISOString() });
      const { emoji, title } = describeEntry(created, own.byId, lang);
      setUndo({ text: t('moneySaved', { what: `${emoji} ${title} ${formatMoney(created.amount, lang)}` }), run: () => deleteMoneyEntry(created.id) });
      await reload();
      announceMoneyChange();
      return true;
    } catch (error) {
      setErrorKey(moneyErrorKey(error));
      return false;
    }
  }

  async function runUndo() {
    const action = undo;
    setUndo(null);
    try {
      await action.run();
      await reload();
      announceMoneyChange();
    } catch (error) {
      setErrorKey(moneyErrorKey(error));
    }
  }
  const hideUndo = useCallback(() => setUndo(null), []);

  async function addOwnCategory(fields) {
    try {
      return await own.add(fields);
    } catch (error) {
      setErrorKey(moneyErrorKey(error));
      return null;
    }
  }

  // ----- Numbers for the month -----
  const totals = useMemo(() => moneyTotals(entries || []), [entries]);
  const status = period && now ? budgetStatus(settings?.money_budget, totals.spent, period, now) : null;
  const frequent = useMemo(() => frequentEntries(recent), [recent]);

  // ----- Filters + days -----
  const shown = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return (entries || []).filter((e) => {
      if (filters.kind !== 'all' && e.kind !== filters.kind) return false;
      if (filters.mode && e.pay_mode !== filters.mode) return false;
      if (filters.category) {
        const value = e.category === 'custom' ? `custom:${e.custom_category_id}` : `${e.kind}:${e.category}`;
        if (value !== filters.category) return false;
      }
      if (q) {
        const { title, group } = describeEntry(e, own.byId, lang);
        if (![title, group, e.note || '', String(e.amount)].some((text) => text.toLowerCase().includes(q))) return false;
      }
      return true;
    });
  }, [entries, filters, own.byId, lang]);

  const days = useMemo(() => {
    const groups = new Map();
    const newestFirst = [...shown].sort((a, b) => new Date(b.spent_at) - new Date(a.spent_at));
    for (const e of newestFirst) {
      const key = toDateInput(e.spent_at);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(e);
    }
    return [...groups.entries()].map(([key, list]) => ({ key, date: new Date(`${key}T00:00`), list, totals: moneyTotals(list) }));
  }, [shown]);

  if (!period || !now || !settings || entries === null) {
    return (
      <div className="today-board">
        <p className="loading-text" role="status">
          {t('loadingMoney')}
        </p>
      </div>
    );
  }

  const money = (amount, sign = '') => formatMoney(amount, lang, { hidden, sign });
  const isCurrent = period.from <= now && now < period.to;
  const anyFilter = filters.q || filters.kind !== 'all' || filters.category || filters.mode;

  return (
    <div className="today-board money-board">
      <div className="page-head">
        <h1>💰 {t('navMoney')}</h1>
        <button
          type="button"
          className="icon-round"
          aria-pressed={hidden}
          aria-label={hidden ? t('showAmounts') : t('hideAmounts')}
          title={hidden ? t('showAmounts') : t('hideAmounts')}
          onClick={toggleHidden}
        >
          {hidden ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>

      {(loadErrorKey || errorKey) && (
        <div className="form-alert error" role="alert">
          {t(loadErrorKey || errorKey)}
        </div>
      )}

      {/* ----- Month ----- */}
      <section className="card report-period">
        <button type="button" className="icon-round" aria-label={t('prevPeriod')} onClick={() => setAnchor(addDays(period.from, -1))}>
          <ChevronIcon className="chev-left" />
        </button>
        <div className="report-period-text">
          {isCurrent && <span className="report-period-now">{t('thisMonth')}</span>}
          <h2>{periodLabel(period, startDay, lang)}</h2>
        </div>
        <button type="button" className="icon-round" aria-label={t('nextPeriod')} onClick={() => setAnchor(period.to)} disabled={isCurrent}>
          <ChevronIcon className="chev-right" />
        </button>
      </section>

      {/* ----- Totals + budget ----- */}
      <section className="card money-summary">
        <div className="money-totals">
          <div>
            <span>{t('income')}</span>
            <strong className="income">{money(totals.income)}</strong>
          </div>
          <div>
            <span>{t('spent')}</span>
            <strong className="expense">{money(totals.spent)}</strong>
          </div>
          {totals.saved > 0 && (
            <div>
              <span>{t('saved')}</span>
              <strong className="saved">{money(totals.saved)}</strong>
            </div>
          )}
          <div>
            <span>{t('balance')}</span>
            <strong>{money(totals.balance, totals.balance < 0 ? '−' : '')}</strong>
          </div>
        </div>
        <BudgetBox status={status} settings={settings} hidden={hidden} onSave={updateSettings} onError={setErrorKey} />
      </section>

      {/* ----- Smart add ----- */}
      <SmartAdd defaultMode={settings.money_default_mode} hidden={hidden} customById={own.byId} onSave={quickSave} />

      {/* ----- Big buttons ----- */}
      <div className="money-buttons">
        <button type="button" className="money-btn expense" onClick={() => setForm({ initial: { kind: 'expense' } })}>
          − {t('expense')}
        </button>
        <button type="button" className="money-btn income" onClick={() => setForm({ initial: { kind: 'income' } })}>
          + {t('income')}
        </button>
      </div>

      {/* ----- ⭐ Frequent ----- */}
      {frequent.length > 0 && (
        <div className="money-frequent" aria-label={t('frequent')}>
          <span className="money-frequent-label">⭐ {t('frequent')}</span>
          {frequent.map((e, i) => {
            const { emoji, title } = describeEntry(e, own.byId, lang);
            return (
              <button
                key={i}
                type="button"
                className="chip"
                onClick={() =>
                  quickSave({
                    kind: e.kind,
                    amount: Number(e.amount),
                    category: e.category,
                    item: e.item,
                    custom_category_id: e.custom_category_id,
                    pay_mode: e.pay_mode,
                  })
                }
              >
                {emoji} {title} {money(e.amount)}
              </button>
            );
          })}
        </div>
      )}

      {/* ----- Search + filters ----- */}
      {(entries.length > 0 || anyFilter) && (
        <div className="money-filters">
          <input
            type="search"
            className="chip-input money-search"
            placeholder={t('searchMoney')}
            aria-label={t('searchMoney')}
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
          />
          <select className="chip-input" aria-label={t('moneyKind')} value={filters.kind} onChange={(e) => setFilters((f) => ({ ...f, kind: e.target.value }))}>
            <option value="all">{t('allMoney')}</option>
            <option value="expense">{t('expense')}</option>
            <option value="income">{t('income')}</option>
          </select>
          <select className="chip-input" aria-label={t('categoryLabel')} value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}>
            <option value="">{t('allCategories')}</option>
            {['expense', 'income'].map((kind) => (
              <optgroup key={kind} label={t(kind)}>
                {categoriesFor(kind).map((c) => (
                  <option key={c.key} value={`${kind}:${c.key}`}>
                    {c.emoji} {categoryName(c, lang)}
                  </option>
                ))}
                {own.categories
                  .filter((c) => c.kind === kind)
                  .map((c) => (
                    <option key={c.id} value={`custom:${c.id}`}>
                      {c.emoji} {c.name}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
          <select className="chip-input" aria-label={t('paidBy')} value={filters.mode} onChange={(e) => setFilters((f) => ({ ...f, mode: e.target.value }))}>
            <option value="">{t('allModes')}</option>
            {PAY_MODES.map((m) => (
              <option key={m.key} value={m.key}>
                {m.emoji} {modeName(m, lang)}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ----- Day by day ----- */}
      {days.length === 0 ? (
        <p className="empty-state">{anyFilter ? t('noMoneyMatch') : t('noMoneyYet')}</p>
      ) : (
        days.map((day) => (
          <section key={day.key} className="task-section">
            <div className="section-head">
              <h2 className="section-title">{formatDayLabel(day.date, lang, t)}</h2>
              <span className="money-day-totals">
                {day.totals.spent + day.totals.saved > 0 && <span className="expense">{money(day.totals.spent + day.totals.saved, '−')}</span>}
                {day.totals.income > 0 && <span className="income">{money(day.totals.income, '+')}</span>}
              </span>
            </div>
            <ul className="money-list">
              {day.list.map((e) => (
                <MoneyRow key={e.id} entry={e} customById={own.byId} hidden={hidden} onOpen={() => setForm({ entry: e })} />
              ))}
            </ul>
          </section>
        ))
      )}

      {form && (
        <MoneyForm
          key={form.entry?.id || 'new'}
          entry={form.entry}
          initial={form.initial}
          customCategories={own.categories}
          onAddCategory={addOwnCategory}
          defaultMode={settings.money_default_mode}
          onSave={save}
          onDelete={remove}
          onClose={() => setForm(null)}
        />
      )}

      {undo && <UndoToast key={undo.text} text={undo.text} onUndo={runUndo} onDone={hideUndo} />}
    </div>
  );
}

// ------------------------------------------------------------
// One money line
// ------------------------------------------------------------
export function MoneyRow({ entry, customById, hidden, onOpen }) {
  const { lang } = usePreferences();
  const { emoji, title, group } = describeEntry(entry, customById, lang);
  const mode = findMode(entry.pay_mode);
  const sign = entry.kind === 'income' ? '+' : '−';

  return (
    <li className={`money-row ${entry.kind}`}>
      <button type="button" className="money-row-body" onClick={onOpen}>
        <span className="money-emoji" aria-hidden="true">
          {emoji}
        </span>
        <span className="money-main">
          <span className="money-title">{title}</span>
          <span className="money-meta">
            {title !== group && <span>{group}</span>}
            {mode && (
              <span>
                {mode.emoji} {modeName(mode, lang)}
              </span>
            )}
            <span>{formatTime(entry.spent_at, lang)}</span>
            {entry.note && <span className="money-note-text">{entry.note}</span>}
          </span>
        </span>
        <span className="money-amount">{formatMoney(entry.amount, lang, { hidden, sign })}</span>
      </button>
    </li>
  );
}

// ------------------------------------------------------------
// Budget: bar with colour, safe to spend per day, or "Set a budget"
// ------------------------------------------------------------
function BudgetBox({ status, settings, hidden, onSave, onError }) {
  const { t, lang } = usePreferences();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(settings.money_budget ? String(Number(settings.money_budget)) : '');
  const [busy, setBusy] = useState(false);
  const money = (amount) => formatMoney(amount, lang, { hidden });
  const amount = calcAmount(value);

  async function save(budget) {
    setBusy(true);
    onError(null);
    try {
      await onSave({ money_budget: budget });
      setEditing(false);
    } catch (error) {
      onError(moneyErrorKey(error));
    }
    setBusy(false);
  }

  if (editing) {
    return (
      <div className="money-budget-edit">
        <span className="field-group-label">{t('monthlyBudget')}</span>
        <AmountInput id="money-budget" value={value} onChange={setValue} autoFocus />
        <div className="edit-panel-actions">
          {settings.money_budget && (
            <button type="button" className="ghost-btn small" onClick={() => save(null)} disabled={busy}>
              {t('removeBudget')}
            </button>
          )}
          <span className="spacer" />
          <button type="button" className="ghost-btn small" onClick={() => setEditing(false)}>
            {t('cancel')}
          </button>
          <button type="button" className="save-btn small" onClick={() => save(amount)} disabled={amount === null || busy}>
            {t('saveTask')}
          </button>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <button type="button" className="ghost-btn small money-set-budget" onClick={() => setEditing(true)}>
        🎯 {t('setBudget')}
      </button>
    );
  }

  const dot = { green: '🟢', yellow: '🟡', red: '🔴' }[status.colour];
  return (
    <div className={`money-budget colour-${status.colour}`}>
      <div className="money-budget-row">
        <span>
          {dot} {t('budgetUsed', { pct: status.pct, budget: money(status.budget) })}
        </span>
        <button type="button" className="text-link" onClick={() => setEditing(true)}>
          {t('change')}
        </button>
      </div>
      <div className="money-bar" aria-hidden="true">
        <span style={{ width: `${Math.min(100, status.pct)}%` }} />
      </div>
      {status.current &&
        (status.left >= 0 ? (
          <p className="money-budget-note">{t('safeToSpend', { amount: money(status.perDay), days: status.daysLeft })}</p>
        ) : (
          <p className="money-budget-note">{t('overBudgetBy', { amount: money(-status.left) })}</p>
        ))}
    </div>
  );
}

// ------------------------------------------------------------
// Smart add: "tea 20", "petrol 500 upi", "salary 35000"
// Shows what will be saved before you press Add.
// ------------------------------------------------------------
function SmartAdd({ defaultMode, hidden, customById, onSave }) {
  const { t, lang } = usePreferences();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const parsed = text.trim() ? parseMoneyText(text) : null;
  const payMode = parsed?.payMode || defaultMode || null;

  async function submit(e) {
    e.preventDefault();
    if (!parsed?.amount) return;
    setBusy(true);
    const ok = await onSave({
      kind: parsed.kind,
      amount: parsed.amount,
      category: parsed.category,
      item: parsed.item,
      pay_mode: payMode,
      note: parsed.note,
    });
    setBusy(false);
    if (ok) setText('');
  }

  let preview = null;
  if (parsed) {
    if (!parsed.amount) preview = <span className="money-preview-hint">{t('smartAddNeedAmount')}</span>;
    else {
      const { emoji, title } = describeEntry({ kind: parsed.kind, category: parsed.category, item: parsed.item }, customById, lang);
      const mode = findMode(payMode);
      preview = (
        <span className={`money-preview-line ${parsed.kind}`}>
          → {emoji} {title} · {formatMoney(parsed.amount, lang, { hidden, sign: parsed.kind === 'income' ? '+' : '−' })}
          {mode && ` · ${mode.emoji} ${modeName(mode, lang)}`}
          {parsed.note && ` · “${parsed.note}”`}
        </span>
      );
    }
  }

  return (
    <form className="card money-smart" onSubmit={submit}>
      <div className="money-smart-row">
        <span aria-hidden="true">⚡</span>
        <input
          className="money-smart-input"
          placeholder={t('smartAddPlaceholder')}
          aria-label={t('smartAddLabel')}
          maxLength={120}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" className="save-btn small" disabled={!parsed?.amount || busy}>
          <PlusIcon /> {t('add')}
        </button>
      </div>
      {preview && (
        <p className="money-preview" role="status">
          {preview}
        </p>
      )}
    </form>
  );
}
