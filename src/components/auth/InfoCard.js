'use client';

// ============================================================
// SIMPLE INFORMATION BOX — title + message + "back to sign in"
// Used by the Terms and Privacy pages until they are written.
// ============================================================

import Link from 'next/link';
import { usePreferences } from '../Preferences';
import { CardHeader } from './FormParts';

export default function InfoCard({ titleKey, messageKey }) {
  const { t } = usePreferences();
  return (
    <>
      <CardHeader title={t(titleKey)} subtitle={t(messageKey)} />
      <p className="form-footer">
        <Link href="/login" className="text-link highlight">
          {t('backToLogin')}
        </Link>
      </p>
    </>
  );
}
