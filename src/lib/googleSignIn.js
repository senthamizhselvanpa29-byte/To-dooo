// ============================================================
// "CONTINUE WITH GOOGLE"
// Sends the user to Google. After they pick an account, Google
// sends them back to /auth/callback, which logs them in.
// ============================================================

export async function startGoogleSignIn(supabase) {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback?next=/today`,
    },
  });
  return error;
}
