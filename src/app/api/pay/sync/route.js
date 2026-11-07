// ============================================================
// CATCH-UP  →  POST /api/pay/sync   (called when the Go Pro page opens)
// If someone paid but closed the window before VdoU heard back,
// this asks Razorpay about their unfinished orders and makes them Pro.
// ============================================================

import { NextResponse } from 'next/server';
import { fetchOrderPayments } from '@/lib/razorpay';
import { confirm, start } from '../shared';

const LOOK_BACK_DAYS = 7;

export async function POST() {
  const { config, supabase, response } = await start();
  if (response) return response;

  const since = new Date(Date.now() - LOOK_BACK_DAYS * 86400000).toISOString();
  const { data: open } = await supabase
    .from('payments')
    .select('razorpay_order_id')
    .eq('status', 'created')
    .gte('created_at', since)
    .limit(10);

  let confirmed = 0;
  for (const { razorpay_order_id: orderId } of open || []) {
    try {
      const paid = (await fetchOrderPayments(config, orderId)).find((p) => p.status === 'captured');
      if (paid) {
        await confirm(supabase, config, orderId, paid.id);
        confirmed += 1;
      }
    } catch (error) {
      console.error('Payment catch-up failed:', error.message);
    }
  }
  return NextResponse.json({ confirmed });
}
