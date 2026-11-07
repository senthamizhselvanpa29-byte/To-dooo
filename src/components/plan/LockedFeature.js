'use client';

// ============================================================
// 🔒 A Pro-only part of a page (calendar, monthly report).
//   <LockedFeature title="Calendar" text="See your whole month…" />
// ============================================================

import Link from 'next/link';
import { usePreferences } from '../Preferences';

export default function LockedFeature({ title, text }) {
  const { t } = usePreferences();
  return (
    <section className="card locked-feature">
      <span className="locked-icon" aria-hidden="true">
        🔒
      </span>
      <h2>{title}</h2>
      <p>{text}</p>
      <Link href="/pro" className="save-btn">
        ✨ {t('goPro')}
      </Link>
    </section>
  );
}
