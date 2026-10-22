'use client';

// ============================================================
// NEW PASSWORD FORM
// Opened from the "forgot password" email link.
// ============================================================

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { errorKeyFor } from '@/lib/authErrors';
import { MIN_PASSWORD_LENGTH } from '@/lib/validation';
import { usePreferences } from '../Preferences';
import { CardHeader, FormAlert, PasswordField, SubmitButton } from './FormParts';

export default function ResetPasswordForm({ hasSession }) {
  const { t } = usePreferences();
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [alertKey, setAlertKey] = useState(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  // Opened without a valid email link (or the link expired)
  if (!hasSession) {
    return (
      <>
        <CardHeader title={t('resetTitle')} />
        <FormAlert>{t('errLinkExpired')}</FormAlert>
        <p className="form-footer">
          <Link href="/forgot-password" className="text-link highlight">
            {t('sendResetLink')}
          </Link>
        </p>
      </>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setAlertKey(null);

    const newErrors = {};
    if (password.length < MIN_PASSWORD_LENGTH) newErrors.password = t('errPasswordShort');
    if (confirm !== password) newErrors.confirm = t('errPasswordMatch');
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const supabase = createClient();
    if (!supabase) return setAlertKey('errNotConnected');

    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setAlertKey(errorKeyFor(error));

    setSaved(true);
    setTimeout(() => {
      router.replace('/today');
      router.refresh();
    }, 1500);
  }

  return (
    <>
      <CardHeader title={t('resetTitle')} subtitle={t('resetSubtitle')} />
      {saved ? (
        <FormAlert type="success">{t('passwordSaved')}</FormAlert>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <FormAlert>{alertKey && t(alertKey)}</FormAlert>
          <PasswordField
            id="password"
            label={t('newPasswordLabel')}
            placeholder={t('newPasswordPlaceholder')}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />
          <PasswordField
            id="confirm"
            label={t('confirmPasswordLabel')}
            placeholder={t('confirmPasswordPlaceholder')}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            error={errors.confirm}
          />
          <SubmitButton busy={busy}>{t('savePassword')}</SubmitButton>
        </form>
      )}
    </>
  );
}
