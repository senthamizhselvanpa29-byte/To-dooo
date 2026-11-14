'use client';

// ============================================================
// ADD / CHANGE AN INVESTMENT
//   1. Pick the type (17 tiles: mutual fund, shares, gold, FD, RD, PPF…)
//   2. Name it ("SBI Bluechip Fund")
//   3. Money put in: one time and / or every month (SIP, RD)
//   4. Depending on the type:
//        FD / RD / PPF…  → interest rate %, matures on, interest paid out?
//        MF / shares     → units + price per unit (or value now)
//        gold / silver   → grams (value uses today's rate)
//        land, LIC, chit → value now
//   5. Counts for 80C? (tax saver)
// ============================================================

import { useEffect, useState } from 'react';
import { INVESTMENT_TYPES } from '@/data/portfolio';
import { toDateInput } from '@/lib/dates';
import { calcAmount } from '@/lib/moneyParse';
import { investmentType, typeName } from '@/lib/portfolio';
import { usePreferences } from '../Preferences';
import { XIcon } from '../Icons';
import AmountInput from '../money/AmountInput';

const text = (v) => (v === null || v === undefined ? '' : String(Number(v)));
const optional = (v) => (String(v).trim() ? calcAmount(v) : null);

export default function InvestmentForm({ existing, onSave, onClose }) {
  const { t, lang } = usePreferences();
  const today = toDateInput(new Date());
  const [f, setF] = useState(() => ({
    type: existing?.type || '',
    name: existing?.name || '',
    started_on: existing?.started_on || today,
    amount: text(existing?.amount && Number(existing.amount) > 0 ? existing.amount : null),
    monthlyOn: Boolean(existing?.monthly_amount),
    monthly_amount: text(existing?.monthly_amount),
    monthly_day: existing?.monthly_day || '',
    monthly_until: existing?.monthly_until || '',
    rate: text(existing?.rate),
    matures_on: existing?.matures_on || '',
    payout: Boolean(existing?.payout),
    units: existing?.units !== null && existing?.units !== undefined ? String(Number(existing.units)) : '',
    price: text(existing?.price),
    value: text(existing?.value),
    tax_saver: existing ? Boolean(existing.tax_saver) : false,
    note: existing?.note || '',
    alsoMoney: false,
  }));
  const [busy, setBusy] = useState(false);
  const set = (changes) => setF((x) => ({ ...x, ...changes }));

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const type = f.type ? investmentType(f.type) : null;

  function chooseType(key) {
    const next = investmentType(key);
    set({ type: key, tax_saver: existing ? f.tax_saver : Boolean(next.taxSaver), monthlyOn: next.monthly ? f.monthlyOn : false });
  }

  // Numbers typed (calculator allowed)
  const amount = optional(f.amount);
  const monthly = f.monthlyOn ? optional(f.monthly_amount) : null;
  const rate = f.rate.trim() ? Number(f.rate) : null;
  const units = f.units.trim() ? Number(f.units) : null;
  const price = optional(f.price);
  const value = optional(f.value);

  let hint = null;
  if (!type) hint = t('chooseInvestmentType');
  else if (!f.name.trim()) hint = t('enterInvestmentName');
  else if (!(amount > 0) && !(monthly > 0)) hint = t('enterMoneyPutIn');
  else if (type.mode === 'rate' && (rate === null || Number.isNaN(rate))) hint = t('enterRate');
  else if (f.monthlyOn && !(monthly > 0)) hint = t('enterMonthlyAmount');
  const canSave = !hint && !busy;

  async function submit(e) {
    e.preventDefault();
    if (!canSave) return;
    const fields = {
      type: f.type,
      name: f.name.trim(),
      started_on: f.started_on || today,
      amount: amount || 0,
      monthly_amount: monthly || null,
      monthly_day: monthly ? Number(f.monthly_day) || Number(f.started_on.slice(8, 10)) : null,
      monthly_until: monthly && f.monthly_until ? f.monthly_until : null,
      rate: type.mode === 'rate' ? rate : null,
      matures_on: f.matures_on || null,
      payout: type.payout ? f.payout : false,
      units: type.mode === 'units' || type.mode === 'metal' ? units : null,
      price: type.mode === 'units' ? price : null,
      value: type.mode === 'rate' ? null : value,
      value_on: type.mode !== 'rate' && (value !== null || price !== null) ? today : (existing?.value_on ?? null),
      tax_saver: type.askTax ? f.tax_saver : false,
      note: f.note.trim() || null,
    };
    setBusy(true);
    const ok = await onSave(fields, existing, { alsoMoney: f.alsoMoney });
    setBusy(false);
    if (ok) onClose();
  }

  return (
    <div className="panel-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form className="edit-panel money-panel" role="dialog" aria-modal="true" aria-labelledby="inv-form-title" onSubmit={submit} noValidate>
        <div className="edit-panel-head">
          <h2 id="inv-form-title">{existing ? t('editInvestment') : t('addInvestment')}</h2>
          <button type="button" className="icon-round" aria-label={t('close')} onClick={onClose}>
            <XIcon />
          </button>
        </div>

        {/* ----- 1. Type ----- */}
        <div className="field-group">
          <span className="field-group-label">{t('investmentType')}</span>
          <div className="category-grid" role="radiogroup" aria-label={t('investmentType')}>
            {INVESTMENT_TYPES.map((x) => (
              <button key={x.key} type="button" role="radio" aria-checked={f.type === x.key} className="category-tile" onClick={() => chooseType(x.key)}>
                <span className="category-emoji" aria-hidden="true">
                  {x.emoji}
                </span>
                <span className="category-name">{typeName(x, lang)}</span>
              </button>
            ))}
          </div>
        </div>

        {type && (
          <>
            {/* ----- 2. Name + start ----- */}
            <label className="field-group">
              <span className="field-group-label">{t('investmentName')}</span>
              <input className="chip-input wide" maxLength={80} placeholder={type.example ? `${t('egShort')} ${type.example}` : ''} value={f.name} onChange={(e) => set({ name: e.target.value })} />
            </label>
            <label className="field-group">
              <span className="field-group-label">{t('startedOn')}</span>
              <input type="date" className="chip-input" max={today} value={f.started_on} onChange={(e) => set({ started_on: e.target.value })} />
            </label>

            {/* ----- 3. Money put in ----- */}
            <div className="field-group">
              <span className="field-group-label">{f.monthlyOn ? t('startedWithAmount') : t('moneyPutIn')}</span>
              <AmountInput id="inv-amount" value={f.amount} onChange={(v) => set({ amount: v })} />
              {!existing && f.started_on === today && amount > 0 && (
                <label className="check-row">
                  <input type="checkbox" checked={f.alsoMoney} onChange={(e) => set({ alsoMoney: e.target.checked })} />
                  <span>{t('alsoAddToMoney')}</span>
                </label>
              )}
            </div>

            {type.monthly && (
              <div className="field-group">
                <label className="check-row">
                  <input type="checkbox" checked={f.monthlyOn} onChange={(e) => set({ monthlyOn: e.target.checked })} />
                  <span>🔁 {t('everyMonthToggle')}</span>
                </label>
                {f.monthlyOn && (
                  <div className="pf-monthly">
                    <AmountInput id="inv-monthly" value={f.monthly_amount} onChange={(v) => set({ monthly_amount: v })} />
                    <div className="chip-row">
                      <label className="end-date">
                        {t('onDay')}
                        <select className="chip-input" value={f.monthly_day || Number(f.started_on.slice(8, 10))} onChange={(e) => set({ monthly_day: e.target.value })}>
                          {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="end-date">
                        {t('stoppedOn')}
                        <input type="date" className="chip-input" value={f.monthly_until} onChange={(e) => set({ monthly_until: e.target.value })} />
                      </label>
                    </div>
                    <span className="steps-hint">{t('monthlyHint')}</span>
                  </div>
                )}
              </div>
            )}

            {/* ----- 4. By type ----- */}
            {type.mode === 'rate' && (
              <div className="settings-grid">
                <label className="field-group">
                  <span className="field-group-label">{t('interestRate')}</span>
                  <input className="chip-input" inputMode="decimal" placeholder="7.1" value={f.rate} onChange={(e) => set({ rate: e.target.value.replace(/[^\d.]/g, '') })} />
                </label>
                <label className="field-group">
                  <span className="field-group-label">{t('maturesOnLabel')}</span>
                  <input type="date" className="chip-input" min={f.started_on} value={f.matures_on} onChange={(e) => set({ matures_on: e.target.value })} />
                </label>
              </div>
            )}
            {type.payout && (
              <label className="check-row">
                <input type="checkbox" checked={f.payout} onChange={(e) => set({ payout: e.target.checked })} />
                <span>{t('interestPaidOut')}</span>
              </label>
            )}

            {type.mode === 'units' && (
              <div className="settings-grid">
                <label className="field-group">
                  <span className="field-group-label">{t('unitsLabel')}</span>
                  <input className="chip-input" inputMode="decimal" placeholder="1234.567" value={f.units} onChange={(e) => set({ units: e.target.value.replace(/[^\d.]/g, '') })} />
                </label>
                <div className="field-group">
                  <span className="field-group-label">{t('pricePerUnit')}</span>
                  <AmountInput id="inv-price" value={f.price} onChange={(v) => set({ price: v })} />
                </div>
              </div>
            )}
            {type.mode === 'metal' && (
              <label className="field-group">
                <span className="field-group-label">{t('gramsLabel')}</span>
                <input className="chip-input" inputMode="decimal" placeholder="20" value={f.units} onChange={(e) => set({ units: e.target.value.replace(/[^\d.]/g, '') })} />
                <span className="steps-hint">{t('metalHint')}</span>
              </label>
            )}
            {type.mode !== 'rate' && (
              <div className="field-group">
                <span className="field-group-label">{type.mode === 'units' ? t('orValueNow') : t('valueNow')}</span>
                <AmountInput id="inv-value" value={f.value} onChange={(v) => set({ value: v })} />
              </div>
            )}

            {/* ----- 5. Tax saver (80C) ----- */}
            {type.askTax && (
              <label className="check-row">
                <input type="checkbox" checked={f.tax_saver} onChange={(e) => set({ tax_saver: e.target.checked })} />
                <span>🧾 {t('taxSaverCheck')}</span>
              </label>
            )}

            <label className="field-group">
              <span className="field-group-label">{t('noteLabel')}</span>
              <input className="chip-input wide" maxLength={300} placeholder={t('investmentNotePlaceholder')} value={f.note} onChange={(e) => set({ note: e.target.value })} />
            </label>
          </>
        )}

        {hint && (
          <p className="form-hint" role="status">
            {hint}
          </p>
        )}

        <div className="edit-panel-actions">
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
