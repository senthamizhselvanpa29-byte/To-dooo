'use client';

// ============================================================
// Reminder on Today, 3 days before Pro (or the free trial) ends:
//   "⏳ Your free trial ends in 2 days.  [Go Pro]"
// ============================================================

import Link from 'next/link';
import { REMIND_DAYS } from '@/lib/plans';
import { usePreferences } from '../Preferences';
import { usePlan } from './PlanProvider';

export default function ProReminder() {
  const { t } = usePreferences();
  const { plan, daysLeft, isPro } = usePlan();
  if (!plan || plan.plan === 'lifetime' || !isPro || daysLeft === null || daysLeft > REMIND_DAYS) return null;

  const key = plan.plan === 'trial' ? 'trialEndsIn' : 'proEndsIn';
  return (
    <div className="pro-reminder" role="status">
      <span>⏳ {t(key, { days: daysLeft })}</span>
      <Link href="/pro" className="save-btn small">
        ✨ {t(plan.plan === 'trial' ? 'goPro' : 'renewPro')}
      </Link>
    </div>
  );
}
