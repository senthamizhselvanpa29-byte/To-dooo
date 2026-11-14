'use client';

// ============================================================
// 📈 PORTFOLIO TAB (inside 💰 Money)
//
//   Net worth = investments value now − loans left to pay
//   Put in · Value now · Gain (+%) · Yearly return (Pro)
//   Where your money is (circle) · Best / worst · 80C (Pro)
//   📈 Investments  [+ Add] [✏️ Update values]   🪙 gold / silver rate
//   🏦 Loans        [+ Add loan]   EMIs a month · debt-free by …
//   Settings: 80C tracker · monthly "update values" reminder
//   "VdoU only keeps your records — not investment advice."
//
// Numbers: src/lib/portfolio.js · Saving: ./usePortfolio.js
// ============================================================

import { useState } from 'react';
import { formatShortDate, localeFor } from '@/lib/dates';
import { formatMoney } from '@/lib/money';
import { FREE_LIMITS } from '@/lib/plans';
import { LIMIT_80C, typeName } from '@/lib/portfolio';
import { calcAmount } from '@/lib/moneyParse';
import { usePreferences } from '../Preferences';
import { ChevronIcon, PlusIcon } from '../Icons';
import Link from 'next/link';
import { usePlan } from '../plan/PlanProvider';
import UpgradeNote from '../plan/UpgradeNote';
import AmountInput from '../money/AmountInput';
import InvestmentForm from './InvestmentForm';
import InvestmentPanel from './InvestmentPanel';
import LoanForm from './LoanForm';
import LoanPanel from './LoanPanel';
import UpdateValuesPanel from './UpdateValuesPanel';
import { usePortfolio } from './usePortfolio';

export default function PortfolioBoard({ hidden, settings, updateSettings }) {
  const { t, lang } = usePreferences();
  const { isPro } = usePlan();
  const p = usePortfolio({ settings, updateSettings });
  const [panel, setPanel] = useState(null); // { kind, id }
  const [showClosed, setShowClosed] = useState(false);

  if (!p.computed) {
    return (
      <p className="loading-text" role="status">
        {t('loadingPortfolio')}
      </p>
    );
  }
  if (!p.available) {
    return (
      <div className="form-alert error" role="alert">
        {t('errPortfolioNotReady')}
      </div>
    );
  }

  const { investments, loans, summary, today } = p.computed;
  const money = (amount, sign = '') => formatMoney(amount, lang, { hidden, sign, whole: true });
  const signed = (amount) => money(amount, amount > 0 ? '+' : amount < 0 ? '−' : '');
  const pct = (value) => (value === null || value === undefined ? '' : `${value > 0 ? '+' : ''}${value.toLocaleString(localeFor(lang))}%`);
  const date = (d) => (d ? `${formatShortDate(d, lang)} ${d.getFullYear()}` : '');

  const openInv = investments.filter((s) => !s.inv.closed_on);
  const closedInv = investments.filter((s) => s.inv.closed_on);
  const openLoans = loans.filter((s) => !s.loan.closed_on);
  const closedLoans = loans.filter((s) => s.loan.closed_on);
  const hasMetal = openInv.some((s) => s.type.mode === 'metal');
  const hasMarket = openInv.some((s) => s.type.mode !== 'rate');
  const invAtLimit = !isPro && investments.length >= FREE_LIMITS.investments;
  const loanAtLimit = !isPro && loans.length >= FREE_LIMITS.loans;

  const current = panel && {
    inv: panel.kind.startsWith('inv') ? investments.find((s) => s.inv.id === panel.id) : null,
    loan: panel.kind.startsWith('loan') ? loans.find((s) => s.loan.id === panel.id) : null,
  };
  const close = () => setPanel(null);

  return (
    <div className="portfolio">
      {p.errorKey && (
        <div className="form-alert error" role="alert">
          {t(p.errorKey)}
        </div>
      )}

      {/* ----- Net worth + totals ----- */}
      <section className="card pf-summary">
        <div className="pf-networth">
          <span>{t('netWorth')}</span>
          <strong className={summary.netWorth < 0 ? 'expense' : 'income'}>{money(summary.netWorth, summary.netWorth < 0 ? '−' : '')}</strong>
        </div>
        <div className="money-totals">
          <div>
            <span>{t('investedLabel')}</span>
            <strong>{money(summary.invested)}</strong>
          </div>
          <div>
            <span>{t('valueNow')}</span>
            <strong>{money(summary.value)}</strong>
          </div>
          <div>
            <span>{t('gainLabel')}</span>
            <strong className={`gain-${summary.colour}`}>
              {signed(summary.gain)} <small>{pct(summary.gainPct)}</small>
            </strong>
          </div>
          <div>
            <span>{t('loansLeft')}</span>
            <strong className={summary.loansLeft > 0 ? 'expense' : ''}>{money(summary.loansLeft)}</strong>
          </div>
        </div>
        {isPro ? (
          summary.yearly !== null && <p className="pf-yearly">📅 {t('yearlyReturn', { pct: pct(summary.yearly) })}</p>
        ) : (
          (openInv.length > 0) && <ProLine />
        )}
      </section>

      {/* ----- Where your money is + best / worst (Pro) ----- */}
      {isPro && summary.allocation.length > 0 && (
        <section className="card report-card">
          <h2>{t('whereMoneyIs')}</h2>
          <div className="pf-allocation">
            <div className="pf-donut" style={{ background: donut(summary.allocation) }} aria-hidden="true">
              <span>{money(summary.value)}</span>
            </div>
            <ul className="pf-legend">
              {summary.allocation.map((a) => (
                <li key={a.type.key}>
                  <span className="pf-dot" style={{ background: a.colour }} aria-hidden="true" />
                  <span>
                    {a.type.emoji} {typeName(a.type, lang)}
                  </span>
                  <strong>{a.pct.toLocaleString(localeFor(lang))}%</strong>
                </li>
              ))}
            </ul>
          </div>
          {summary.best && summary.worst && (
            <div className="report-stats">
              <div className="card report-stat">
                <span className="report-stat-label">⭐ {t('bestInvestment')}</span>
                <span className="report-stat-day">{summary.best.inv.name}</span>
                <span className={`report-stat-sub gain-${summary.best.colour}`}>{pct(summary.best.gainPct)}</span>
              </div>
              <div className="card report-stat">
                <span className="report-stat-label">😓 {t('worstInvestment')}</span>
                <span className="report-stat-day">{summary.worst.inv.name}</span>
                <span className={`report-stat-sub gain-${summary.worst.colour}`}>{pct(summary.worst.gainPct)}</span>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ----- 80C tax saving (Pro) ----- */}
      {isPro && settings?.show_80c !== false && openInv.some((s) => s.inv.tax_saver) && (
        <section className="card report-card">
          <h2>🧾 {t('tax80cTitle', { year: summary.fy.label })}</h2>
          <div className="money-budget-row">
            <span>{t('tax80cUsed', { used: money(Math.min(summary.tax80c, LIMIT_80C)), limit: money(LIMIT_80C) })}</span>
          </div>
          <div className="money-bar colour-green" aria-hidden="true">
            <span style={{ width: `${Math.min(100, (summary.tax80c / LIMIT_80C) * 100)}%` }} />
          </div>
          <p className="steps-hint">{t('tax80cHint')}</p>
        </section>
      )}

      {/* ----- 📈 Investments ----- */}
      <section className="task-section">
        <div className="section-head">
          <h2 className="section-title">📈 {t('investmentsTitle')}</h2>
          <div className="pf-head-buttons">
            {hasMarket && (
              <button type="button" className="ghost-btn small" onClick={() => setPanel({ kind: 'update' })}>
                ✏️ {t('updateValues')}
              </button>
            )}
            {!invAtLimit && (
              <button type="button" className="save-btn small" onClick={() => setPanel({ kind: 'invForm' })}>
                <PlusIcon /> {t('addInvestment')}
              </button>
            )}
          </div>
        </div>
        {invAtLimit && <UpgradeNote what="investments" />}
        {hasMetal && <MetalRates settings={settings} hidden={hidden} onSave={p.saveRates} />}
        {openInv.length === 0 ? (
          <p className="empty-state">{t('noInvestments')}</p>
        ) : (
          <ul className="money-list">
            {openInv.map((s) => (
              <li key={s.inv.id} className={`pf-row gain-border-${s.colour}`}>
                <button type="button" className="money-row-body" onClick={() => setPanel({ kind: 'inv', id: s.inv.id })}>
                  <span className="money-emoji" aria-hidden="true">
                    {s.type.emoji}
                  </span>
                  <span className="money-main">
                    <span className="money-title">{s.inv.name}</span>
                    <span className="money-meta">
                      <span>{typeName(s.type, lang)}</span>
                      {s.inv.monthly_amount && <span>🔁 {t('perMonthAmount', { amount: money(s.inv.monthly_amount) })}</span>}
                      {s.inv.rate && <span>{Number(s.inv.rate)}%</span>}
                      {s.inv.matures_on && <span>⏳ {t('maturesOn', { date: date(new Date(`${s.inv.matures_on}T00:00`)) })}</span>}
                      {s.inv.tax_saver && <span className="meta-tag">80C</span>}
                    </span>
                  </span>
                  <span className="pf-amounts">
                    <span className="pf-value">{money(s.value)}</span>
                    {s.known ? (
                      <span className={`pf-gain gain-${s.colour}`}>
                        {signed(s.gain)} {s.gainPct !== null && `(${pct(s.gainPct)})`}
                      </span>
                    ) : (
                      <span className="pf-gain gain-flat">{t('valueNotUpdated')}</span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ----- 🏦 Loans ----- */}
      <section className="task-section">
        <div className="section-head">
          <h2 className="section-title">🏦 {t('loansTitle')}</h2>
          {!loanAtLimit && (
            <button type="button" className="save-btn small" onClick={() => setPanel({ kind: 'loanForm' })}>
              <PlusIcon /> {t('addLoan')}
            </button>
          )}
        </div>
        {loanAtLimit && <UpgradeNote what="loans" />}
        {openLoans.length > 0 && (
          <p className="steps-hint pf-loans-line">
            {summary.monthlyOut > 0 && t('monthlyLoanPay', { amount: money(summary.monthlyOut) })}
            {summary.debtFree && ` · 🎉 ${t('debtFreeBy', { date: date(summary.debtFree) })}`}
          </p>
        )}
        {openLoans.length === 0 ? (
          <p className="empty-state">{t('noLoans')}</p>
        ) : (
          <ul className="money-list">
            {openLoans.map((s) => (
              <li key={s.loan.id} className="pf-row loan">
                <button type="button" className="money-row-body" onClick={() => setPanel({ kind: 'loan', id: s.loan.id })}>
                  <span className="money-emoji" aria-hidden="true">
                    {s.type.emoji}
                  </span>
                  <span className="money-main">
                    <span className="money-title">{s.loan.name}</span>
                    <span className="money-meta">
                      <span>{typeName(s.type, lang)}</span>
                      {Number(s.loan.rate) > 0 && <span>{Number(s.loan.rate)}%</span>}
                      {s.loan.style === 'emi' && s.emi && <span>{t('emiAmount', { amount: money(s.emi) })}</span>}
                      {s.loan.style === 'interest_only' && s.monthly > 0 && <span>{t('interestAMonth', { amount: money(s.monthly) })}</span>}
                      {s.nextDue && <span>📅 {t('nextDue', { date: formatShortDate(s.nextDue, lang) })}</span>}
                    </span>
                    {s.loan.style !== 'manual' && (
                      <span className="pf-progress" aria-hidden="true">
                        <span style={{ width: `${s.paidPct}%` }} />
                      </span>
                    )}
                  </span>
                  <span className="pf-amounts">
                    <span className="pf-value expense">{money(s.outstanding)}</span>
                    <span className="pf-gain gain-flat">
                      {s.payoffDate ? t('endsOn', { date: date(s.payoffDate) }) : s.loan.style !== 'manual' ? t('paidPct', { pct: s.paidPct }) : t('leftToPay')}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ----- Closed ----- */}
      {(closedInv.length > 0 || closedLoans.length > 0) && (
        <section className="task-section">
          <button type="button" className={`section-toggle${showClosed ? ' open' : ''}`} aria-expanded={showClosed} onClick={() => setShowClosed((v) => !v)}>
            <ChevronIcon className="section-chevron" />
            {t('closedTitle')} ({closedInv.length + closedLoans.length})
          </button>
          {showClosed && (
            <ul className="money-list">
              {closedInv.map((s) => (
                <li key={s.inv.id} className="pf-row closed">
                  <button type="button" className="money-row-body" onClick={() => setPanel({ kind: 'inv', id: s.inv.id })}>
                    <span className="money-emoji" aria-hidden="true">
                      {s.type.emoji}
                    </span>
                    <span className="money-main">
                      <span className="money-title">{s.inv.name}</span>
                      <span className="money-meta">{t('closedOn', { date: date(new Date(`${s.inv.closed_on}T00:00`)) })}</span>
                    </span>
                    <span className={`pf-gain gain-${s.colour}`}>
                      {signed(s.gain)} {s.gainPct !== null && `(${pct(s.gainPct)})`}
                    </span>
                  </button>
                </li>
              ))}
              {closedLoans.map((s) => (
                <li key={s.loan.id} className="pf-row closed">
                  <button type="button" className="money-row-body" onClick={() => setPanel({ kind: 'loan', id: s.loan.id })}>
                    <span className="money-emoji" aria-hidden="true">
                      {s.type.emoji}
                    </span>
                    <span className="money-main">
                      <span className="money-title">{s.loan.name}</span>
                      <span className="money-meta">{t('loanClosedOn', { date: date(new Date(`${s.loan.closed_on}T00:00`)) })}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* ----- Settings ----- */}
      <section className="card settings-card">
        <h2>⚙️ {t('portfolioSettings')}</h2>
        <div className="switch-list">
          <label className="switch-row">
            <input type="checkbox" role="switch" checked={settings?.show_80c !== false} onChange={(e) => p.setShow80c(e.target.checked)} />
            <span className="switch-track" aria-hidden="true" />
            <span>{t('show80c')}</span>
          </label>
          <label className="switch-row">
            <input type="checkbox" role="switch" checked={Boolean(settings?.value_reminder_id)} onChange={(e) => p.setValueReminder(e.target.checked)} />
            <span className="switch-track" aria-hidden="true" />
            <span>{t('valueReminderSwitch')}</span>
          </label>
        </div>
      </section>

      <p className="pf-disclaimer">ℹ️ {t('notAdvice')}</p>

      {/* ----- Panels ----- */}
      {panel?.kind === 'invForm' && <InvestmentForm onSave={p.saveInvestment} onClose={close} />}
      {panel?.kind === 'invEdit' && current.inv && <InvestmentForm existing={current.inv.inv} onSave={p.saveInvestment} onClose={close} />}
      {panel?.kind === 'inv' && current.inv && (
        <InvestmentPanel
          stats={current.inv}
          txns={p.txnsOfInvestment(current.inv.inv.id)}
          settings={settings}
          hidden={hidden}
          isPro={isPro}
          today={today}
          actions={p}
          onEdit={() => setPanel({ kind: 'invEdit', id: current.inv.inv.id })}
          onClose={close}
        />
      )}
      {panel?.kind === 'loanForm' && <LoanForm onSave={p.saveLoan} onClose={close} />}
      {panel?.kind === 'loanEdit' && current.loan && <LoanForm existing={current.loan.loan} onSave={p.saveLoan} onClose={close} />}
      {panel?.kind === 'loan' && current.loan && (
        <LoanPanel
          stats={current.loan}
          txns={p.txnsOfLoan(current.loan.loan.id)}
          hidden={hidden}
          actions={p}
          onEdit={() => setPanel({ kind: 'loanEdit', id: current.loan.loan.id })}
          onClose={close}
        />
      )}
      {panel?.kind === 'update' && <UpdateValuesPanel investments={openInv} settings={settings} actions={p} onClose={close} />}
    </div>
  );
}

// Circle split by type (CSS conic-gradient)
function donut(allocation) {
  let start = 0;
  const parts = allocation.map((a) => {
    const end = start + a.pct;
    const part = `${a.colour} ${start}% ${end}%`;
    start = end;
    return part;
  });
  return `conic-gradient(${parts.join(', ')}, var(--app-chip) ${start}% 100%)`;
}

// "🔒 Yearly return, where your money is, best / worst and 80C are part of Pro"
function ProLine() {
  const { t } = usePreferences();
  return (
    <p className="pf-pro-line">
      🔒 {t('portfolioProLine')}{' '}
      <Link href="/pro" className="text-link">
        ✨ {t('goPro')}
      </Link>
    </p>
  );
}

// 🪙 Today's gold / silver rate (₹ per gram) — one rate for all your gold
function MetalRates({ settings, hidden, onSave }) {
  const { t, lang } = usePreferences();
  const [editing, setEditing] = useState(false);
  const [gold, setGold] = useState(settings?.gold_rate ? String(Number(settings.gold_rate)) : '');
  const [silver, setSilver] = useState(settings?.silver_rate ? String(Number(settings.silver_rate)) : '');
  const money = (v) => formatMoney(v, lang, { hidden, whole: true });

  if (!editing) {
    return (
      <div className="pf-rates">
        <span>
          🪙 {t('goldRate')}: <strong>{settings?.gold_rate ? `${money(settings.gold_rate)}/g` : '—'}</strong>
        </span>
        <span>
          🥈 {t('silverRate')}: <strong>{settings?.silver_rate ? `${money(settings.silver_rate)}/g` : '—'}</strong>
        </span>
        <button type="button" className="text-link" onClick={() => setEditing(true)}>
          {t('change')}
        </button>
      </div>
    );
  }
  const goldValue = gold.trim() ? calcAmount(gold) : null;
  const silverValue = silver.trim() ? calcAmount(silver) : null;
  return (
    <div className="pf-rates editing">
      <div className="field-group">
        <span className="field-group-label">🪙 {t('goldRatePerGram')}</span>
        <AmountInput id="gold-rate" value={gold} onChange={setGold} autoFocus />
      </div>
      <div className="field-group">
        <span className="field-group-label">🥈 {t('silverRatePerGram')}</span>
        <AmountInput id="silver-rate" value={silver} onChange={setSilver} />
      </div>
      <div className="edit-panel-actions">
        <span className="steps-hint">{t('rateHint')}</span>
        <span className="spacer" />
        <button type="button" className="ghost-btn small" onClick={() => setEditing(false)}>
          {t('cancel')}
        </button>
        <button
          type="button"
          className="save-btn small"
          onClick={async () => {
            if (await onSave({ gold_rate: goldValue, silver_rate: silverValue })) setEditing(false);
          }}
        >
          {t('saveTask')}
        </button>
      </div>
    </div>
  );
}
