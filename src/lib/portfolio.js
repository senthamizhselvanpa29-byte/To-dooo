// ============================================================
// 📈 PORTFOLIO + 🏦 LOANS — the maths and the database
// Tables: supabase/migrations/0008_portfolio_loans.sql
// Types:  src/data/portfolio.js
//
// Investments
//   money put in  = start amount + every monthly payment (SIP / RD) +
//                   "Add money"
//   value now     = FD / RD / PPF…: grows from the interest rate
//                   MF / shares:     units × price
//                   gold / silver:   grams × today's rate
//                   others:          the value you typed
//   gain          = value now + returns received + money taken out
//                   − money put in
//   yearly return = like a bank interest rate, counting WHEN each
//                   rupee went in (XIRR). Shown after 3 months.
// Loans
//   EMI           = standard reducing-balance EMI; extra payments
//                   bring the end date closer
//   interest only = interest every month, loan amount at the end
//   pay at end    = simple interest adds up until you repay
//   balance       = you type the balance (credit card)
// "Not investment advice" — VdoU only keeps your records.
// ============================================================

import { LANGS } from '@/data/money';
import { ALLOCATION_COLOURS, INVESTMENT_TYPES, LOAN_TYPES } from '@/data/portfolio';
import { createClient } from '@/lib/supabase/client';

const DAY = 86400000;
const YEAR = 365.25 * DAY;

// Show the yearly return only after this many days (too early = silly numbers)
export const XIRR_MIN_DAYS = 90;
// Gain within ±1% shows as "about the same" (grey)
export const FLAT_PERCENT = 1;
// 80C limit for one financial year (April–March), old tax regime
export const LIMIT_80C = 150000;
// Words for the repay styles (src/locales)
export const LOAN_STYLE_KEYS = { emi: 'styleEmi', interest_only: 'styleInterestOnly', bullet: 'styleBullet', manual: 'styleManual' };
// Reminders are added at this time
export const REMINDER_TIME = '10:00';
// "Matures soon" reminder this many days before
export const MATURITY_NOTICE_DAYS = 7;

const db = () => createClient();
async function run(query) {
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

const pick = (names, lang) => names[Math.max(0, LANGS.indexOf(lang))] || names[0];
export const investmentType = (key) => INVESTMENT_TYPES.find((t) => t.key === key) || INVESTMENT_TYPES[INVESTMENT_TYPES.length - 1];
export const loanType = (key) => LOAN_TYPES.find((t) => t.key === key) || LOAN_TYPES[LOAN_TYPES.length - 1];
export const typeName = (type, lang) => pick(type.name, lang);

// Database error → message key (words are in src/locales)
export function portfolioErrorKey(error) {
  const text = `${error?.code} ${error?.message}`;
  if (/free_limit_investments/.test(text)) return 'errLimitInvestments';
  if (/free_limit_loans/.test(text)) return 'errLimitLoans';
  if (/PGRST205|42P01|42703|schema cache|column .* does not exist|relation .*(investment|loan)/i.test(text)) return 'errPortfolioNotReady';
  return 'errSavePortfolio';
}

// ------------------------------------------------------------
// Small helpers
// ------------------------------------------------------------
export const toDate = (text) => (text ? new Date(`${String(text).slice(0, 10)}T00:00`) : null);
const num = (value) => (value === null || value === undefined || value === '' ? null : Number(value));
const round2 = (value) => Math.round(value * 100) / 100;
const yearsBetween = (from, to) => Math.max(0, (to - from) / YEAR);
const minDate = (...dates) => {
  const list = dates.filter(Boolean);
  return list.length ? list.reduce((a, b) => (b < a ? b : a)) : null;
};

// The same day every month: from `start` (inclusive) up to `until` (inclusive)
export function monthlyDates(start, day, until) {
  const out = [];
  if (!start || !until) return out;
  const wanted = day || start.getDate();
  const at = (k) => {
    const last = new Date(start.getFullYear(), start.getMonth() + k + 1, 0).getDate();
    return new Date(start.getFullYear(), start.getMonth() + k, Math.min(wanted, last));
  };
  let k = at(0) < start ? 1 : 0;
  for (let guard = 0; guard < 1200; guard++, k++) {
    const date = at(k);
    if (date > until) break;
    out.push(date);
  }
  return out;
}

// 🟢 profit · 🔴 loss · ⚪ about the same
export function gainColour(pct) {
  if (pct === null || pct === undefined) return 'flat';
  if (pct > FLAT_PERCENT) return 'green';
  if (pct < -FLAT_PERCENT) return 'red';
  return 'flat';
}

// ------------------------------------------------------------
// Yearly return (XIRR): the yearly % that makes all money in and
// out add up to zero. flows: [{ date, amount }] (out = negative)
// ------------------------------------------------------------
export function xirr(flows) {
  const list = flows.filter((f) => f.amount !== 0).sort((a, b) => a.date - b.date);
  if (list.length < 2 || !list.some((f) => f.amount < 0) || !list.some((f) => f.amount > 0)) return null;
  const t0 = list[0].date;
  const npv = (rate) => list.reduce((sum, f) => sum + f.amount / Math.pow(1 + rate, (f.date - t0) / (365 * DAY)), 0);
  let lo = -0.999;
  let hi = 10;
  let fLo = npv(lo);
  if (fLo * npv(hi) > 0) return null;
  let mid = 0;
  for (let i = 0; i < 200; i++) {
    mid = (lo + hi) / 2;
    const fMid = npv(mid);
    if (Math.abs(fMid) < 1e-7 || hi - lo < 1e-9) break;
    if (fLo * fMid < 0) hi = mid;
    else {
      lo = mid;
      fLo = fMid;
    }
  }
  return Math.round(mid * 1000) / 10; // e.g. 15.9 (%)
}

// ------------------------------------------------------------
// Investments
// ------------------------------------------------------------

// Every rupee in and out: [{ date, amount, kind, auto }]
export function investmentFlows(inv, txns, today) {
  const start = toDate(inv.started_on);
  const flows = [];
  if (num(inv.amount) > 0) flows.push({ date: start, amount: -Number(inv.amount), kind: 'invest' });
  if (num(inv.monthly_amount) > 0) {
    // Monthly payments stop the day before maturity (RD: 60 payments for 5 years)
    const beforeMaturity = inv.matures_on ? new Date(toDate(inv.matures_on).getTime() - DAY) : null;
    const until = minDate(today, toDate(inv.monthly_until), beforeMaturity, toDate(inv.closed_on));
    for (const date of monthlyDates(start, num(inv.monthly_day), until)) {
      flows.push({ date, amount: -Number(inv.monthly_amount), kind: 'invest', auto: true });
    }
  }
  for (const t of txns) {
    const date = toDate(t.on_date);
    if (date > today) continue;
    if (t.kind === 'invest') flows.push({ date, amount: -Number(t.amount), kind: 'invest' });
    if (t.kind === 'return') flows.push({ date, amount: Number(t.amount), kind: 'return' });
    if (t.kind === 'withdraw') flows.push({ date, amount: Number(t.amount), kind: 'withdraw' });
  }
  return flows.sort((a, b) => a.date - b.date);
}

// Interest-rate investments (FD, RD, PPF…): value on `end`
function rateValue(inv, txns, end, extraMonthlyUntil) {
  const type = investmentType(inv.type);
  const rate = (num(inv.rate) || 0) / 100;
  const n = type.compound || 1;
  // Like banks: interest is added at the end of each full period (quarter / year),
  // simple interest for the part-period at the end
  const grow = (amount, from) => {
    if (inv.payout) return amount;
    const years = yearsBetween(from, end);
    const periods = Math.floor(n * years + 1e-9);
    return amount * Math.pow(1 + rate / n, periods) * (1 + rate * (years - periods / n));
  };

  // Start from the last value you typed (e.g. EPF passbook), if any
  const updates = txns.filter((t) => t.kind === 'value' && toDate(t.on_date) <= end).sort((a, b) => toDate(a.on_date) - toDate(b.on_date));
  const last = updates[updates.length - 1];
  const baseDate = last ? toDate(last.on_date) : null;
  let value = last ? grow(Number(last.amount), baseDate) : 0;

  const after = (date) => !baseDate || date > baseDate;
  const flows = investmentFlows(inv, txns, extraMonthlyUntil || end);
  for (const f of flows) {
    if (f.date > end || !after(f.date)) continue;
    if (f.kind === 'invest') value += grow(-f.amount, f.date);
    if (f.kind === 'withdraw') value -= grow(f.amount, f.date);
  }
  return Math.max(0, round2(value));
}

// Today's value: { value, known, maturityValue, byRate }
export function investmentValue(inv, txns, rates, today) {
  if (inv.closed_on) return { value: 0, known: true };
  const type = investmentType(inv.type);

  if (type.mode === 'rate') {
    const maturity = toDate(inv.matures_on);
    const end = maturity && maturity < today ? maturity : today;
    const value = rateValue(inv, txns, end);
    const maturityValue = maturity && maturity > today ? rateValue(inv, txns, maturity, maturity) : null;
    return { value, known: true, maturityValue };
  }
  if (type.mode === 'metal') {
    const rate = num(type.key === 'gold' ? rates?.gold_rate : rates?.silver_rate);
    if (num(inv.units) > 0 && rate) return { value: round2(Number(inv.units) * rate), known: true, byRate: true };
  }
  if (type.mode === 'units' && num(inv.units) !== null && num(inv.price) !== null) {
    return { value: round2(Number(inv.units) * Number(inv.price)), known: true };
  }
  if (num(inv.value) !== null) return { value: Number(inv.value), known: true };
  return { value: null, known: false }; // value not typed yet
}

// Everything the screens show for one investment
export function investmentStats(inv, txns, rates, today) {
  const flows = investmentFlows(inv, txns, today);
  const invested = round2(flows.filter((f) => f.kind === 'invest').reduce((s, f) => s - f.amount, 0));
  const returns = round2(flows.filter((f) => f.kind === 'return').reduce((s, f) => s + f.amount, 0));
  const withdrawn = round2(flows.filter((f) => f.kind === 'withdraw').reduce((s, f) => s + f.amount, 0));
  const { value: rawValue, known, maturityValue, byRate } = investmentValue(inv, txns, rates, today);
  // Value not typed yet → assume it is worth what you put in (no gain shown)
  const value = known ? rawValue : Math.max(0, invested - withdrawn);
  const gain = round2(value + returns + withdrawn - invested);
  const gainPct = invested > 0 && known ? Math.round((gain / invested) * 1000) / 10 : null;
  const first = flows[0]?.date;
  const yearly = known && first && today - first >= XIRR_MIN_DAYS * DAY ? xirr([...flows, { date: today, amount: value }]) : null;
  return {
    inv,
    type: investmentType(inv.type),
    invested,
    returns,
    withdrawn,
    value,
    known,
    byRate,
    gain: known ? gain : 0,
    gainPct,
    yearly,
    colour: gainColour(gainPct),
    maturityValue,
    monthlyCount: flows.filter((f) => f.auto).length,
    flows,
  };
}

// ------------------------------------------------------------
// Loans
// ------------------------------------------------------------

// Standard EMI for amount P, yearly rate %, n months
export function emiFor(principal, ratePct, months) {
  const P = Number(principal);
  const n = Number(months);
  if (!(P > 0) || !(n > 0)) return null;
  const r = Number(ratePct || 0) / 100 / 12;
  if (r === 0) return Math.round(P / n);
  const f = Math.pow(1 + r, n);
  return Math.round((P * r * f) / (f - 1)); // banks round the EMI to whole rupees
}

// Due dates: same day every month, starting one month after the loan
function dueDate(start, day, k) {
  const last = new Date(start.getFullYear(), start.getMonth() + k + 1, 0).getDate();
  return new Date(start.getFullYear(), start.getMonth() + k, Math.min(day || start.getDate(), last));
}

// EMI loans: month by month (extra payments and top-ups included)
function emiLoan(loan, txns, today) {
  const start = toDate(loan.started_on);
  const r = (num(loan.rate) || 0) / 100 / 12;
  const emi = num(loan.emi) || emiFor(loan.principal, loan.rate, loan.tenure_months);
  const events = txns
    .filter((t) => t.kind === 'payment' || t.kind === 'borrow')
    .map((t) => ({ date: toDate(t.on_date), amount: Number(t.amount) * (t.kind === 'borrow' ? 1 : -1) }))
    .sort((a, b) => a.date - b.date);

  let balance = Number(loan.principal);
  let borrowed = balance;
  let interestPaid = 0;
  let totalInterest = 0;
  let paidEmis = 0;
  let emisLeft = 0;
  let outstanding = null;
  let nextDue = null;
  let payoffDate = null;
  let tooLow = false;
  let e = 0;

  for (let k = 1; k <= 600; k++) {
    const date = dueDate(start, num(loan.emi_day), k);
    // Extra payments / top-ups before this due date
    while (e < events.length && events[e].date < date) {
      if (events[e].amount > 0) borrowed += events[e].amount;
      balance = Math.max(0, balance + events[e].amount);
      e++;
    }
    if (outstanding === null && date > today) {
      outstanding = balance;
      nextDue = balance > 0 ? date : null;
    }
    if (balance <= 0.5) break;
    const interest = balance * r;
    if (emi <= interest && r > 0) {
      tooLow = true;
      break;
    }
    const pay = Math.min(emi, balance + interest);
    balance = Math.max(0, balance + interest - pay);
    totalInterest += interest;
    if (date <= today) {
      interestPaid += interest;
      paidEmis++;
    } else emisLeft++;
    payoffDate = date;
  }
  // Payments after the last due date that has passed
  while (e < events.length && events[e].date <= today) {
    if (events[e].amount > 0) borrowed += events[e].amount;
    balance = Math.max(0, balance + events[e].amount);
    e++;
  }
  if (outstanding === null) outstanding = balance;

  return {
    emi,
    outstanding: round2(outstanding),
    borrowed: round2(borrowed),
    interestPaid: round2(interestPaid),
    totalInterest: round2(totalInterest),
    interestLeft: round2(totalInterest - interestPaid),
    paidEmis,
    emisLeft,
    nextDue,
    payoffDate: outstanding > 0.5 ? payoffDate : null,
    tooLow,
    monthly: emi,
  };
}

// Interest every month, loan amount at the end (gold loan, private loan)
function interestOnlyLoan(loan, txns, today) {
  const start = toDate(loan.started_on);
  const r = (num(loan.rate) || 0) / 100 / 12;
  const events = txns
    .filter((t) => t.kind === 'payment' || t.kind === 'borrow')
    .map((t) => ({ date: toDate(t.on_date), amount: Number(t.amount) * (t.kind === 'borrow' ? 1 : -1) }))
    .sort((a, b) => a.date - b.date);
  let balance = Number(loan.principal);
  let borrowed = balance;
  let interestPaid = 0;
  let e = 0;
  let nextDue = null;
  for (let k = 1; k <= 1200; k++) {
    const date = dueDate(start, num(loan.emi_day), k);
    while (e < events.length && events[e].date < date) {
      if (events[e].amount > 0) borrowed += events[e].amount;
      balance = Math.max(0, balance + events[e].amount);
      e++;
    }
    if (date > today || balance <= 0) {
      nextDue = balance > 0 ? date : null;
      break;
    }
    interestPaid += balance * r;
  }
  while (e < events.length && events[e].date <= today) {
    if (events[e].amount > 0) borrowed += events[e].amount;
    balance = Math.max(0, balance + events[e].amount);
    e++;
  }
  const end = loan.tenure_months ? dueDate(start, start.getDate(), Number(loan.tenure_months)) : null;
  return {
    outstanding: round2(balance),
    borrowed: round2(borrowed),
    interestPaid: round2(interestPaid),
    monthly: round2(balance * r),
    nextDue,
    payoffDate: balance > 0 ? end : null,
  };
}

// Pay everything at the end: simple interest adds up (some gold loans)
function bulletLoan(loan, txns, today) {
  const rate = (num(loan.rate) || 0) / 100;
  const events = txns
    .filter((t) => (t.kind === 'payment' || t.kind === 'borrow') && toDate(t.on_date) <= today)
    .map((t) => ({ date: toDate(t.on_date), kind: t.kind, amount: Number(t.amount) }))
    .sort((a, b) => a.date - b.date);
  let principal = Number(loan.principal);
  let borrowed = principal;
  let interest = 0;
  let interestTotal = 0;
  let last = toDate(loan.started_on);
  const accrue = (to) => {
    const added = principal * rate * yearsBetween(last, to);
    interest += added;
    interestTotal += added;
    last = to;
  };
  for (const ev of events) {
    accrue(ev.date);
    if (ev.kind === 'borrow') {
      principal += ev.amount;
      borrowed += ev.amount;
    } else {
      const toInterest = Math.min(interest, ev.amount);
      interest -= toInterest;
      principal = Math.max(0, principal - (ev.amount - toInterest));
    }
  }
  accrue(today);
  const start = toDate(loan.started_on);
  const end = loan.tenure_months ? dueDate(start, start.getDate(), Number(loan.tenure_months)) : null;
  const outstanding = principal + interest;
  return {
    outstanding: round2(outstanding),
    borrowed: round2(borrowed),
    interestPaid: round2(interestTotal - interest), // interest you have already paid
    interestSoFar: round2(interestTotal),
    monthly: null,
    payoffDate: outstanding > 0.5 ? end : null,
  };
}

// You type the balance (credit card): last balance − payments since + new spends
function manualLoan(loan, txns, today) {
  const sorted = txns.filter((t) => toDate(t.on_date) <= today).sort((a, b) => toDate(a.on_date) - toDate(b.on_date));
  let balance = Number(loan.principal);
  for (const t of sorted) {
    if (t.kind === 'balance') balance = Number(t.amount);
    if (t.kind === 'payment') balance = Math.max(0, balance - Number(t.amount));
    if (t.kind === 'borrow') balance += Number(t.amount);
  }
  const r = (num(loan.rate) || 0) / 100 / 12;
  return { outstanding: round2(balance), borrowed: round2(balance), monthly: r ? round2(balance * r) : null };
}

// Everything the screens show for one loan
export function loanStats(loan, txns, today) {
  let stats;
  if (loan.closed_on) stats = { outstanding: 0, borrowed: Number(loan.principal), closed: true };
  else if (loan.style === 'emi') stats = emiLoan(loan, txns, today);
  else if (loan.style === 'interest_only') stats = interestOnlyLoan(loan, txns, today);
  else if (loan.style === 'bullet') stats = bulletLoan(loan, txns, today);
  else stats = manualLoan(loan, txns, today);
  const borrowed = stats.borrowed || Number(loan.principal);
  const paidPct = borrowed > 0 ? Math.max(0, Math.min(100, Math.round(((borrowed - stats.outstanding) / borrowed) * 100))) : 100;
  return { loan, type: loanType(loan.type), paidPct, ...stats };
}

// ------------------------------------------------------------
// Whole portfolio: totals, where the money is, best / worst, 80C, net worth
// ------------------------------------------------------------
export function financialYear(today) {
  const y = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
  return { from: new Date(y, 3, 1), to: new Date(y + 1, 3, 1), label: `${y}–${String(y + 1).slice(2)}` };
}

export function portfolioSummary(invStats, loanStatsList, today) {
  const open = invStats.filter((s) => !s.inv.closed_on);
  const invested = round2(open.reduce((s, x) => s + x.invested, 0));
  const value = round2(open.reduce((s, x) => s + x.value, 0));
  const gain = round2(open.reduce((s, x) => s + x.gain, 0));
  const gainBase = open.filter((x) => x.known).reduce((s, x) => s + x.invested, 0);
  const gainPct = gainBase > 0 ? Math.round((gain / gainBase) * 1000) / 10 : null;

  // Yearly return for everything together
  const flows = open.filter((x) => x.known).flatMap((x) => x.flows);
  const first = flows.reduce((a, f) => (!a || f.date < a ? f.date : a), null);
  const knownValue = open.filter((x) => x.known).reduce((s, x) => s + x.value, 0);
  const yearly = first && today - first >= XIRR_MIN_DAYS * DAY ? xirr([...flows, { date: today, amount: knownValue }]) : null;

  // Where the money is (by value now)
  const byType = new Map();
  for (const x of open) byType.set(x.type.key, (byType.get(x.type.key) || 0) + x.value);
  const allocation = [...byType.entries()]
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([key, v], i) => ({ type: investmentType(key), value: round2(v), pct: value > 0 ? Math.round((v / value) * 1000) / 10 : 0, colour: ALLOCATION_COLOURS[i % ALLOCATION_COLOURS.length] }));

  // Best and worst (by gain %)
  const ranked = open.filter((x) => x.gainPct !== null && x.invested > 0).sort((a, b) => b.gainPct - a.gainPct);
  const best = ranked.length >= 2 ? ranked[0] : null;
  const worst = ranked.length >= 2 ? ranked[ranked.length - 1] : null;

  // 80C: money put into tax-saver investments this financial year
  const fy = financialYear(today);
  const tax80c = round2(
    invStats
      .filter((x) => x.inv.tax_saver)
      .flatMap((x) => x.flows)
      .filter((f) => f.kind === 'invest' && f.date >= fy.from && f.date < fy.to)
      .reduce((s, f) => s - f.amount, 0)
  );

  // Loans
  const openLoans = loanStatsList.filter((l) => !l.loan.closed_on);
  const loansLeft = round2(openLoans.reduce((s, l) => s + l.outstanding, 0));
  const monthlyOut = round2(openLoans.reduce((s, l) => s + (l.monthly || 0), 0));
  const debtFree = openLoans.every((l) => l.payoffDate) && openLoans.length ? openLoans.reduce((a, l) => (l.payoffDate > a ? l.payoffDate : a), openLoans[0].payoffDate) : null;

  return {
    invested,
    value,
    gain,
    gainPct,
    colour: gainColour(gainPct),
    yearly,
    allocation,
    best,
    worst,
    tax80c,
    fy,
    loansLeft,
    monthlyOut,
    debtFree,
    netWorth: round2(value - loansLeft),
  };
}

// ------------------------------------------------------------
// Database
// ------------------------------------------------------------
export async function fetchPortfolio() {
  const [investments, investmentTxns, loans, loanTxns] = await Promise.all([
    run(db().from('investments').select('*').order('created_at', { ascending: true })),
    run(db().from('investment_txns').select('*').order('on_date', { ascending: true }).limit(5000)),
    run(db().from('loans').select('*').order('created_at', { ascending: true })),
    run(db().from('loan_txns').select('*').order('on_date', { ascending: true }).limit(5000)),
  ]);
  return { investments, investmentTxns, loans, loanTxns };
}

// The loan behind a monthly "Pay EMI" reminder (so ticking it asks "How much?")
export async function loanBillForRoutine(routineId) {
  const rows = await run(db().from('loans').select('*').eq('reminder_routine_id', routineId).limit(1));
  const loan = rows[0];
  if (!loan) return null;
  const amount = loan.style === 'emi' ? Number(loan.emi) || emiFor(loan.principal, loan.rate, loan.tenure_months) : loan.style === 'interest_only' ? Math.round((Number(loan.principal) * Number(loan.rate || 0)) / 1200) : null;
  return { category: 'emi', item: loanType(loan.type).money, amount };
}

// Only what the daily Money form needs ("Add to which investment?")
export async function fetchOpenInvestments() {
  return run(db().from('investments').select('id, type, name, monthly_amount, closed_on').is('closed_on', null).order('created_at', { ascending: true }));
}

export const createInvestment = (fields) => run(db().from('investments').insert(fields).select('*').single());
export const updateInvestment = (id, changes) => run(db().from('investments').update(changes).eq('id', id).select('*').single());
export const deleteInvestment = (id) => run(db().from('investments').delete().eq('id', id));
export const createInvestmentTxn = (fields) => run(db().from('investment_txns').insert(fields).select('*').single());
export const deleteInvestmentTxn = (id) => run(db().from('investment_txns').delete().eq('id', id));

export const createLoan = (fields) => run(db().from('loans').insert(fields).select('*').single());
export const updateLoan = (id, changes) => run(db().from('loans').update(changes).eq('id', id).select('*').single());
export const deleteLoan = (id) => run(db().from('loans').delete().eq('id', id));
export const createLoanTxn = (fields) => run(db().from('loan_txns').insert(fields).select('*').single());
export const deleteLoanTxn = (id) => run(db().from('loan_txns').delete().eq('id', id));
