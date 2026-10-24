// ============================================================
// Login guard — runs before every page loads (used by src/proxy.js)
//
// 1. Keeps the user's login fresh (renews it before it expires).
// 2. Sends logged-out visitors from private pages to /login.
// 3. Sends logged-in users from /login or /signup to /today.
// 4. "Keep me signed in" unticked: logs the user out after the
//    browser is closed and opened again.
// ============================================================

import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { SUPABASE_URL, SUPABASE_KEY, isSupabaseConfigured } from './config';
import { FORGET_COOKIE, ALIVE_COOKIE } from '@/lib/rememberMe';

// Pages only for logged-in users. Add new private pages here.
const PRIVATE_PAGES = ['/today', '/upcoming', '/lists', '/settings', '/reports', '/complete-profile'];

// Pages only for logged-out visitors.
const GUEST_PAGES = ['/login', '/signup', '/forgot-password'];

const startsWithAny = (path, list) =>
  list.some((page) => path === page || path.startsWith(`${page}/`));

export async function updateSession(request) {
  let response = NextResponse.next({ request });

  // Without Supabase keys there is no login to check yet.
  if (!isSupabaseConfigured) return response;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Important: do not put other code between creating the client and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Moves the user to another page, keeping any renewed login cookies.
  const redirectTo = (target) => {
    const url = request.nextUrl.clone();
    url.pathname = target;
    url.search = '';
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  };

  // "Keep me signed in" was unticked and the browser was restarted.
  const forget = request.cookies.get(FORGET_COOKIE);
  const alive = request.cookies.get(ALIVE_COOKIE);
  if (user && forget && !alive) {
    await supabase.auth.signOut({ scope: 'local' });
    response.cookies.delete(FORGET_COOKIE);
    return startsWithAny(path, PRIVATE_PAGES) ? redirectTo('/login') : response;
  }

  if (!user && startsWithAny(path, PRIVATE_PAGES)) return redirectTo('/login');
  if (user && startsWithAny(path, GUEST_PAGES)) return redirectTo('/today');

  return response;
}
