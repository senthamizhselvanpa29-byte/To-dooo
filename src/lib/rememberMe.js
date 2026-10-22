// ============================================================
// "Keep me signed in" tick box
//
// Ticked:   the user stays logged in (normal).
// Unticked: we save two small cookies:
//   - FORGET: "log me out when I come back after closing the browser"
//   - ALIVE:  disappears automatically when the browser is closed
// When FORGET is there but ALIVE is gone, src/lib/supabase/proxy.js
// logs the user out.
// ============================================================

export const FORGET_COOKIE = 'vdou_forget';
export const ALIVE_COOKIE = 'vdou_alive';

// Call this in the browser right after a successful login.
export function saveRememberChoice(keepSignedIn) {
  if (keepSignedIn) {
    document.cookie = `${FORGET_COOKIE}=; path=/; max-age=0; samesite=lax`;
    document.cookie = `${ALIVE_COOKIE}=; path=/; max-age=0; samesite=lax`;
  } else {
    document.cookie = `${FORGET_COOKIE}=1; path=/; max-age=31536000; samesite=lax`;
    // No max-age: the browser deletes this one when it closes.
    document.cookie = `${ALIVE_COOKIE}=1; path=/; samesite=lax`;
  }
}
