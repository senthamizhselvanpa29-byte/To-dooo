// ============================================================
// 💰 MONEY — reading and saving, months, totals, budget, ₹ format
// Tables: supabase/migrations/0007_money.sql
// Built-in categories: src/data/money.js
// Smart add + calculator: src/lib/moneyParse.js
// ============================================================

import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, LANGS, PAY_MODES, SAVINGS_CATEGORY } from '@/data/money';
import { addDays, formatMonth, formatShortDate, localeFor, startOfDay } from '@/lib/dates';
import { createClient } from '@/lib/supabase/client';

// Budget colours: 🟢 under 80% used · 🟡 80–100% · 🔴 over budget
export const BUDGET_YELLOW_FROM = 80;
export const BUDGET_RED_ABOVE = 100;

// ⭐ Frequent: added this many times in the last FREQUENT_DAYS days
export const FREQUENT_MIN_TIMES = 3;
export const FREQUENT_DAYS = 60;
export const FREQUENT_SHOWN = 5;

// Tell other parts of the page that money changed (Today strip, night planning)
export const MONEY_CHANGED = 'vdou-money-changed';
export const announceMoneyChange = () => window.dispatchEvent(new Event(MONEY_CHANGED));

const COLUMNS = 'id, kind, amount, category, item, custom_category_id, pay_mode, spent_at, note, task_id, created_at';
const db = () => createClient();
const iso = (date) => new Date(date).toISOString();

async function run(query) {
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// Database error → message key (words are in src/locales)
export function moneyErrorKey(error) {
  const text = `${error?.code} ${error?.message}`;
  if (/PGRST205|42P01|42703|schema cache|column .* does not exist|relation .*money_/i.test(text)) return 'errMoneyNotReady';
  return 'errSaveMoney';
}

// ------------------------------------------------------------
// Names in the user's language
// ------------------------------------------------------------
const pick = (names, lang) => names[Math.max(0, LANGS.indexOf(lang))] || names[0];

export const categoriesFor = (kind) => (kind === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES);
export const findCategory = (kind, key) => categoriesFor(kind).find((c) => c.key === key) || null;
export const findItem = (category, key) => category?.items?.find((i) => i.key === key) || null;
export const findMode = (key) => PAY_MODES.find((m) => m.key === key) || null;
export const modeName = (mode, lang) => pick(mode.name, lang);
export const categoryName = (category, lang) => pick(category.name, lang);
export const itemName = (item, lang) => pick(item.name, lang);

// What an entry shows: { emoji, title (item or category), category name }
export function describeEntry(entry, customById, lang) {
  if (entry.category === 'custom') {
    const own = customById?.[entry.custom_category_id];
    const others = findCategory(entry.kind, entry.kind === 'income' ? 'otherin' : 'others');
    return own
      ? { emoji: own.emoji || '🏷️', title: own.name, group: own.name }
      : { emoji: others.emoji, title: categoryName(others, lang), group: categoryName(others, lang) };
  }
  const category = findCategory(entry.kind, entry.category) || findCategory(entry.kind, entry.kind === 'income' ? 'otherin' : 'others');
  const item = findItem(category, entry.item);
  const group = categoryName(category, lang);
  return { emoji: category.emoji, title: item ? itemName(item, lang) : group, group };
}

// ------------------------------------------------------------
// ₹ amounts — Indian style (₹1,20,000), paise only when needed
// ------------------------------------------------------------
export function formatMoney(amount, lang, { hidden = false, sign = '' } = {}) {
  if (hidden) return `${sign}₹•••`;
  const value = Math.abs(Number(amount) || 0);
  const text = new Intl.NumberFormat(localeFor(lang), {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
  return `${sign}₹${text}`;
}

// Add amounts in paise so ₹0.10 + ₹0.20 is exactly ₹0.30
const paise = (amount) => Math.round(Number(amount) * 100);
export const sumAmounts = (entries) => entries.reduce((total, e) => total + paise(e.amount), 0) / 100;

// Income, spent (without savings), saved, balance
export function moneyTotals(entries) {
  const income = sumAmounts(entries.filter((e) => e.kind === 'income'));
  const spent = sumAmounts(entries.filter((e) => e.kind === 'expense' && e.category !== SAVINGS_CATEGORY));
  const saved = sumAmounts(entries.filter((e) => e.kind === 'expense' && e.category === SAVINGS_CATEGORY));
  return { income, spent, saved, balance: Math.round((income - spent - saved) * 100) / 100 };
}

// ------------------------------------------------------------
// Money month: starts on the 1st, or on your salary day (Settings)
// ------------------------------------------------------------
function monthStartDay(year, month, startDay) {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(startDay, lastDay));
}

// The money month that contains `date` → { from, to } (to = start of the next one)
export function moneyPeriod(date = new Date(), startDay = 1) {
  const day = startOfDay(date);
  let from = monthStartDay(day.getFullYear(), day.getMonth(), startDay);
  if (day < from) from = monthStartDay(day.getFullYear(), day.getMonth() - 1, startDay);
  const to = monthStartDay(from.getFullYear(), from.getMonth() + 1, startDay);
  return { from, to };
}

// "November 2026", or "5 Nov – 4 Dec" when the month starts on salary day
export function periodLabel({ from, to }, startDay, lang) {
  if (startDay === 1) return formatMonth(from, lang);
  return `${formatShortDate(from, lang)} – ${formatShortDate(addDays(to, -1), lang)}`;
}

// ------------------------------------------------------------
// Budget: how much is used, colour, safe to spend per day
// ------------------------------------------------------------
export function budgetColour(pct) {
  if (pct > BUDGET_RED_ABOVE) return 'red';
  if (pct >= BUDGET_YELLOW_FROM) return 'yellow';
  return 'green';
}

// Returns null when no budget is set
export function budgetStatus(budget, spent, period, now = new Date()) {
  const limit = Number(budget);
  if (!limit) return null;
  const pct = Math.round((spent / limit) * 100);
  const left = Math.round((limit - spent) * 100) / 100;
  const current = period.from <= now && now < period.to;
  // Days left including today
  const daysLeft = current ? Math.max(1, Math.round((period.to - startOfDay(now)) / 86400000)) : 0;
  return {
    budget: limit,
    spent,
    pct,
    left,
    colour: budgetColour(pct),
    current,
    daysLeft,
    perDay: current && left > 0 ? Math.floor(left / daysLeft) : 0,
  };
}

// ------------------------------------------------------------
// ⭐ Frequent: the same thing (same amount) added 3+ times lately
// ------------------------------------------------------------
export function frequentEntries(recent) {
  const groups = new Map();
  for (const e of recent) {
    const key = [e.kind, e.category, e.item, e.custom_category_id, Number(e.amount), e.pay_mode].join('|');
    const group = groups.get(key) || { entry: e, count: 0, last: 0 };
    group.count += 1;
    group.last = Math.max(group.last, new Date(e.spent_at).getTime());
    groups.set(key, group);
  }
  return [...groups.values()]
    .filter((g) => g.count >= FREQUENT_MIN_TIMES)
    .sort((a, b) => b.count - a.count || b.last - a.last)
    .slice(0, FREQUENT_SHOWN)
    .map((g) => g.entry);
}

// ------------------------------------------------------------
// Database: entries
// ------------------------------------------------------------
export async function fetchMoneyEntries(from, to) {
  return run(
    db()
      .from('money_entries')
      .select(COLUMNS)
      .is('deleted_at', null)
      .gte('spent_at', iso(from))
      .lt('spent_at', iso(to))
      .order('spent_at', { ascending: false })
      .limit(3000)
  );
}

// For ⭐ Frequent
export async function fetchRecentEntries() {
  return run(
    db()
      .from('money_entries')
      .select('kind, amount, category, item, custom_category_id, pay_mode, spent_at')
      .is('deleted_at', null)
      .gte('spent_at', iso(addDays(new Date(), -FREQUENT_DAYS)))
      .order('spent_at', { ascending: false })
      .limit(1000)
  );
}

// fields: { kind, amount, category, item, custom_category_id, pay_mode, spent_at, note, task_id }
export async function createMoneyEntry(fields) {
  return run(db().from('money_entries').insert(fields).select(COLUMNS).single());
}

export async function updateMoneyEntry(id, changes) {
  return run(db().from('money_entries').update(changes).eq('id', id).select(COLUMNS).single());
}

// Deleting only hides it, so "Undo" can bring it back
export const deleteMoneyEntry = (id) => updateMoneyEntry(id, { deleted_at: new Date().toISOString() });
export const restoreMoneyEntry = (id) => updateMoneyEntry(id, { deleted_at: null });

// Was money already saved for this task? (so we don't ask twice)
export async function taskHasMoney(taskId) {
  const rows = await run(db().from('money_entries').select('id').eq('task_id', taskId).is('deleted_at', null).limit(1));
  return rows.length > 0;
}

// ------------------------------------------------------------
// Database: my own categories
// ------------------------------------------------------------
export async function fetchMoneyCategories() {
  return run(db().from('money_categories').select('id, kind, name, emoji, created_at').order('created_at', { ascending: true }));
}

export async function createMoneyCategory({ kind, name, emoji }) {
  return run(
    db().from('money_categories').insert({ kind, name: name.trim(), emoji }).select('id, kind, name, emoji, created_at').single()
  );
}

// Entries in a deleted category show as "Others" (nothing is lost)
export async function deleteMoneyCategory(id) {
  return run(db().from('money_categories').delete().eq('id', id));
}
