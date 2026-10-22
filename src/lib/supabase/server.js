// ============================================================
// Supabase connection used ON THE SERVER
// (pages that check who is logged in, and the email-link handlers)
// ============================================================

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SUPABASE_URL, SUPABASE_KEY, isSupabaseConfigured } from './config';

// Returns the Supabase connection, or null if the keys are not set yet.
export async function createClient() {
  if (!isSupabaseConfigured) return null;

  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Pages cannot save cookies. That's fine: src/proxy.js keeps
          // the login fresh before every page loads.
        }
      },
    },
  });
}

// Returns the logged-in user, or null if nobody is logged in.
export async function getCurrentUser() {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}
