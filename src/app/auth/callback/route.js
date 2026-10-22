// ============================================================
// EMAIL LINK & GOOGLE LOGIN HANDLER  →  /auth/callback
//
// Google login, "confirm your email" links and "reset password"
// links all come back here with a one-time ?code=...
// We swap the code for a login, then open the next page.
// ============================================================

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { FORGET_COOKIE } from '@/lib/rememberMe';
import { safeNextPath } from '@/lib/safeRedirect';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeNextPath(searchParams.get('next'));

  const supabase = await createClient();

  if (code && supabase) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const response = NextResponse.redirect(`${origin}${next}`);
      // Logging in from an email link counts as "keep me signed in".
      response.cookies.delete(FORGET_COOKIE);
      return response;
    }
  }

  // Missing, expired or already-used link
  return NextResponse.redirect(`${origin}/login?error=link`);
}
