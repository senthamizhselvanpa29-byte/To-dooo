'use client';

// ============================================================
// ADD / CHANGE A LOAN
//   1. Type: home, vehicle, personal, gold, education, credit card…
//   2. Lender ("SBI", "Muthoot", "Ramesh")
//   3. Amount borrowed · interest % a year · started on
//   4. How you repay (filled in by type, can be changed):
//        EMI                → months (or EMI amount) → EMI is worked out
//        Interest only      → interest every month, loan amount at the end
//        Pay all at the end → interest adds up until you repay
//        I'll update it     → credit card balance
//   5. Remind me every month (a "Pay EMI" task on the due day)
// ============================================================

import { useEffect, useState } from 'react';
import { LOAN_STYLES, LOAN_TYPES } from '@/data/portfolio';
import { toDateInput } from '@/lib/dates';
import { formatMoney } from '@/lib/money';
import { calcAmount } from '@/lib/moneyParse';
import { emiFor, LOAN_STYLE_KEYS, loanType, typeName } from '@/lib/portfolio';
import { usePreferences } from '../Preferences';
import { XIcon } from '../Icons';
import AmountInput from '../money/AmountInput';
import { Chip } from '../tasks/TaskFields';

export default function LoanForm({ existing, onSave, onClose }) {
  const { t, lang } = usePreferences();
  const today = toDateInput(new Date());
  const [f, setF] = useState(() => ({
    type: existing?.type || '',
    name: existing?.name || '',
    principal: existing ? String(Number(existing.principal)) : '',
    rate: existing ? String(Number(existing.rate)) : '',
    started_on: existing?.started_on || today,
    style: existing?.style || 'emi',
    years: existing?.tenure_months ? String(Math.floor(existing.tenure_months / 12)) : '',
    months: existing?.tenure_months ? String(existing.tenure_months % 12) : '',
    emi: existing?.emi ? String(Number(existing.emi)) : '',
    emi_day: existing?.emi_day || '',
    reminder: existing ? Boolean(existing.reminder_routine_id) : true,
    note: existing?.note || '',
  }));
  const [busy, setBusy] = useState(false);
  const set = (changes) => setF((x) => ({ ...x, ...changes }));

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  function chooseType(key) {
    set({ type: key, style: existing ? f.style : loanType(key).style });
  }

  const principal = f.principal.trim() ? calcAmount(f.principal) : null;
  const rate = f.rate.trim() ? Number(f.rate) : 0;
  const tenure = (Number(f.years) || 0) * 12 + (Number(f.months) || 0);
  const emiTyped = f.emi.trim() ? calcAmount(f.emi) : null;
  const emiWorked = f.style === 'emi' && principal && tenure ? emiFor(principal, rate, tenure) : null;
  const monthlyInterest = principal ? Math.round((principal * rate) / 1200) : 0;

  let hint = null;
  if (!f.type) hint = t('chooseLoanType');
  else if (!f.name.trim()) hint = t('enterLender');
  else if (!(principal > 0)) hint = f.style === 'manual' ? t('enterBalance') : t('enterLoanAmount');
  else if (Number.isNaN(rate) || rate < 0 || rate > 100) hint = t('enterRate');
  else if (f.style === 'emi' && !tenure && !emiTyped) hint = t('enterTenureOrEmi');
  else if (f.style === 'emi' && emiTyped && rate > 0 && emiTyped <= (principal * rate) / 1200) hint = t('emiTooLow');
  const canSave = !hint && !busy;

  async function submit(e) {
    e.preventDefault();
    if (!canSave) return;
    const fields = {
      type: f.type,
      name: f.name.trim(),
      principal,
      rate,
      started_on: f.started_on || today,
      style: f.style,
      tenure_months: tenure || null,
      emi: f.style === 'emi' ? emiTyped || emiWorked : null,
      emi_day: Number(f.emi_day) || null,
      note: f.note.trim() || null,
    };
    setBusy(true);
    const ok = await onSave(fields, existing, { reminder: f.style !== 'bullet' && f.reminder });
    setBusy(false);
    if (ok) onClose();
  }

  return (
    <div className="panel-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form className="edit-panel money-panel" role="dialog" aria-modal="true" aria-labelledby="loan-form-title" onSubmit={submit} noValidate>
        <div className="edit-panel-head">
          <h2 id="loan-form-title">{existing ? t('editLoan') : t('addLoan')}</h2>
          <button type="button" className="icon-round" aria-label={t('close')} onClick={onClose}>
            <XIcon />
          </button>
        </div>

        <div className="field-group">
          <span className="field-group-label">{t('loanType')}</span>
          <div className="category-grid" role="radiogroup" aria-label={t('loanType')}>
            {LOAN_TYPES.map((x) => (
              <button key={x.key} type="button" role="radio" aria-checked={f.type === x.key} className="category-tile" onClick={() => chooseType(x.key)}>
                <span className="category-emoji" aria-hidden="true">
                  {x.emoji}
                </span>
                <span className="category-name">{typeName(x, lang)}</span>
              </button>
            ))}
          </div>
        </div>

        {f.type && (
          <>
            <label className="field-group">
              <span className="field-group-label">{t('lenderName')}</span>
              <input className="chip-input wide" maxLength={80} placeholder={loanType(f.type).example ? `${t('egShort')} ${loanType(f.type).example}` : ''} value={f.name} onChange={(e) => set({ name: e.target.value })} />
            </label>

            <div className="field-group">
              <span className="field-group-label">{t('repayStyle')}</span>
              <div className="chip-row" role="radiogroup" aria-label={t('repayStyle')}>
                {LOAN_STYLES.map((s) => (
                  <Chip key={s} role="radio" active={f.style === s} onClick={() => set({ style: s })}>
                    {t(LOAN_STYLE_KEYS[s])}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="field-group">
              <span className="field-group-label">{f.style === 'manual' ? t('balanceNow') : t('loanAmount')}</span>
              <AmountInput id="loan-principal" value={f.principal} onChange={(v) => set({ principal: v })} />
            </div>

            <div className="settings-grid">
              <label className="field-group">
                <span className="field-group-label">{t('interestRate')}</span>
                <input className="chip-input" inputMode="decimal" placeholder={f.type === 'gold' ? '12' : '8.5'} value={f.rate} onChange={(e) => set({ rate: e.target.value.replace(/[^\d.]/g, '') })} />
              </label>
              <label className="field-group">
                <span className="field-group-label">{f.style === 'manual' ? t('sinceDate') : t('loanStartedOn')}</span>
                <input type="date" className="chip-input" max={today} value={f.started_on} onChange={(e) => set({ started_on: e.target.value })} />
              </label>
            </div>

            {(f.style === 'emi' || f.style === 'bullet' || f.style === 'interest_only') && (
              <div className="field-group">
                <span className="field-group-label">{f.style === 'emi' ? t('loanTenure') : t('repayWithin')}</span>
                <div className="chip-row">
                  <label className="end-date">
                    <input className="chip-input tiny" inputMode="numeric" value={f.years} onChange={(e) => set({ years: e.target.value.replace(/\D/g, '').slice(0, 2) })} />
                    {t('yearsShort')}
                  </label>
                  <label className="end-date">
                    <input className="chip-input tiny" inputMode="numeric" value={f.months} onChange={(e) => set({ months: e.target.value.replace(/\D/g, '').slice(0, 2) })} />
                    {t('monthsShort')}
                  </label>
                </div>
              </div>
            )}

            {f.style === 'emi' && (
              <div className="field-group">
                <span className="field-group-label">{t('emiLabel')}</span>
                <AmountInput id="loan-emi" value={f.emi} onChange={(v) => set({ emi: v })} />
                {emiWorked && !emiTyped && <span className="steps-hint">≈ {t('emiWorkedOut', { amount: formatMoney(emiWorked, lang, { whole: true }) })}</span>}
              </div>
            )}
            {f.style === 'interest_only' && principal > 0 && rate > 0 && (
              <p className="steps-hint">💡 {t('interestEveryMonth', { amount: formatMoney(monthlyInterest, lang, { whole: true }) })}</p>
            )}

            {f.style !== 'bullet' && (
              <div className="settings-grid">
                <label className="field-group">
                  <span className="field-group-label">{f.style === 'manual' ? t('billDueDay') : t('emiDay')}</span>
                  <select className="chip-input" value={f.emi_day || Number(f.started_on.slice(8, 10))} onChange={(e) => set({ emi_day: e.target.value })}>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="check-row">
                  <input type="checkbox" checked={f.reminder} onChange={(e) => set({ reminder: e.target.checked })} />
                  <span>🔔 {t('remindMonthly')}</span>
                </label>
              </div>
            )}

            <label className="field-group">
              <span className="field-group-label">{t('noteLabel')}</span>
              <input className="chip-input wide" maxLength={300} placeholder={t('loanNotePlaceholder')} value={f.note} onChange={(e) => set({ note: e.target.value })} />
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
