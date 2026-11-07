'use client';

// ============================================================
// "HOW MUCH DID YOU PAY?" — opens when you tick a bill task
// ("Pay electricity bill", "Pay rent", "Mobile recharge"…).
// Save → the money is added under the right category (🧾 Bills →
// Electricity) with the task's name as the note. Skip → nothing.
// Which tasks count as bills: billFromTitle in src/lib/moneyParse.js
// ============================================================

import { useEffect, useState } from 'react';
import { PAY_MODES } from '@/data/money';
import { announceMoneyChange, createMoneyEntry, describeEntry, modeName, moneyErrorKey } from '@/lib/money';
import { calcAmount } from '@/lib/moneyParse';
import { usePreferences } from '../Preferences';
import { useSettings } from '../routine/useSettings';
import { Chip } from '../tasks/TaskFields';
import AmountInput from './AmountInput';

export default function BillAmountDialog({ task, bill, onClose }) {
  const { t, lang } = usePreferences();
  const { settings } = useSettings();
  const [value, setValue] = useState(bill.amount ? String(bill.amount) : '');
  const [payMode, setPayMode] = useState(null);
  const [modeTouched, setModeTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorKey, setErrorKey] = useState(null);
  const amount = calcAmount(value);
  const { emoji, title } = describeEntry({ kind: 'expense', category: bill.category, item: bill.item }, null, lang);

  // Use the default "paid by" from Settings (until you pick one yourself)
  useEffect(() => {
    if (!modeTouched && settings?.money_default_mode) setPayMode(settings.money_default_mode);
  }, [settings, modeTouched]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function save(e) {
    e.preventDefault();
    if (amount === null) return;
    setBusy(true);
    setErrorKey(null);
    try {
      await createMoneyEntry({
        kind: 'expense',
        amount,
        category: bill.category,
        item: bill.item,
        pay_mode: payMode,
        spent_at: new Date().toISOString(),
        note: task.title.slice(0, 300),
        task_id: task.id,
      });
      announceMoneyChange();
      onClose();
    } catch (error) {
      setErrorKey(moneyErrorKey(error));
      setBusy(false);
    }
  }

  return (
    <div className="panel-overlay center" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form className="setup-dialog bill-dialog" role="dialog" aria-modal="true" aria-labelledby="bill-title" onSubmit={save} noValidate>
        <h2 id="bill-title">💰 {t('billAskTitle')}</h2>
        <p className="steps-hint">
          ✅ {task.title} · {emoji} {title}
        </p>
        <AmountInput id="bill-amount" value={value} onChange={setValue} autoFocus />
        <div className="chip-row" role="radiogroup" aria-label={t('paidBy')}>
          {PAY_MODES.map((m) => (
            <Chip
              key={m.key}
              role="radio"
              active={payMode === m.key}
              onClick={() => {
                setModeTouched(true);
                setPayMode(payMode === m.key ? null : m.key);
              }}
            >
              {m.emoji} {modeName(m, lang)}
            </Chip>
          ))}
        </div>
        {errorKey && (
          <div className="form-alert error" role="alert">
            {t(errorKey)}
          </div>
        )}
        <div className="edit-panel-actions">
          <button type="button" className="ghost-btn" onClick={onClose}>
            {t('skip')}
          </button>
          <span className="spacer" />
          <button type="submit" className="save-btn" disabled={amount === null || busy}>
            {t('saveTask')}
          </button>
        </div>
      </form>
    </div>
  );
}
