// ============================================================
// FORGOT PASSWORD PAGE  →  /forgot-password
// The form itself is in src/components/auth/ForgotPasswordForm.js
// ============================================================

import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';

export const metadata = { title: 'Forgot Password' };

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
