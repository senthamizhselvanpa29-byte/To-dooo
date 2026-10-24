// ============================================================
// REPORTS PAGE  →  /reports   (only for logged-in users)
// Weekly and monthly reports: colours, routine, best day, most postponed.
// The parts are in src/components/reports/
// ============================================================

import { redirect } from 'next/navigation';
import AppShell from '@/components/app/AppShell';
import ReportsBoard from '@/components/reports/ReportsBoard';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata = { title: 'Reports' };

export default async function ReportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!user.user_metadata?.phone) redirect('/complete-profile');

  return (
    <AppShell name={user.user_metadata?.full_name || user.email} email={user.email}>
      <ReportsBoard />
    </AppShell>
  );
}
