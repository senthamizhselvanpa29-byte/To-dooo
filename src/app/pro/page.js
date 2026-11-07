// ============================================================
// GO PRO PAGE  →  /pro   (only for logged-in users)
// Plans, prices and the Razorpay payment window.
// The parts are in src/components/plan/
// ============================================================

import { redirect } from 'next/navigation';
import AppShell from '@/components/app/AppShell';
import ProBoard from '@/components/plan/ProBoard';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata = { title: 'Go Pro' };

export default async function ProPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!user.user_metadata?.phone) redirect('/complete-profile');

  const name = user.user_metadata?.full_name || user.email;
  return (
    <AppShell name={name} email={user.email}>
      <ProBoard name={name} email={user.email} phone={user.user_metadata?.phone} />
    </AppShell>
  );
}
