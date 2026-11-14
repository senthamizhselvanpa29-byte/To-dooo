'use client';

// ============================================================
// ONE LOAN — what is left, interest, end date, history
//   Left to pay · Borrowed · Paid so far (bar)
//   EMI: EMI · interest paid so far · total interest · EMIs left · ends on
//   Interest only: interest every month · interest paid so far
//   Pay at end: to repay today · interest so far
//   [💳 I paid] [➕ Borrowed more] [✏️ Update balance] [✅ Loan closed]
// ============================================================

import { useEffect, useState } from 'react';
import { formatShortDate, toDateInput } from '@/lib/dates';
import { formatMoney } from '@/lib/money';
import { calcAmount } from '@/lib/moneyParse';
import { LOAN_STYLE_KEYS, typeName } from '@/lib/portfolio';
import { usePreferences } from '../Preferences';
import { TrashIcon, XIcon } from '../Icons';
import AmountInput from '../money/AmountInput';

const HISTORY_KEYS = { payment: 'loanHistoryPayment', borrow: 'loanHistoryBorrow', balance: 'loanHistoryBalance' };

export default function LoanPanel({ stats, txns, hidden, actions, onEdit, onClose }) {
  const { t, lang } = usePreferences();
  const [action, setAction] = useState(null);
  const { loan, type } = stats;
  const money = (v) => formatMoney(v, lang, { hidden, whole: true });
  const date = (d) => {
    const x = d instanceof Date ? d : new Date(`${String(d).slice(0, 10)}T00:00`);
    return `${formatShortDate(x, lang)} ${x.getFullYear()}`;
  };

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const history = [...txns].sort((a, b) => b.on_date.localeCompare(a.on_date) || b.created_at.localeCompare(a.created_at));
  const closed = Boolean(loan.closed_on);
  const buttons = [
    { kind: 'payment', label: loan.style === 'emi' ? `💳 ${t('paidExtra')}` : `💳 ${t('paidBack')}` },
    { kind: 'borrow', label: `➕ ${t('borrowedMore')}` },
    ...(loan.style === 'manual' ? [{ kind: 'balance', label: `✏️ ${t('updateBalance')}` }] : []),
  ];

  async function remove() {
    if (!window.confirm(t('deleteLoanConfirm', { name: loan.name }))) return;
    if (await actions.removeLoan(loan)) onClose();
  }

  return (
    <div className="panel-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="edit-panel money-panel pf-panel" role="dialog" aria-modal="true" aria-labelledby="loan-panel-title">
        <div className="edit-panel-head">
          <h2 id="loan-panel-title">
            {type.emoji} {loan.name}
          </h2>
          <button type="button" className="icon-round" aria-label={t('close')} onClick={onClose}>
            <XIcon />
          </button>
        </div>
        <p className="money-meta pf-panel-meta">
          <span>{typeName(type, lang)}</span>
          {Number(loan.rate) > 0 && <span>{t('ratePerYear', { rate: Number(loan.rate) })}</span>}
          <span>{t(LOAN_STYLE_KEYS[loan.style])}</span>
          <span>{t('startedOnDate', { date: date(loan.started_on) })}</span>
          {loan.reminder_routine_id && <span>🔔 {t('monthlyReminderOn')}</span>}
          {closed && <span className="meta-tag">{t('loanClosedOn', { date: date(loan.closed_on) })}</span>}
        </p>

        {stats.tooLow && <div className="form-alert error">{t('emiTooLow')}</div>}

        <div className="pf-stats">
          <Stat label={loan.style === 'bullet' ? t('toRepayToday') : t('leftToPay')} value={money(stats.outstanding)} tone="red" />
          <Stat label={t('borrowedLabel')} value={money(stats.borrowed)} />
          {loan.style !== 'manual' && <Stat label={t('paidSoFar')} value={`${stats.paidPct}%`} />}
          {loan.style === 'emi' && stats.emi && <Stat label={t('emiLabel')} value={money(stats.emi)} />}
          {loan.style === 'interest_only' && <Stat label={t('interestEveryMonthShort')} value={money(stats.monthly || 0)} />}
          {loan.style === 'manual' && stats.monthly > 0 && <Stat label={t('interestIfUnpaid')} value={money(stats.monthly)} />}
          {stats.interestPaid > 0 && <Stat label={t('interestPaidSoFar')} value={money(stats.interestPaid)} />}
          {loan.style === 'bullet' && <Stat label={t('interestSoFar')} value={money(stats.interestSoFar || 0)} />}
          {loan.style === 'emi' && stats.totalInterest > 0 && <Stat label={t('totalInterest')} value={money(stats.totalInterest)} hint={t('interestLeft', { amount: money(stats.interestLeft) })} />}
          {loan.style === 'emi' && stats.emisLeft > 0 && <Stat label={t('emisLeft')} value={String(stats.emisLeft)} />}
          {stats.nextDue && <Stat label={t('nextDueLabel')} value={date(stats.nextDue)} />}
          {stats.payoffDate && <Stat label={loan.style === 'emi' ? t('endsOnLabel') : t('repayByLabel')} value={date(stats.payoffDate)} />}
        </div>
        {loan.style !== 'manual' && (
          <div className="pf-progress big" aria-hidden="true">
            <span style={{ width: `${stats.paidPct}%` }} />
          </div>
        )}
        {loan.style === 'emi' && <p className="steps-hint">{t('emiAssumed')}</p>}

        {!closed && (
          <div className="pf-actions">
            {buttons.map((b) => (
              <button key={b.kind} type="button" className={`chip${action === b.kind ? ' active' : ''}`} aria-pressed={action === b.kind} onClick={() => setAction(action === b.kind ? null : b.kind)}>
                {b.label}
              </button>
            ))}
          </div>
        )}
        {action && (
          <LoanActionForm
            key={action}
            kind={action}
            onSave={async (fields) => {
              const ok = await actions.addLoanTxn(loan, fields);
              if (ok) setAction(null);
            }}
          />
        )}

        <div className="field-group">
          <span className="field-group-label">{t('historyTitle')}</span>
          {history.length === 0 && <p className="steps-hint">{t('noLoanHistory')}</p>}
          <ul className="pf-history">
            {history.map((x) => (
              <li key={x.id}>
                <span className="pf-history-date">{date(x.on_date)}</span>
                <span className="pf-history-what">
                  {t(HISTORY_KEYS[x.kind])}
                  {x.money_entry_id && <span className="meta-tag">💰</span>}
                </span>
                <span className={`pf-history-amount ${x.kind === 'payment' ? 'income' : x.kind === 'borrow' ? 'expense' : ''}`}>{money(x.amount)}</span>
                <button type="button" className="icon-round small" aria-label={t('deleteTask')} onClick={() => window.confirm(t('deleteHistoryConfirm')) && actions.removeLoanTxn(x)}>
                  <TrashIcon />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="edit-panel-actions">
          <button type="button" className="delete-btn" onClick={remove}>
            <TrashIcon /> {t('deleteTask')}
          </button>
          <button type="button" className="ghost-btn" onClick={() => actions.closeLoan(loan, !closed)}>
            {closed ? t('reopen') : `✅ ${t('loanClosed')}`}
          </button>
          <span className="spacer" />
          <button type="button" className="ghost-btn" onClick={onEdit}>
            ✏️ {t('editLoan')}
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, hint, tone }) {
  return (
    <div className="pf-stat">
      <span>{label}</span>
      <strong className={tone ? `gain-${tone}` : ''}>{value}</strong>
      {hint && <em>{hint}</em>}
    </div>
  );
}

function LoanActionForm({ kind, onSave }) {
  const { t } = usePreferences();
  const today = toDateInput(new Date());
  const [amount, setAmount] = useState('');
  const [onDate, setOnDate] = useState(today);
  const [alsoMoney, setAlsoMoney] = useState(true);
  const [busy, setBusy] = useState(false);
  const n = calcAmount(amount);
  const labels = { payment: t('amountPaid'), borrow: t('amountBorrowed'), balance: t('balanceNow') };

  async function save() {
    if (n === null || busy) return;
    setBusy(true);
    await onSave({ kind, amount: n, on_date: onDate, alsoMoney: kind === 'payment' && alsoMoney });
    setBusy(false);
  }

  return (
    <div className="pf-action-form">
      <span className="field-group-label">{labels[kind]}</span>
      <AmountInput id={`loan-${kind}`} value={amount} onChange={setAmount} autoFocus />
      <div className="chip-row">
        <input type="date" className="chip-input" max={today} aria-label={t('dateLabel')} value={onDate} onChange={(e) => setOnDate(e.target.value)} />
      </div>
      {kind === 'payment' && (
        <label className="check-row">
          <input type="checkbox" checked={alsoMoney} onChange={(e) => setAlsoMoney(e.target.checked)} />
          <span>{t('alsoAddToMoney')}</span>
        </label>
      )}
      <div className="edit-panel-actions">
        <span className="spacer" />
        <button type="button" className="save-btn small" onClick={save} disabled={n === null || busy}>
          {t('saveTask')}
        </button>
      </div>
    </div>
  );
}
