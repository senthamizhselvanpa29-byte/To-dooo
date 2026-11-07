// ============================================================
// STEP 1 OF A PAYMENT  →  POST /api/pay/order   { plan: 'yearly' }
// Creates a Razorpay order for the chosen plan. The price always comes
// from src/lib/plans.js — never from the browser.
// ============================================================

import { NextResponse } from 'next/server';
import { PLANS } from '@/lib/plans';
import { createOrder } from '@/lib/razorpay';
import { fail, start } from '../shared';

export async function POST(request) {
  const { config, supabase, user, response } = await start();
  if (response) return response;

  const { plan } = await request.json().catch(() => ({}));
  const choice = PLANS[plan];
  if (!choice) return fail('bad_plan', 400);

  const { data: current } = await supabase.rpc('my_plan');
  if (current?.plan === 'lifetime') return fail('already_lifetime', 400);

  try {
    const order = await createOrder(config, { amount: choice.price, plan, userId: user.id });
    const { error } = await supabase.rpc('record_order', {
      p_key: config.serverKey,
      p_order_id: order.id,
      p_plan: plan,
      p_amount: choice.price,
    });
    if (error) throw error;
    return NextResponse.json({ orderId: order.id, amount: order.amount, keyId: config.keyId });
  } catch (error) {
    console.error('Razorpay order failed:', error.message);
    return fail('order_failed', 502);
  }
}
