'use client';

// ============================================================
// FORGOT PASSWORD FORM
// Sends an email with a link. The link opens /reset-password,
// where the user picks a new password.
// ============================================================

import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { errorKeyFor } from '@/lib/authErrors';
import { isValidEmail } from '@/lib/validation';
import { usePreferences } from '../Preferences';
import { MailIcon } from '../Icons';
import { CardHeader, FormAlert, SubmitButton, TextField } from './FormParts';

export default function ForgotPasswordForm() {
  const { t } = usePreferences();

  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [alertKey, setAlertKey] = useState(null);
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setAlertKey(null);

    if (!isValidEmail(email)) return setError(t('errEmail'));
    setError(null);

    const supabase = createClient();
    if (!supabase) return setAlertKey('errNotConnected');

    setBusy(true);
    const cleanEmail = email.trim();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setBusy(false);

    if (resetError) return setAlertKey(errorKeyFor(resetError));
    setSentTo(cleanEmail);
  }

  return (
    <>
      <CardHeader title={t('forgotTitle')} subtitle={sentTo ? null : t('forgotSubtitle')} />

      {sentTo ? (
        <FormAlert type="success" title={t('resetSentTitle')}>
          {t('resetSentMsg', { email: sentTo })}
        </FormAlert>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <FormAlert>{alertKey && t(alertKey)}</FormAlert>
          <TextField
            id="email"
            type="email"
            label={t('emailLabel')}
            placeholder={t('emailPlaceholder')}
            autoComplete="email"
            icon={<MailIcon className="field-icon" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error}
          />
          <SubmitButton busy={busy}>{t('sendResetLink')}</SubmitButton>
        </form>
      )}

      <p className="form-footer">
        <Link href="/login" className="text-link highlight">
          {t('backToLogin')}
        </Link>
      </p>
    </>
  );
}
