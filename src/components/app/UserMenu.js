'use client';

// ============================================================
// ACCOUNT MENU — the round button with your first letter.
// Shows your name and email, and the Sign out button.
// ============================================================

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { saveRememberChoice } from '@/lib/rememberMe';
import { usePreferences } from '../Preferences';

export default function UserMenu({ name, email }) {
  const { t } = usePreferences();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const wrapperRef = useRef(null);

  // Close when clicking elsewhere or pressing Escape
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (!wrapperRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  async function handleSignOut() {
    setBusy(true);
    await createClient()?.auth.signOut();
    saveRememberChoice(true); // clear the "keep me signed in" cookies
    router.replace('/login');
    router.refresh();
  }

  const initial = (name || email || '?').trim().charAt(0).toUpperCase();

  return (
    <div ref={wrapperRef} className={`user-menu${open ? ' open' : ''}`}>
      <button
        type="button"
        className="user-avatar"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={t('accountMenu')}
        onClick={() => setOpen((v) => !v)}
      >
        {initial}
      </button>

      <div className="user-dropdown" role="menu">
        <div className="user-info">
          <strong>{name}</strong>
          <span>{email}</span>
        </div>
        <button type="button" role="menuitem" className="user-signout" onClick={handleSignOut} disabled={busy}>
          {t('signOut')}
        </button>
      </div>
    </div>
  );
}
