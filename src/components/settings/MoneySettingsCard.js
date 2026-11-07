'use client';

// ============================================================
// 💰 MONEY SETTINGS (on the Settings page)
//   🎯 Monthly budget · 📅 My month starts on (1st or salary day)
//   Default "paid by" · Show money on Today · Hide amounts when the
//   app opens · Budget warnings · My own categories (add / remove)
// ============================================================

import { useState } from 'react';
import { PAY_MODES } from '@/data/money';
import { deleteMoneyCategory, modeName, moneyErrorKey } from '@/lib/money';
import { calcAmount } from '@/lib/moneyParse';
import { usePreferences } from '../Preferences';
import { TrashIcon } from '../Icons';
import AmountInput from '../money/AmountInput';
import { OwnCategoryForm } from '../money/MoneyForm';
import { useMoneyCategories } from '../money/useMoneyCategories';
import { Chip } from '../tasks/TaskFields';

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export default function MoneySettingsCard({ settings, onSave, onError }) {
  const { t, lang } = usePreferences();
  const own = useMoneyCategories();
  const [budget, setBudget] = useState(settings.money_budget ? String(Number(settings.money_budget)) : '');
  const [startDay, setStartDay] = useState(settings.money_month_start || 1);
  const [mode, setMode] = useState(settings.money_default_mode || null);
  const [onToday, setOnToday] = useState(settings.money_on_today !== false);
  const [hide, setHide] = useState(Boolean(settings.money_hide));
  const [warnings, setWarnings] = useState(settings.money_warnings !== false);
  const [newKind, setNewKind] = useState('expense');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const budgetValue = budget.trim() ? calcAmount(budget) : null;
  const budgetInvalid = Boolean(budget.trim()) && budgetValue === null;
  const change = (setter) => (value) => {
    setter(value);
    setSaved(false);
  };

  async function save() {
    setBusy(true);
    onError(null);
    try {
      await onSave({
        money_budget: budgetValue,
        money_month_start: Number(startDay),
        money_default_mode: mode,
        money_on_today: onToday,
        money_hide: hide,
        money_warnings: warnings,
      });
      setSaved(true);
    } catch (error) {
      onError(moneyErrorKey(error));
    }
    setBusy(false);
  }

  async function removeCategory(category) {
    if (!window.confirm(t('deleteCategoryConfirm', { name: category.name }))) return;
    try {
      await deleteMoneyCategory(category.id);
      await own.reload();
    } catch (error) {
      onError(moneyErrorKey(error));
    }
  }

  async function addCategory(fields) {
    try {
      await own.add(fields);
    } catch (error) {
      onError(moneyErrorKey(error));
    }
  }

  return (
    <section className="card settings-card">
      <h2>💰 {t('moneySettings')}</h2>
      {!own.available && <p className="form-hint">{t('errMoneyNotReady')}</p>}

      <div className="settings-grid">
        <div className="field-group">
          <span className="field-group-label">🎯 {t('monthlyBudget')}</span>
          <AmountInput id="settings-budget" value={budget} onChange={change(setBudget)} invalid={budgetInvalid} />
          <span className="steps-hint">{t('budgetHint')}</span>
        </div>
        <label className="field-group">
          <span className="field-group-label">📅 {t('monthStartsOn')}</span>
          <select className="chip-input" value={startDay} onChange={(e) => change(setStartDay)(Number(e.target.value))}>
            {DAYS.map((day) => (
              <option key={day} value={day}>
                {day === 1 ? t('monthStartFirst') : t('monthStartDay', { day })}
              </option>
            ))}
          </select>
          <span className="steps-hint">{t('monthStartHint')}</span>
        </label>
      </div>

      <div className="field-group">
        <span className="field-group-label">{t('defaultPaidBy')}</span>
        <div className="chip-row" role="radiogroup" aria-label={t('defaultPaidBy')}>
          <Chip role="radio" active={!mode} onClick={() => change(setMode)(null)}>
            {t('askEachTime')}
          </Chip>
          {PAY_MODES.map((m) => (
            <Chip key={m.key} role="radio" active={mode === m.key} onClick={() => change(setMode)(m.key)}>
              {m.emoji} {modeName(m, lang)}
            </Chip>
          ))}
        </div>
      </div>

      <div className="switch-list">
        <Switch checked={onToday} onChange={change(setOnToday)} label={t('showMoneyOnToday')} />
        <Switch checked={hide} onChange={change(setHide)} label={t('hideAmountsOnOpen')} />
        <Switch checked={warnings} onChange={change(setWarnings)} label={t('budgetWarnings')} />
      </div>

      <div className="edit-panel-actions">
        {saved && <span className="saved-note">{t('settingsSaved')}</span>}
        <span className="spacer" />
        <button type="button" className="save-btn" onClick={save} disabled={busy || budgetInvalid}>
          {t('saveTask')}
        </button>
      </div>

      {/* ----- My own categories ----- */}
      {own.available && (
        <div className="field-group own-categories">
          <span className="field-group-label">🏷️ {t('myOwnCategories')}</span>
          {own.categories.length === 0 && <p className="steps-hint">{t('noOwnCategories')}</p>}
          <ul className="habit-pick-list">
            {own.categories.map((c) => (
              <li key={c.id} className="on">
                <span className="habit-pick">
                  <span className="habit-emoji" aria-hidden="true">
                    {c.emoji || '🏷️'}
                  </span>
                  <span className="habit-title">{c.name}</span>
                </span>
                <span className="meta-tag">{t(c.kind)}</span>
                <button type="button" className="icon-round small" aria-label={`${t('deleteTask')}: ${c.name}`} onClick={() => removeCategory(c)}>
                  <TrashIcon />
                </button>
              </li>
            ))}
          </ul>
          <div className="segmented" role="radiogroup" aria-label={t('moneyKind')}>
            <button type="button" role="radio" aria-checked={newKind === 'expense'} onClick={() => setNewKind('expense')}>
              − {t('expense')}
            </button>
            <button type="button" role="radio" aria-checked={newKind === 'income'} onClick={() => setNewKind('income')}>
              + {t('income')}
            </button>
          </div>
          <OwnCategoryForm key={newKind} kind={newKind} onAdd={addCategory} />
        </div>
      )}
    </section>
  );
}

// On / off switch with a label
function Switch({ checked, onChange, label }) {
  return (
    <label className="switch-row">
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="switch-track" aria-hidden="true" />
      <span>{label}</span>
    </label>
  );
}
