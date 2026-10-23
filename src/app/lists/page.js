// ============================================================
// LISTS PAGE  →  /lists   (only for logged-in users)
// Home, Work, Study… The parts are in src/components/lists/
// ============================================================

import { redirect } from 'next/navigation';
import AppShell from '@/components/app/AppShell';
import ListsBoard from '@/components/lists/ListsBoard';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata = { title: 'Lists' };

export default async function ListsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!user.user_metadata?.phone) redirect('/complete-profile');

  return (
    <AppShell name={user.user_metadata?.full_name || user.email} email={user.email}>
      <ListsBoard />
    </AppShell>
  );
}
