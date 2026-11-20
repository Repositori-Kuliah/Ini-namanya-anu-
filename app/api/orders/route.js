/**
 * Next.js App Router Route Handler: POST /api/orders (JavaScript).
 * Pure functional endpoint without OOP controllers.
 */

import { submitQrOrder } from '@/lib/services/orderService.js';
import { match } from '@/lib/fp/result.js';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export async function POST(request) {
  try {
    const body = await request.json();
    const result = await submitQrOrder(body);

    return match(
      (orderData) => json({ success: true, data: orderData }, 201),
      (errorMessage) => json({ success: false, error: errorMessage }, 400)
    )(result);
  } catch (err) {
    return json({ success: false, error: 'Format permintaan tidak valid' }, 400);
  }
}
