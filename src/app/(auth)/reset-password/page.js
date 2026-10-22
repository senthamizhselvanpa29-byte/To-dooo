// ============================================================
// NEW PASSWORD PAGE  →  /reset-password
// Opened from the "forgot password" email link.
// The form itself is in src/components/auth/ResetPasswordForm.js
// ============================================================

import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata = { title: 'New Password' };

export default async function ResetPasswordPage() {
  // The email link logs the user in for a short time so they can
  // choose a new password. No login = link missing or expired.
  const user = await getCurrentUser();
  return <ResetPasswordForm hasSession={Boolean(user)} />;
}
