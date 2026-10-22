// ============================================================
// SAFE "NEXT PAGE" CHECK
// Email links say where to go after login (e.g. ?next=/today).
// This makes sure it's a page on OUR site, so nobody can craft
// a link that sends users to a fake website.
// ============================================================

export function safeNextPath(next, fallback = '/today') {
  if (typeof next !== 'string') return fallback;
  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback;
  return next;
}
