'use client';

// ============================================================
// "Free plan allows 5 habits. Go Pro for unlimited ✨  [Go Pro]"
// Shown where a Free limit is reached.
//   <UpgradeNote what="habits" />   what: habits | lists | steps | investments | loans
// ============================================================

import Link from 'next/link';
import { FREE_LIMITS } from '@/lib/plans';
import { usePreferences } from '../Preferences';

const WORD_KEYS = { habits: 'limitHabits', lists: 'limitLists', steps: 'limitSteps', investments: 'limitInvestmentsWord', loans: 'limitLoansWord' };

export default function UpgradeNote({ what }) {
  const { t } = usePreferences();
  return (
    <div className="upgrade-note" role="status">
      <span>{t('freeLimitReached', { count: FREE_LIMITS[what], what: t(WORD_KEYS[what]) })}</span>
      <Link href="/pro" className="save-btn small">
        ✨ {t('goPro')}
      </Link>
    </div>
  );
}
