// ============================================================
// Supabase connection used INSIDE THE BROWSER
// (login form, sign-up form, sign-out button, etc.)
// ============================================================

import { createBrowserClient } from '@supabase/ssr';
import { SUPABASE_URL, SUPABASE_KEY, isSupabaseConfigured } from './config';

// Returns the Supabase connection, or null if the keys are not set yet.
export function createClient() {
  if (!isSupabaseConfigured) return null;
  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
}
