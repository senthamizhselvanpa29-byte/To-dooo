// ============================================================
// RAZORPAY — used ONLY on the server (the files in src/app/api/pay/)
// Never import this file in a page or component.
//
// Secret settings (Vercel → Settings → Environment Variables):
//   RAZORPAY_KEY_ID      Razorpay → Account & Settings → API Keys (Key Id)
//   RAZORPAY_KEY_SECRET  the Key Secret shown with it (secret!)
//   VDOU_SERVER_KEY      the key shown after running supabase/migrations/0006
// ============================================================

import crypto from 'node:crypto';

const API = process.env.RAZORPAY_API_URL || 'https://api.razorpay.com';

// Returns the keys, or null when payments are not set up yet
export function razorpayConfig() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const serverKey = process.env.VDOU_SERVER_KEY;
  if (!keyId || !keySecret || !serverKey) return null;
  return { keyId, keySecret, serverKey };
}

async function call(config, path, options = {}) {
  const auth = Buffer.from(`${config.keyId}:${config.keySecret}`).toString('base64');
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    cache: 'no-store',
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error?.description || `Razorpay error ${response.status}`);
  return body;
}

// New order: amount in rupees (Razorpay wants paise)
export function createOrder(config, { amount, plan, userId }) {
  return call(config, '/v1/orders', {
    method: 'POST',
    body: JSON.stringify({
      amount: amount * 100,
      currency: 'INR',
      receipt: `vdou_${plan}_${Date.now()}`,
      notes: { plan, user_id: userId },
    }),
  });
}

// Payments made for an order (used when the user closed the window early)
export async function fetchOrderPayments(config, orderId) {
  const body = await call(config, `/v1/orders/${encodeURIComponent(orderId)}/payments`);
  return body.items || [];
}

// Razorpay signs "order_id|payment_id" with our Key Secret.
// If the signature matches, the payment really came from Razorpay.
export function signatureIsValid(config, { orderId, paymentId, signature }) {
  if (!orderId || !paymentId || !signature) return false;
  const expected = crypto.createHmac('sha256', config.keySecret).update(`${orderId}|${paymentId}`).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
