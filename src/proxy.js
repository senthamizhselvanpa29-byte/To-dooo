// ============================================================
// Runs before every page loads. It only calls the login guard.
// The real work is in src/lib/supabase/proxy.js
// ============================================================

import { updateSession } from '@/lib/supabase/proxy';

export async function proxy(request) {
  return updateSession(request);
}

export const config = {
  // Skip images, icons and other files that don't need a login check.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)'],
};
