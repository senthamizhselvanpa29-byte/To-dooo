'use client';

// ============================================================
// ADD / CHANGE MONEY — the panel that slides in.
//
//   [ − Expense ] [ + Income ]
//   ₹ 120          (calculator: 120+45 works)
//   🍛 Food  ☕ Tea  🛒 Groceries … ➕ My own
//   Quick: Breakfast · Lunch · Dinner
//   Paid by: 💵 Cash 📱 UPI 💳 Card 🏦 Bank
//   When: today, now (tap to change) · Note
//
// 3 taps: amount → category → Save. Everything else is optional.
// ============================================================

import { useEffect, useState } from 'react';
import { CUSTOM_EMOJIS, PAY_MODES } from '@/data/money';
import { combineDateTime, toDateInput, toTimeInput } from '@/lib/dates';
import { categoriesFor, categoryName, findCategory, itemName, modeName } from '@/lib/money';
import { calcAmount } from '@/lib/moneyParse';
import { usePreferences } from '../Preferences';
import { PlusIcon, TrashIcon, XIcon } from '../Icons';
import { Chip } from '../tasks/TaskFields';
import AmountInput from './AmountInput';

// Saved entry or starting values → what the form shows
function startValues(entry, initial, defaultMode) {
  const source = entry || initial || {};
  const when = entry ? new Date(entry.spent_at) : new Date();
  let category = source.category || '';
  if (category === 'custom') category = source.custom_category_id ? `custom:${source.custom_category_id}` : '';
  return {
    kind: source.kind || 'expense',
    amount: source.amount ? String(Number(source.amount)) : '',
    category,
    item: source.item || null,
    payMode: entry ? entry.pay_mode : (source.pay_mode ?? defaultMode ?? null),
    date: toDateInput(when),
    time: toTimeInput(when),
    note: source.note || '',
  };
}

export default function MoneyForm({ entry, initial, customCategories, onAddCategory, defaultMode, investments, onSave, onDelete, onClose }) {
  const { t, lang } = usePreferences();
  const [form, setForm] = useState(() => startValues(entry, initial, defaultMode));
  const [busy, setBusy] = useState(false);
  const [addingOwn, setAddingOwn] = useState(false);
  const set = (changes) => setForm((f) => ({ ...f, ...changes }));

  // Close with Escape
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const amount = calcAmount(form.amount);
  const when = combineDateTime(form.date, form.time);
  const builtIn = categoriesFor(form.kind);
  const own = (customCategories || []).filter((c) => c.kind === form.kind);
  const selected = form.category.startsWith('custom:') ? null : findCategory(form.kind, form.category);
  const canSave = amount !== null && Boolean(form.category) && when !== null && !busy;

  let hint = null;
  if (amount === null) hint = t('enterAmount');
  else if (!form.category) hint = t('chooseCategory');

  // Expense ↔ income: the category list changes
  function switchKind(kind) {
    if (kind === form.kind) return;
    set({ kind, category: '', item: null });
  }

  function chooseCategory(value) {
    set({ category: value, item: null });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSave) return;
    const custom = form.category.startsWith('custom:');
    setBusy(true);
    const ok = await onSave(
      {
        kind: form.kind,
        amount,
        category: custom ? 'custom' : form.category,
        item: custom ? null : form.item,
        custom_category_id: custom ? form.category.slice(7) : null,
        pay_mode: form.payMode || null,
        spent_at: when.toISOString(),
        note: form.note.trim() || null,
        ...(initial?.task_id ? { task_id: initial.task_id } : {}),
      },
      entry,
      { investmentId: !entry && form.category === 'savings' ? form.investmentId : null }
    );
    setBusy(false);
    if (ok) onClose();
  }

  const title = entry ? t('editMoney') : form.kind === 'income' ? t('addIncome') : t('addExpense');

  return (
    <div className="panel-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form
        className={`edit-panel money-panel ${form.kind}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="money-form-title"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="edit-panel-head">
          <h2 id="money-form-title">{title}</h2>
          <button type="button" className="icon-round" aria-label={t('close')} onClick={onClose}>
            <XIcon />
          </button>
        </div>

        {/* ----- Expense or income ----- */}
        <div className="segmented money-kind" role="radiogroup" aria-label={t('moneyKind')}>
          <button type="button" role="radio" className="expense" aria-checked={form.kind === 'expense'} onClick={() => switchKind('expense')}>
            − {t('expense')}
          </button>
          <button type="button" role="radio" className="income" aria-checked={form.kind === 'income'} onClick={() => switchKind('income')}>
            + {t('income')}
          </button>
        </div>

        {/* ----- 1. Amount ----- */}
        <AmountInput id="money-amount" value={form.amount} onChange={(v) => set({ amount: v })} autoFocus={!entry} />

        {/* ----- 2. Category ----- */}
        <div className="field-group">
          <span className="field-group-label">{t('categoryLabel')}</span>
          <div className="category-grid" role="radiogroup" aria-label={t('categoryLabel')}>
            {builtIn.map((c) => (
              <button
                key={c.key}
                type="button"
                role="radio"
                aria-checked={form.category === c.key}
                className="category-tile"
                onClick={() => chooseCategory(c.key)}
              >
                <span className="category-emoji" aria-hidden="true">
                  {c.emoji}
                </span>
                <span className="category-name">{categoryName(c, lang)}</span>
              </button>
            ))}
            {own.map((c) => (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={form.category === `custom:${c.id}`}
                className="category-tile own"
                onClick={() => chooseCategory(`custom:${c.id}`)}
              >
                <span className="category-emoji" aria-hidden="true">
                  {c.emoji || '🏷️'}
                </span>
                <span className="category-name">{c.name}</span>
              </button>
            ))}
            {onAddCategory && (
              <button type="button" className="category-tile add" aria-expanded={addingOwn} onClick={() => setAddingOwn((v) => !v)}>
                <span className="category-emoji" aria-hidden="true">
                  ➕
                </span>
                <span className="category-name">{t('myOwnCategory')}</span>
              </button>
            )}
          </div>
          {addingOwn && (
            <OwnCategoryForm
              kind={form.kind}
              onAdd={async (fields) => {
                const created = await onAddCategory(fields);
                if (created) {
                  chooseCategory(`custom:${created.id}`);
                  setAddingOwn(false);
                }
              }}
            />
          )}
        </div>

        {/* ----- Quick choices for the category ----- */}
        {selected?.items?.length > 0 && (
          <div className="field-group">
            <span className="field-group-label">{t('quickChoices')}</span>
            <div className="chip-row">
              {selected.items.map((item) => (
                <Chip key={item.key} active={form.item === item.key} onClick={() => set({ item: form.item === item.key ? null : item.key })}>
                  {itemName(item, lang)}
                </Chip>
              ))}
            </div>
          </div>
        )}

        {/* ----- Savings → also into one of my investments (Portfolio) ----- */}
        {!entry && form.kind === 'expense' && form.category === 'savings' && investments?.length > 0 && (
          <label className="field-group">
            <span className="field-group-label">📈 {t('addToInvestment')}</span>
            <select className="chip-input" value={form.investmentId || ''} onChange={(e) => set({ investmentId: e.target.value || null })}>
              <option value="">{t('noInvestmentLink')}</option>
              {investments.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {/* ----- Paid by (optional) ----- */}
        <div className="field-group">
          <span className="field-group-label">{form.kind === 'income' ? t('receivedBy') : t('paidBy')}</span>
          <div className="chip-row" role="radiogroup" aria-label={t('paidBy')}>
            {PAY_MODES.map((m) => (
              <Chip key={m.key} role="radio" active={form.payMode === m.key} onClick={() => set({ payMode: form.payMode === m.key ? null : m.key })}>
                {m.emoji} {modeName(m, lang)}
              </Chip>
            ))}
          </div>
        </div>

        {/* ----- When (starts at "now") ----- */}
        <div className="field-group">
          <span className="field-group-label">{t('whenLabel')}</span>
          <div className="chip-row">
            <input type="date" className="chip-input" aria-label={t('dateLabel')} value={form.date} onChange={(e) => set({ date: e.target.value })} />
            <input
              type="time"
              step="60"
              className={`chip-input${!form.time ? ' missing' : ''}`}
              aria-label={t('timeLabel')}
              value={form.time}
              onChange={(e) => set({ time: e.target.value })}
            />
          </div>
        </div>

        {/* ----- Note ----- */}
        <label className="field-group">
          <span className="field-group-label">{t('noteLabel')}</span>
          <input
            className="chip-input money-note"
            maxLength={300}
            placeholder={t('moneyNotePlaceholder')}
            value={form.note}
            onChange={(e) => set({ note: e.target.value })}
          />
        </label>

        {hint && (
          <p className="form-hint" role="status">
            {hint}
          </p>
        )}

        <div className="edit-panel-actions">
          {entry && onDelete && (
            <button type="button" className="delete-btn" onClick={() => onDelete(entry)}>
              <TrashIcon /> {t('deleteTask')}
            </button>
          )}
          <span className="spacer" />
          <button type="button" className="ghost-btn" onClick={onClose}>
            {t('cancel')}
          </button>
          <button type="submit" className="save-btn" disabled={!canSave}>
            {t('saveTask')}
          </button>
        </div>
      </form>
    </div>
  );
}

// ➕ My own category: pick an emoji, type a name (also used in Settings)
export function OwnCategoryForm({ kind, onAdd }) {
  const { t } = usePreferences();
  const [emoji, setEmoji] = useState(CUSTOM_EMOJIS[0]);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!name.trim()) return;
    setBusy(true);
    await onAdd({ kind, name: name.trim(), emoji });
    setBusy(false);
  }

  return (
    <div className="own-category-form">
      <div className="chip-row" role="radiogroup" aria-label={t('chooseEmoji')}>
        {CUSTOM_EMOJIS.map((e) => (
          <Chip key={e} role="radio" className="emoji-chip" active={emoji === e} onClick={() => setEmoji(e)}>
            {e}
          </Chip>
        ))}
      </div>
      <div className="step-add">
        <input
          className="step-add-title"
          placeholder={t('ownCategoryPlaceholder')}
          aria-label={t('ownCategoryPlaceholder')}
          maxLength={40}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
        />
        <button type="button" className="save-btn small" onClick={add} disabled={!name.trim() || busy}>
          <PlusIcon /> {t('addCategory')}
        </button>
      </div>
    </div>
  );
}
