'use client';

// ============================================================
// GO PRO PAGE (/pro)
//   1. My plan now: "🎁 Free trial — 41 days left" / "✨ Pro until …"
//   2. Three choices: ₹199 a month · ₹1,499 a year · ₹15,000 lifetime
//      Tap one → the Razorpay window opens (UPI, card, net banking)
//      → paid → Pro starts straight away.
//   3. Free vs Pro table
//
// Payments are checked on our server (src/app/api/pay/), never here.
// You pay each time (no auto-renew); a new month / year starts when
// the current Pro ends.
// ============================================================

import { useEffect, useState } from 'react';
import { formatShortDate, localeFor } from '@/lib/dates';
import { FREE_LIMITS, isProPlan, LIFETIME_AI_PER_MONTH, PLANS, YEARLY_SAVING } from '@/lib/plans';
import { usePreferences } from '../Preferences';
import { usePlan } from './PlanProvider';

const CHECKOUT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

// Loads Razorpay's payment window (only when someone wants to pay)
function loadCheckout() {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = CHECKOUT_URL;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

async function post(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'failed');
  return data;
}

// Error code from the server → message key in src/locales
const ERROR_KEYS = {
  payments_not_ready: 'payErrNotReady',
  already_lifetime: 'payErrLifetime',
  bad_signature: 'payErrCheck',
  payment_failed: 'payErrFailed',
};

export default function ProBoard({ name, email, phone }) {
  const { t, lang } = usePreferences();
  const { plan, available, loaded, setPlan, reload } = usePlan();
  const [busy, setBusy] = useState(null); // plan being paid for
  const [message, setMessage] = useState(null); // { tone: 'success' | 'error', text }

  // Paid earlier but closed the window too soon? Catch up quietly.
  useEffect(() => {
    post('/api/pay/sync')
      .then((r) => r.confirmed > 0 && reload())
      .catch(() => {});
  }, [reload]);

  const rupees = (n) => `₹${n.toLocaleString(localeFor(lang))}`;
  const date = (d) => formatShortDate(d, lang) + ' ' + new Date(d).getFullYear();
  const active = isProPlan(plan);
  const isLifetime = plan?.plan === 'lifetime';

  async function pay(planKey) {
    setBusy(planKey);
    setMessage(null);
    try {
      const order = await post('/api/pay/order', { plan: planKey });
      await loadCheckout();
      const checkout = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: 'INR',
        name: 'VdoU',
        description: t(PLANS[planKey].labelKey),
        prefill: { name, email, contact: phone },
        theme: { color: '#0084ff' },
        handler: async (result) => {
          try {
            const { plan: updated } = await post('/api/pay/verify', {
              orderId: result.razorpay_order_id,
              paymentId: result.razorpay_payment_id,
              signature: result.razorpay_signature,
            });
            setPlan(updated);
            setMessage({ tone: 'success', text: t('paySuccess') });
          } catch (error) {
            setMessage({ tone: 'error', text: t(ERROR_KEYS[error.message] || 'payErrCheck') });
          }
          setBusy(null);
        },
        modal: { ondismiss: () => setBusy(null) },
      });
      checkout.on('payment.failed', () => {
        setMessage({ tone: 'error', text: t('payErrFailed') });
        setBusy(null);
      });
      checkout.open();
    } catch (error) {
      setMessage({ tone: 'error', text: t(ERROR_KEYS[error.message] || 'payErrStart') });
      setBusy(null);
    }
  }

  // ----- 1. My plan now -----
  let status = null;
  if (plan) {
    if (isLifetime) status = t('statusLifetime');
    else if (plan.plan === 'trial') status = active ? t('statusTrial', { date: date(plan.pro_until) }) : t('statusTrialEnded');
    else status = active
      ? t('statusPro', { plan: t(PLANS[plan.plan].labelKey), date: date(plan.pro_until) })
      : t('statusProEnded', { date: date(plan.pro_until) });
  }

  return (
    <div className="today-board">
      <div className="page-head">
        <h1>✨ {t('goProTitle')}</h1>
      </div>

      {loaded && !available && (
        <div className="form-alert error" role="alert">
          {t('errDbNotReady')}
        </div>
      )}
      {message && (
        <div className={`form-alert ${message.tone}`} role="alert">
          {message.text}
        </div>
      )}

      {status && (
        <section className={`card pro-status${active ? ' active' : ''}`}>
          <p className="pro-status-text">{status}</p>
          {!active && <p className="steps-hint">{t('freeNow')}</p>}
        </section>
      )}

      {/* 2. Three choices */}
      {!isLifetime && (
        <section className="pro-plans">
          {Object.entries(PLANS).map(([key, p]) => (
            <div key={key} className={`card pro-plan${key === 'yearly' ? ' best' : ''}`}>
              {key === 'yearly' && <span className="pro-plan-badge">{t('saveBadge', { pct: YEARLY_SAVING })}</span>}
              <h2>{t(p.labelKey)}</h2>
              <p className="pro-price">
                {rupees(p.price)} <span>{t(p.periodKey)}</span>
              </p>
              <p className="steps-hint">
                {key === 'lifetime' ? t('lifetimeNote', { count: LIFETIME_AI_PER_MONTH }) : t('payEachTime')}
              </p>
              <button type="button" className="save-btn" onClick={() => pay(key)} disabled={busy !== null || (loaded && !available)}>
                {busy === key ? t('payOpening') : t('payButton', { price: rupees(p.price) })}
              </button>
            </div>
          ))}
        </section>
      )}
      {active && !isLifetime && <p className="steps-hint">{t('extendsNote')}</p>}

      {/* 3. Free vs Pro */}
      <section className="card report-card">
        <h2>{t('freeVsPro')}</h2>
        <table className="pro-table">
          <thead>
            <tr>
              <th />
              <th>{t('planFree')}</th>
              <th>✨ Pro</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{t('featureTasks')}</td>
              <td>{t('unlimited')}</td>
              <td>{t('unlimited')}</td>
            </tr>
            <tr>
              <td>{t('featureHabits')}</td>
              <td>{FREE_LIMITS.habits}</td>
              <td>{t('unlimited')}</td>
            </tr>
            <tr>
              <td>{t('featureLists')}</td>
              <td>{FREE_LIMITS.lists}</td>
              <td>{t('unlimited')}</td>
            </tr>
            <tr>
              <td>{t('featureSteps')}</td>
              <td>{FREE_LIMITS.steps}</td>
              <td>{t('unlimited')}</td>
            </tr>
            <tr>
              <td>{t('featureWeekly')}</td>
              <td>✅</td>
              <td>✅</td>
            </tr>
            <tr>
              <td>{t('calendarView')}</td>
              <td>🔒</td>
              <td>✅</td>
            </tr>
            <tr>
              <td>{t('featureMonthly')}</td>
              <td>🔒</td>
              <td>✅</td>
            </tr>
          </tbody>
        </table>
        <p className="steps-hint">{t('nothingDeleted')}</p>
      </section>
    </div>
  );
}
