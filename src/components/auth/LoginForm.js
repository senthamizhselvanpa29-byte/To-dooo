'use client';

// ============================================================
// LOGIN FORM — email + password, or "Continue with Google"
// ============================================================

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { errorKeyFor } from '@/lib/authErrors';
import { startGoogleSignIn } from '@/lib/googleSignIn';
import { saveRememberChoice } from '@/lib/rememberMe';
import { isValidEmail } from '@/lib/validation';
import { usePreferences } from '../Preferences';
import { CheckIcon, MailIcon } from '../Icons';
import { CardHeader, FormAlert, GoogleButton, PasswordField, SubmitButton, TextField } from './FormParts';

export default function LoginForm() {
  const { t } = usePreferences();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [errors, setErrors] = useState({});
  // An email link that failed sends the user here with ?error=link
  const [alertKey, setAlertKey] = useState(searchParams.get('error') === 'link' ? 'errLinkExpired' : null);
  const [busy, setBusy] = useState(false);

  // ----- Sign in with email + password -----
  async function handleSubmit(e) {
    e.preventDefault();
    setAlertKey(null);

    // 1. Check the boxes are filled in correctly
    const newErrors = {};
    if (!isValidEmail(email)) newErrors.email = t('errEmail');
    if (!password) newErrors.password = t('errPasswordRequired');
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    // 2. Ask Supabase to log in
    const supabase = createClient();
    if (!supabase) return setAlertKey('errNotConnected');

    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });

    if (error) {
      setBusy(false);
      return setAlertKey(errorKeyFor(error));
    }

    // 3. Success → remember the tick-box choice and open the planner
    saveRememberChoice(keepSignedIn);
    router.replace('/today');
    router.refresh();
  }

  // ----- Continue with Google -----
  async function handleGoogle() {
    setAlertKey(null);
    const supabase = createClient();
    if (!supabase) return setAlertKey('errNotConnected');

    setBusy(true);
    saveRememberChoice(keepSignedIn);
    const error = await startGoogleSignIn(supabase);
    if (error) {
      setBusy(false);
      setAlertKey(errorKeyFor(error));
    }
  }

  return (
    <>
      <CardHeader title={t('loginTitle')} subtitle={t('loginSubtitle')} />

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <FormAlert>{alertKey && t(alertKey)}</FormAlert>

        <TextField
          id="email"
          type="email"
          label={t('emailLabel')}
          placeholder={t('emailPlaceholder')}
          autoComplete="username email"
          icon={<MailIcon className="field-icon" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />

        <PasswordField
          id="password"
          label={t('passwordLabel')}
          placeholder={t('passwordPlaceholder')}
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          labelExtra={
            <Link href="/forgot-password" className="text-link">
              {t('forgotLink')}
            </Link>
          }
        />

        <div className="form-extras">
          <label className="checkbox-container">
            <input type="checkbox" checked={keepSignedIn} onChange={(e) => setKeepSignedIn(e.target.checked)} />
            <span className="custom-check">
              <CheckIcon />
            </span>
            <span className="checkbox-text">{t('keepSignedIn')}</span>
          </label>
        </div>

        <SubmitButton busy={busy}>{t('signIn')}</SubmitButton>
        <GoogleButton onClick={handleGoogle} disabled={busy} />

        <p className="form-footer">
          <span>{t('noAccount')}</span>
          <Link href="/signup" className="text-link highlight">
            {t('signUpLink')}
          </Link>
        </p>
      </form>
    </>
  );
}
