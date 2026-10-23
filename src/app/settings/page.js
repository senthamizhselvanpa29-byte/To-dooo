// ============================================================
// SETTINGS PAGE  →  /settings   (only for logged-in users)
// Shift, wake-up and planning times, daily routine, repeating tasks.
// The parts are in src/components/settings/
// ============================================================

import { redirect } from 'next/navigation';
import AppShell from '@/components/app/AppShell';
import SettingsBoard from '@/components/settings/SettingsBoard';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!user.user_metadata?.phone) redirect('/complete-profile');

  return (
    <AppShell name={user.user_metadata?.full_name || user.email} email={user.email}>
      <SettingsBoard />
    </AppShell>
  );
}
