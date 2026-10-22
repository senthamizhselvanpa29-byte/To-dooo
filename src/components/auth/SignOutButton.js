'use client';

// ============================================================
// SIGN OUT BUTTON
// ============================================================

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { saveRememberChoice } from '@/lib/rememberMe';
import { usePreferences } from '../Preferences';

export default function SignOutButton() {
  const { t } = usePreferences();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleSignOut() {
    setBusy(true);
    await createClient()?.auth.signOut();
    saveRememberChoice(true); // clear the "keep me signed in" cookies
    router.replace('/login');
    router.refresh();
  }

  return (
    <button type="button" className="google-auth-btn" onClick={handleSignOut} disabled={busy}>
      {t('signOut')}
    </button>
  );
}
