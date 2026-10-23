// ============================================================
// UPCOMING PAGE  →  /upcoming   (only for logged-in users)
// Next 7 days + later, and the month calendar.
// The parts are in src/components/upcoming/
// ============================================================

import { redirect } from 'next/navigation';
import AppShell from '@/components/app/AppShell';
import UpcomingBoard from '@/components/upcoming/UpcomingBoard';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata = { title: 'Upcoming' };

export default async function UpcomingPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!user.user_metadata?.phone) redirect('/complete-profile');

  return (
    <AppShell name={user.user_metadata?.full_name || user.email} email={user.email}>
      <UpcomingBoard />
    </AppShell>
  );
}
