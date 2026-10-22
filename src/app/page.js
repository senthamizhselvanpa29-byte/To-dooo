// ============================================================
// HOME ADDRESS ( / )
// Sends people to their planner. If they are not logged in,
// the login guard (src/proxy.js) sends them to /login instead.
// ============================================================

import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/today');
}
