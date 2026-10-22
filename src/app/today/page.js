// ============================================================
// TODAY PAGE  →  /today   (only for logged-in users)
// Temporary page for Week 1. The real planner comes in Week 2.
// ============================================================

import { redirect } from 'next/navigation';
import GalaxyBackground from '@/components/GalaxyBackground';
import TopBar from '@/components/TopBar';
import TodayPlaceholder from '@/components/today/TodayPlaceholder';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata = { title: 'Today' };

export default async function TodayPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  // Google sign-ups have no phone number yet → ask for it once
  if (!user.user_metadata?.phone) redirect('/complete-profile');

  const name = user.user_metadata?.full_name?.split(' ')[0] || user.email;

  return (
    <>
      <GalaxyBackground />
      <TopBar />
      <main className="page-container">
        <TodayPlaceholder name={name} />
      </main>
    </>
  );
}
