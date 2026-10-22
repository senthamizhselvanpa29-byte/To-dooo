'use client';

// ============================================================
// "ONE LAST STEP" FORM
// People who sign up with Google don't give us a phone number,
// so we ask for it once here (name is pre-filled from Google).
// ============================================================

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { errorKeyFor } from '@/lib/authErrors';
import { usePreferences } from '../Preferences';
import { UserIcon } from '../Icons';
import { CardHeader, FormAlert, SubmitButton, TextField } from './FormParts';
import PhoneField, { usePhoneField } from './PhoneField';

export default function CompleteProfileForm({ initialName }) {
  const { t } = usePreferences();
  const router = useRouter();

  const [fullName, setFullName] = useState(initialName || '');
  const phone = usePhoneField();
  const [errors, setErrors] = useState({});
  const [alertKey, setAlertKey] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setAlertKey(null);

    const fullPhone = phone.normalized();
    const newErrors = {};
    if (!fullName.trim()) newErrors.fullName = t('errFullName');
    if (!fullPhone) newErrors.phone = t('errPhone');
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const supabase = createClient();
    if (!supabase) return setAlertKey('errNotConnected');

    setBusy(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName.trim(), phone: fullPhone },
    });
    if (error) {
      setBusy(false);
      return setAlertKey(errorKeyFor(error));
    }

    router.replace('/today');
    router.refresh();
  }

  return (
    <>
      <CardHeader title={t('completeTitle')} subtitle={t('completeSubtitle')} />
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
        <PhoneField field={phone} error={errors.phone} />
        <SubmitButton busy={busy}>{t('continue')}</SubmitButton>
      </form>
    </>
  );
}
