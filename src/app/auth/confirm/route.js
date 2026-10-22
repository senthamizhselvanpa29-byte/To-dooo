// ============================================================
// EMAIL LINK HANDLER (works on any device)  →  /auth/confirm
//
// Used when the Supabase email templates are set to send
// ?token_hash=...&type=... links (see docs/SETUP.md).
// Unlike /auth/callback, these links also work when the email
// is opened on a different phone or computer.
// ============================================================

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { FORGET_COOKIE } from '@/lib/rememberMe';
import { safeNextPath } from '@/lib/safeRedirect';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');

  // Password-reset links go to the new-password page; others to the planner.
  const fallback = type === 'recovery' ? '/reset-password' : '/today';
  const next = safeNextPath(searchParams.get('next'), fallback);

  const supabase = await createClient();

  if (tokenHash && type && supabase) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      const response = NextResponse.redirect(`${origin}${next}`);
      response.cookies.delete(FORGET_COOKIE);
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=link`);
}
