// ============================================================
// FREE vs PRO — prices, Free limits and "is this user Pro?"
//
// Keep these numbers the same as the database
// (supabase/migrations/0006_plans_payments.sql):
//   • free trial: 45 days of Pro for every new user
//   • Free limits: 5 habits, 3 lists, 3 steps in a big plan
//   • Pro only: calendar view, monthly report
// Tasks are unlimited for everyone.
// ============================================================

import { createClient } from '@/lib/supabase/client';

export const TRIAL_DAYS = 45;

// Prices in rupees. The server uses these too, so nobody can pay less.
export const PLANS = {
  monthly: { price: 199, labelKey: 'planMonthly', periodKey: 'perMonth' },
  yearly: { price: 1499, labelKey: 'planYearly', periodKey: 'perYear' },
  lifetime: { price: 15000, labelKey: 'planLifetime', periodKey: 'oneTime' },
};

export const FREE_LIMITS = { habits: 5, lists: 3, steps: 3 };

// Lifetime users: AI (coming later) is limited to this many uses a month
export const LIFETIME_AI_PER_MONTH = 100;

// Remind this many days before Pro ends
export const REMIND_DAYS = 3;

// Yearly saves this much compared with 12 months (≈ 37%)
export const YEARLY_SAVING = Math.round((1 - PLANS.yearly.price / (PLANS.monthly.price * 12)) * 100);

// plan row → true when Pro right now (the trial counts as Pro)
export function isProPlan(plan, now = new Date()) {
  if (!plan) return false;
  return plan.plan === 'lifetime' || (plan.pro_until && new Date(plan.pro_until) > now);
}

// Whole days until Pro ends (0 when already ended, null for lifetime)
export function daysLeft(plan, now = new Date()) {
  if (!plan?.pro_until) return null;
  return Math.max(0, Math.ceil((new Date(plan.pro_until) - now) / 86400000));
}

// My plan from the database (starts the free trial the first time)
export async function fetchMyPlan() {
  const { data, error } = await createClient().rpc('my_plan');
  if (error) throw error;
  return data;
}
