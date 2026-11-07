// ============================================================
// Shared parts of the payment server code (src/app/api/pay/*)
// ============================================================

import { NextResponse } from 'next/server';
import { razorpayConfig } from '@/lib/razorpay';
import { createClient } from '@/lib/supabase/server';

// Error answer: { error: 'code' } — the words are in src/locales (payErr…)
export const fail = (code, status) => NextResponse.json({ error: code }, { status });

// Checks that payments are set up and someone is logged in.
// Returns { config, supabase, user } or { response } to send back.
export async function start() {
  const config = razorpayConfig();
  if (!config) return { response: fail('payments_not_ready', 503) };
  const supabase = await createClient();
  const { data } = (await supabase?.auth.getUser()) || {};
  if (!data?.user) return { response: fail('not_logged_in', 401) };
  return { config, supabase, user: data.user };
}

// Makes the user Pro for a checked payment (safe to call twice)
export async function confirm(supabase, config, orderId, paymentId) {
  const { data, error } = await supabase.rpc('confirm_payment', {
    p_key: config.serverKey,
    p_order_id: orderId,
    p_payment_id: paymentId,
  });
  if (error) throw error;
  return data;
}
