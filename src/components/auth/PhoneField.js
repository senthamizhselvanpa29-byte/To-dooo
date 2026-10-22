'use client';

// ============================================================
// PHONE NUMBER BOX
// Country code (starts as +91, can be changed) + phone number.
// Used on the sign-up page and the "one last step" page.
// ============================================================

import { useState } from 'react';
import { normalizePhone } from '@/lib/validation';
import { usePreferences } from '../Preferences';
import { PhoneIcon } from '../Icons';
import { TextField } from './FormParts';

// Keeps the two parts of the phone number.
export function usePhoneField(initialCode = '+91', initialNumber = '') {
  const [code, setCode] = useState(initialCode);
  const [number, setNumber] = useState(initialNumber);
  return {
    code,
    setCode,
    number,
    setNumber,
    // The full number like "+919876543210", or null if it's not valid
    normalized: () => normalizePhone(code, number),
  };
}

export default function PhoneField({ field, error }) {
  const { t } = usePreferences();

  return (
    <TextField id="phone" label={t('phoneLabel')} error={error} icon={<PhoneIcon className="field-icon" />}>
      <input
        className="country-code"
        type="tel"
        inputMode="tel"
        autoComplete="tel-country-code"
        aria-label={t('countryCode')}
        maxLength={5}
        value={field.code}
        onChange={(e) => field.setCode(e.target.value)}
      />
      <span className="phone-divider" aria-hidden="true" />
      <input
        id="phone"
        name="phone"
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder={t('phonePlaceholder')}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? 'phone-error' : undefined}
        value={field.number}
        onChange={(e) => field.setNumber(e.target.value)}
      />
    </TextField>
  );
}
