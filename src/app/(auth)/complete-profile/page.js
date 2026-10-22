// ============================================================
// "ONE LAST STEP" PAGE  →  /complete-profile
// Asks Google sign-up users for their phone number.
// The form itself is in src/components/auth/CompleteProfileForm.js
// ============================================================

import { redirect } from 'next/navigation';
import CompleteProfileForm from '@/components/auth/CompleteProfileForm';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata = { title: 'Complete Your Profile' };

export default async function CompleteProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.user_metadata?.phone) redirect('/today');

  const googleName = user.user_metadata?.full_name || user.user_metadata?.name || '';
  return <CompleteProfileForm initialName={googleName} />;
}
