/**
 * Next.js App Router Route Handler: POST /api/checkout/pay (JavaScript).
 * Functional payment settlement endpoint.
 */

import { settleSessionPayment } from '@/lib/services/paymentService.js';
import { match } from '@/lib/fp/result.js';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export async function POST(request) {
  try {
    const body = await request.json();
    const result = await settleSessionPayment(body);

    return match(
      (paymentData) => json({ success: true, data: paymentData }, 200),
      (errorMessage) => json({ success: false, error: errorMessage }, 400)
    )(result);
  } catch (err) {
    return json({ success: false, error: 'Format permintaan pembayaran tidak valid' }, 400);
  }
}
