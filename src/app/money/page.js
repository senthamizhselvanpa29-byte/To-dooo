// ============================================================
// MONEY PAGE  →  /money   (only for logged-in users)
// Daily income & expenses, budget, smart add.
// The parts are in src/components/money/
// ============================================================

import { redirect } from 'next/navigation';
import AppShell from '@/components/app/AppShell';
import MoneyBoard from '@/components/money/MoneyBoard';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata = { title: 'Money' };

export default async function MoneyPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!user.user_metadata?.phone) redirect('/complete-profile');

  return (
    <AppShell name={user.user_metadata?.full_name || user.email} email={user.email}>
      <MoneyBoard />
    </AppShell>
  );
}
