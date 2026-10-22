'use client';

// ============================================================
// FORM PIECES shared by all account forms
// - CardHeader:    big title + small line under it
// - TextField:     a labelled input box with an icon
// - PasswordField: like TextField, with a show/hide eye button
// - FormAlert:     red error or green success message
// - SubmitButton:  the big gradient button (shows a spinner while busy)
// - GoogleButton:  "Continue with Google"
// ============================================================

import { useState } from 'react';
import { usePreferences } from '../Preferences';
import { EyeIcon, EyeOffIcon, GoogleLogo, LockIcon } from '../Icons';

export function CardHeader({ title, subtitle }) {
  return (
    <div className="login-header">
      <h1 className="login-title">{title}</h1>
      {subtitle && <p className="login-subtitle">{subtitle}</p>}
    </div>
  );
}

export function TextField({ id, label, icon, error, labelExtra, children, ...inputProps }) {
  return (
    <div className={`form-field${error ? ' has-error' : ''}`}>
      <div className="field-label-row">
        <label htmlFor={id} className="field-label">
          {label}
        </label>
        {labelExtra}
      </div>
      <div className="field-input-box">
        {icon}
        {children || (
          <input
            id={id}
            name={id}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-error` : undefined}
            {...inputProps}
          />
        )}
      </div>
      {error && (
        <span id={`${id}-error`} className="field-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

export function PasswordField({ id, label, error, labelExtra, ...inputProps }) {
  const { t } = usePreferences();
  const [visible, setVisible] = useState(false);

  return (
    <div className={`form-field${error ? ' has-error' : ''}`}>
      <div className="field-label-row">
        <label htmlFor={id} className="field-label">
          {label}
        </label>
        {labelExtra}
      </div>
      <div className="field-input-box">
        <LockIcon className="field-icon" />
        <input
          id={id}
          name={id}
          type={visible ? 'text' : 'password'}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          {...inputProps}
        />
        <button
          type="button"
          className="icon-btn"
          aria-label={visible ? t('hidePassword') : t('showPassword')}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {error && (
        <span id={`${id}-error`} className="field-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

export function FormAlert({ type = 'error', title, children }) {
  if (!children && !title) return null;
  return (
    <div className={`form-alert ${type}`} role={type === 'error' ? 'alert' : 'status'}>
      {title && <strong>{title}</strong>}
      {children && <span>{children}</span>}
    </div>
  );
}

export function SubmitButton({ busy, children }) {
  return (
    <button type="submit" className={`submit-btn${busy ? ' loading' : ''}`} disabled={busy} aria-busy={busy}>
      <span className="btn-text">{children}</span>
      <span className="btn-spinner" />
    </button>
  );
}

export function GoogleButton({ onClick, disabled }) {
  const { t } = usePreferences();
  return (
    <>
      <div className="social-divider">
        <span>{t('or')}</span>
      </div>
      <button type="button" className="google-auth-btn" onClick={onClick} disabled={disabled}>
        <GoogleLogo className="google-logo" />
        <span>{t('continueGoogle')}</span>
      </button>
    </>
  );
}
