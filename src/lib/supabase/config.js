// ============================================================
// Supabase settings
// Reads the two Supabase keys from the secret settings
// (.env.local on your computer, Environment Variables on Vercel).
// ============================================================

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

// Newer Supabase projects call it "publishable key", older ones "anon key".
// Either one works.
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// True when both keys are filled in. When false, the pages still open,
// but login shows a "not connected yet" message instead of crashing.
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);
