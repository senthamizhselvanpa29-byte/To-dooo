// ============================================================
// STEP 2 OF A PAYMENT  →  POST /api/pay/verify
//   { orderId, paymentId, signature }  (sent by the Razorpay window)
// Checks Razorpay's signature, then makes the user Pro.
// ============================================================

import { NextResponse } from 'next/server';
import { signatureIsValid } from '@/lib/razorpay';
import { confirm, fail, start } from '../shared';

export async function POST(request) {
  const { config, supabase, response } = await start();
  if (response) return response;

  const { orderId, paymentId, signature } = await request.json().catch(() => ({}));
  if (!signatureIsValid(config, { orderId, paymentId, signature })) return fail('bad_signature', 400);

  try {
    return NextResponse.json({ plan: await confirm(supabase, config, orderId, paymentId) });
  } catch (error) {
    console.error('Payment confirm failed:', error.message);
    return fail('confirm_failed', 500);
  }
}
