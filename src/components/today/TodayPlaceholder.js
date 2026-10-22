'use client';

// ============================================================
// TODAY PAGE (TEMPORARY)
// Shows "Hello, name!" and a sign-out button.
// The real task list arrives in Week 2.
// ============================================================

import { usePreferences } from '../Preferences';
import SignOutButton from '../auth/SignOutButton';

export default function TodayPlaceholder({ name }) {
  const { t } = usePreferences();

  return (
    <div className="login-card today-card">
      <p className="quote-pill">
        <span className="pill-dot" />
        <span>{t('todayTitle')}</span>
      </p>
      <h1 className="login-title">{t('todayHello', { name })}</h1>
      <p className="login-subtitle">{t('todayComingSoon')}</p>
      <SignOutButton />
    </div>
  );
}
