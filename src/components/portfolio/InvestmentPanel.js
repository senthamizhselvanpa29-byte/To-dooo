'use client';

// ============================================================
// ONE INVESTMENT — numbers, buttons and history
//   Put in · Value now · Gain (+%) · Returns received · Taken out
//   Yearly return (Pro) · At maturity
//   [➕ Add money] [💸 Got returns] [↩️ Took out] [✏️ Update value]
//   History (monthly SIP / RD payments are counted by themselves)
// ============================================================

import { useEffect, useState } from 'react';
import { formatShortDate, localeFor, toDateInput } from '@/lib/dates';
import { formatMoney } from '@/lib/money';
import { calcAmount } from '@/lib/moneyParse';
import { typeName } from '@/lib/portfolio';
import { usePreferences } from '../Preferences';
import { TrashIcon, XIcon } from '../Icons';
import AmountInput from '../money/AmountInput';

const ACTIONS = [
  { kind: 'invest', emoji: '➕', key: 'actionAddMoney' },
  { kind: 'return', emoji: '💸', key: 'actionGotReturns' },
  { kind: 'withdraw', emoji: '↩️', key: 'actionTookOut' },
  { kind: 'value', emoji: '✏️', key: 'actionUpdateValue' },
];
const HISTORY_KEYS = { invest: 'historyInvest', return: 'historyReturn', withdraw: 'historyWithdraw', value: 'historyValue' };

export default function InvestmentPanel({ stats, txns, settings, hidden, isPro, today, actions, onEdit, onClose }) {
  const { t, lang } = usePreferences();
  const [action, setAction] = useState(null); // 'invest' | 'return' | 'withdraw' | 'value'
  const { inv, type } = stats;
  const money = (v, sign = '') => formatMoney(v, lang, { hidden, sign, whole: true });
  const signed = (v) => money(v, v > 0 ? '+' : v < 0 ? '−' : '');
  const pct = (v) => (v === null || v === undefined ? '—' : `${v > 0 ? '+' : ''}${v.toLocaleString(localeFor(lang))}%`);
  const date = (text) => {
    const d = new Date(`${String(text).slice(0, 10)}T00:00`);
    return `${formatShortDate(d, lang)} ${d.getFullYear()}`;
  };

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const history = [...txns].sort((a, b) => b.on_date.localeCompare(a.on_date) || b.created_at.localeCompare(a.created_at));
  const closed = Boolean(inv.closed_on);

  async function remove() {
    if (!window.confirm(t('deleteInvestmentConfirm', { name: inv.name }))) return;
    if (await actions.removeInvestment(inv)) onClose();
  }

  return (
    <div className="panel-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="edit-panel money-panel pf-panel" role="dialog" aria-modal="true" aria-labelledby="inv-panel-title">
        <div className="edit-panel-head">
          <h2 id="inv-panel-title">
            {type.emoji} {inv.name}
          </h2>
          <button type="button" className="icon-round" aria-label={t('close')} onClick={onClose}>
            <XIcon />
          </button>
        </div>
        <p className="money-meta pf-panel-meta">
          <span>{typeName(type, lang)}</span>
          <span>{t('startedOnDate', { date: date(inv.started_on) })}</span>
          {inv.monthly_amount && <span>🔁 {t('perMonthAmount', { amount: money(inv.monthly_amount) })}</span>}
          {inv.rate && <span>{t('ratePerYear', { rate: Number(inv.rate) })}</span>}
          {inv.matures_on && <span>⏳ {t('maturesOn', { date: date(inv.matures_on) })}</span>}
          {inv.tax_saver && <span className="meta-tag">80C</span>}
          {closed && <span className="meta-tag">{t('closedOn', { date: date(inv.closed_on) })}</span>}
        </p>

        {/* ----- Numbers ----- */}
        <div className="pf-stats">
          <Stat label={t('investedLabel')} value={money(stats.invested)} />
          <Stat label={t('valueNow')} value={stats.known ? money(stats.value) : '—'} hint={!stats.known ? t('valueNotUpdated') : stats.byRate ? t('byTodaysRate') : null} />
          <Stat label={t('gainLabel')} value={stats.known ? signed(stats.gain) : '—'} sub={stats.known ? pct(stats.gainPct) : ''} tone={stats.colour} />
          {stats.returns > 0 && <Stat label={t('returnsReceived')} value={money(stats.returns)} />}
          {stats.withdrawn > 0 && <Stat label={t('takenOut')} value={money(stats.withdrawn)} />}
          {isPro && stats.yearly !== null && <Stat label={t('yearlyReturnShort')} value={pct(stats.yearly)} tone={stats.colour} />}
          {stats.maturityValue && <Stat label={t('atMaturity')} value={`≈ ${money(stats.maturityValue)}`} />}
        </div>
        {stats.monthlyCount > 0 && <p className="steps-hint">🔁 {t('autoPayments', { count: stats.monthlyCount, amount: money(inv.monthly_amount) })}</p>}

        {/* ----- Buttons ----- */}
        {!closed && (
          <div className="pf-actions">
            {ACTIONS.map((a) => (
              <button key={a.kind} type="button" className={`chip${action === a.kind ? ' active' : ''}`} aria-pressed={action === a.kind} onClick={() => setAction(action === a.kind ? null : a.kind)}>
                {a.emoji} {t(a.key)}
              </button>
            ))}
          </div>
        )}
        {action && (
          <ActionForm
            key={action}
            kind={action}
            stats={stats}
            settings={settings}
            onSave={async (fields) => {
              const ok = await actions.addInvestmentTxn(inv, fields);
              if (ok) setAction(null);
            }}
          />
        )}

        {/* ----- History ----- */}
        <div className="field-group">
          <span className="field-group-label">{t('historyTitle')}</span>
          {history.length === 0 && Number(inv.amount) === 0 && <p className="steps-hint">{t('noHistory')}</p>}
          <ul className="pf-history">
            {history.map((x) => (
              <li key={x.id}>
                <span className="pf-history-date">{date(x.on_date)}</span>
                <span className="pf-history-what">
                  {t(HISTORY_KEYS[x.kind])}
                  {x.units ? ` · ${Number(x.units)}` : ''}
                  {x.money_entry_id && <span className="meta-tag">💰</span>}
                </span>
                <span className={`pf-history-amount ${x.kind === 'invest' ? 'expense' : x.kind === 'value' ? '' : 'income'}`}>{x.kind === 'value' ? money(x.amount) : signed(x.kind === 'invest' ? -x.amount : Number(x.amount))}</span>
                <button type="button" className="icon-round small" aria-label={t('deleteTask')} onClick={() => window.confirm(t('deleteHistoryConfirm')) && actions.removeInvestmentTxn(x)}>
                  <TrashIcon />
                </button>
              </li>
            ))}
            {Number(inv.amount) > 0 && (
              <li>
                <span className="pf-history-date">{date(inv.started_on)}</span>
                <span className="pf-history-what">{t('historyStart')}</span>
                <span className="pf-history-amount expense">{signed(-Number(inv.amount))}</span>
                <span className="icon-round small placeholder" aria-hidden="true" />
              </li>
            )}
          </ul>
        </div>

        <div className="edit-panel-actions">
          <button type="button" className="delete-btn" onClick={remove}>
            <TrashIcon /> {t('deleteTask')}
          </button>
          {closed && (
            <button type="button" className="ghost-btn" onClick={() => actions.reopenInvestment(inv)}>
              {t('reopen')}
            </button>
          )}
          <span className="spacer" />
          <button type="button" className="ghost-btn" onClick={onEdit}>
            ✏️ {t('editInvestment')}
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, hint, tone }) {
  return (
    <div className="pf-stat">
      <span>{label}</span>
      <strong className={tone ? `gain-${tone}` : ''}>
        {value} {sub && <small>{sub}</small>}
      </strong>
      {hint && <em>{hint}</em>}
    </div>
  );
}

// The small form under the buttons
function ActionForm({ kind, stats, settings, onSave }) {
  const { t } = usePreferences();
  const { inv, type } = stats;
  const today = toDateInput(new Date());
  const [amount, setAmount] = useState('');
  const [units, setUnits] = useState('');
  const [onDate, setOnDate] = useState(today);
  const [alsoMoney, setAlsoMoney] = useState(true);
  const [close, setClose] = useState(false);
  const [busy, setBusy] = useState(false);

  // What "Update value" asks for, by type
  const valueBy = kind !== 'value' ? null : type.mode === 'metal' ? 'rate' : type.mode === 'units' && inv.units ? 'price' : 'value';
  const startValue =
    valueBy === 'rate'
      ? settings?.[inv.type === 'gold' ? 'gold_rate' : 'silver_rate']
      : valueBy === 'price'
        ? inv.price
        : null;
  const [value, setValue] = useState(startValue ? String(Number(startValue)) : '');

  const n = calcAmount(kind === 'value' ? value : amount);
  const showUnits = (kind === 'invest' || kind === 'withdraw') && (type.mode === 'units' || type.mode === 'metal');
  const canSave = n !== null && onDate && !busy;

  const labels = {
    invest: t('amountAdded'),
    return: t('amountReceived'),
    withdraw: t('amountTakenOut'),
    value: valueBy === 'rate' ? (inv.type === 'gold' ? t('goldRatePerGram') : t('silverRatePerGram')) : valueBy === 'price' ? t('pricePerUnit') : t('valueNow'),
  };

  async function save() {
    if (!canSave) return;
    setBusy(true);
    await onSave({
      kind,
      amount: kind === 'value' && valueBy !== 'value' ? 0 : n,
      price: valueBy === 'price' ? n : undefined,
      rate: valueBy === 'rate' ? n : undefined,
      units: showUnits && units ? Number(units) : null,
      on_date: onDate,
      alsoMoney: kind !== 'value' && alsoMoney,
      close: kind === 'withdraw' && close,
    });
    setBusy(false);
  }

  return (
    <div className="pf-action-form">
      <span className="field-group-label">{labels[kind]}</span>
      <AmountInput id={`inv-${kind}`} value={kind === 'value' ? value : amount} onChange={kind === 'value' ? setValue : setAmount} autoFocus />
      {valueBy === 'rate' && <span className="steps-hint">{t('rateHint')}</span>}
      <div className="chip-row">
        {showUnits && (
          <input
            className="chip-input"
            inputMode="decimal"
            placeholder={type.mode === 'metal' ? t('gramsLabel') : t('unitsLabel')}
            aria-label={type.mode === 'metal' ? t('gramsLabel') : t('unitsLabel')}
            value={units}
            onChange={(e) => setUnits(e.target.value.replace(/[^\d.]/g, ''))}
          />
        )}
        <input type="date" className="chip-input" max={today} aria-label={t('dateLabel')} value={onDate} onChange={(e) => setOnDate(e.target.value)} />
      </div>
      {kind !== 'value' && (
        <label className="check-row">
          <input type="checkbox" checked={alsoMoney} onChange={(e) => setAlsoMoney(e.target.checked)} />
          <span>{t('alsoAddToMoney')}</span>
        </label>
      )}
      {kind === 'withdraw' && (
        <label className="check-row">
          <input type="checkbox" checked={close} onChange={(e) => setClose(e.target.checked)} />
          <span>{t('closesInvestment')}</span>
        </label>
      )}
      <div className="edit-panel-actions">
        <span className="spacer" />
        <button type="button" className="save-btn small" onClick={save} disabled={!canSave}>
          {t('saveTask')}
        </button>
      </div>
    </div>
  );
}
