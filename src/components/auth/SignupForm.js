'use client';

// ============================================================
// SIGN-UP FORM
// Full name, email, phone (+91 already filled), password twice,
// and the "I agree to Terms & Privacy Policy" tick box.
// ============================================================

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { errorKeyFor } from '@/lib/authErrors';
import { startGoogleSignIn } from '@/lib/googleSignIn';
import { saveRememberChoice } from '@/lib/rememberMe';
import { isValidEmail, MIN_PASSWORD_LENGTH } from '@/lib/validation';
import { usePreferences } from '../Preferences';
import { CheckIcon, MailIcon, UserIcon } from '../Icons';
import { CardHeader, FormAlert, GoogleButton, PasswordField, SubmitButton, TextField } from './FormParts';
import PhoneField, { usePhoneField } from './PhoneField';

export default function SignupForm() {
  const { t } = usePreferences();
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const phone = usePhoneField();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agreed, setAgreed] = useState(false);

  const [errors, setErrors] = useState({});
  const [alertKey, setAlertKey] = useState(null);
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState(null); // email the confirmation link was sent to

  // ----- Create the account -----
  async function handleSubmit(e) {
    e.preventDefault();
    setAlertKey(null);

    // 1. Check every box
    const fullPhone = phone.normalized();
    const newErrors = {};
    if (!fullName.trim()) newErrors.fullName = t('errFullName');
    if (!isValidEmail(email)) newErrors.email = t('errEmail');
    if (!fullPhone) newErrors.phone = t('errPhone');
    if (password.length < MIN_PASSWORD_LENGTH) newErrors.password = t('errPasswordShort');
    if (confirm !== password) newErrors.confirm = t('errPasswordMatch');
    if (!agreed) newErrors.agree = t('errAgree');
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    // 2. Ask Supabase to create the account.
    //    Name and phone are saved with the account ("user metadata"),
    //    and copied to the profiles table (see supabase/migrations).
    const supabase = createClient();
    if (!supabase) return setAlertKey('errNotConnected');

    setBusy(true);
    const cleanEmail = email.trim();
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: { full_name: fullName.trim(), phone: fullPhone },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/today`,
      },
    });
    setBusy(false);

    if (error) return setAlertKey(errorKeyFor(error));

    // Supabase hides "already registered" for privacy: it returns a user with no identities.
    if (data.user && data.user.identities?.length === 0) return setAlertKey('errUserExists');

    // 3a. Email confirmation is OFF in Supabase → already logged in
    if (data.session) {
      saveRememberChoice(true);
      router.replace('/today');
      router.refresh();
      return;
    }

    // 3b. Email confirmation is ON → ask the user to check their email
    setSentTo(cleanEmail);
  }

  // ----- Continue with Google -----
  async function handleGoogle() {
    setAlertKey(null);
    const supabase = createClient();
    if (!supabase) return setAlertKey('errNotConnected');

    setBusy(true);
    saveRememberChoice(true);
    const error = await startGoogleSignIn(supabase);
    if (error) {
      setBusy(false);
      setAlertKey(errorKeyFor(error));
    }
  }

  // ----- After sign-up: "Check your email" message -----
  if (sentTo) {
    return (
      <>
        <CardHeader title={t('checkEmailTitle')} />
        <FormAlert type="success">{t('checkEmailMsg', { email: sentTo })}</FormAlert>
        <p className="form-footer">
          <Link href="/login" className="text-link highlight">
            {t('backToLogin')}
          </Link>
        </p>
      </>
    );
  }

  // ----- "I agree to the Terms and Privacy Policy" with links -----
  const agreeParts = t('agreeText').split(/(\{terms\}|\{privacy\})/);
  const agreeSentence = agreeParts.map((part, i) => {
    if (part === '{terms}')
      return (
        <Link key={i} href="/terms" className="text-link" target="_blank">
          {t('terms')}
        </Link>
      );
    if (part === '{privacy}')
      return (
        <Link key={i} href="/privacy" className="text-link" target="_blank">
          {t('privacy')}
        </Link>
      );
    return part;
  });

  return (
    <>
      <CardHeader title={t('signupTitle')} subtitle={t('signupSubtitle')} />

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <FormAlert>{alertKey && t(alertKey)}</FormAlert>

        <TextField
          id="fullName"
          type="text"
          label={t('fullNameLabel')}
          placeholder={t('fullNamePlaceholder')}
          autoComplete="name"
          icon={<UserIcon className="field-icon" />}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          error={errors.fullName}
        />

        <TextField
          id="email"
          type="email"
          label={t('emailLabel')}
          placeholder={t('emailPlaceholder')}
          autoComplete="email"
          icon={<MailIcon className="field-icon" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />

        <PhoneField field={phone} error={errors.phone} />

        <PasswordField
          id="password"
          label={t('passwordLabel')}
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

        <div className={`form-field${errors.agree ? ' has-error' : ''}`}>
          <label className="checkbox-container">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            <span className="custom-check">
              <CheckIcon />
            </span>
            <span className="checkbox-text">{agreeSentence}</span>
          </label>
          {errors.agree && (
            <span className="field-error" role="alert">
              {errors.agree}
            </span>
          )}
        </div>

        <SubmitButton busy={busy}>{t('createAccount')}</SubmitButton>
        <GoogleButton onClick={handleGoogle} disabled={busy} />

        <p className="form-footer">
          <span>{t('haveAccount')}</span>
          <Link href="/login" className="text-link highlight">
            {t('signInLink')}
          </Link>
        </p>
      </form>
    </>
  );
}
