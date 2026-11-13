/**
 * Next.js App Router Route Handler: PATCH /api/orders/[id] (JavaScript).
 * Advances order status in kitchen workflow.
 */

import { advanceOrder } from '@/lib/services/orderService.js';
import { match } from '@/lib/fp/result.js';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const result = await advanceOrder(Number(id));

    return match(
      (data) => json({ success: true, data }, 200),
      (errorMessage) => json({ success: false, error: errorMessage }, 400)
    )(result);
  } catch (err) {
    return json({ success: false, error: 'Gagal memproses perubahan status' }, 400);
  }
}
