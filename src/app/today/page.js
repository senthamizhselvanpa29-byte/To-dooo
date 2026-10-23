// ============================================================
// TODAY PAGE  →  /today   (only for logged-in users)
// The planner's front page. The parts are in src/components/today/
// ============================================================

import { redirect } from 'next/navigation';
import AppShell from '@/components/app/AppShell';
import TodayBoard from '@/components/today/TodayBoard';
import { getTodaysQuote } from '@/lib/dailyQuote';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata = { title: 'Today' };

export default async function TodayPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  // Google sign-ups have no phone number yet → ask for it once
  if (!user.user_metadata?.phone) redirect('/complete-profile');

  const fullName = user.user_metadata?.full_name || user.email;
  const firstName = fullName.split(' ')[0];

  return (
    <AppShell name={fullName} email={user.email}>
      <TodayBoard name={firstName} quote={getTodaysQuote()} />
    </AppShell>
  );
}
