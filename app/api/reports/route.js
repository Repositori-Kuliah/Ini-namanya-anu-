/**
 * Next.js App Router Route Handler: GET /api/reports (JavaScript).
 * Functional analytics pipeline endpoint.
 */

import { generateSalesReport } from '@/lib/services/reportService.js';
import { match } from '@/lib/fp/result.js';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const todayWib = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
    const from = url.searchParams.get('from') || todayWib;
    const to = url.searchParams.get('to') || todayWib;
    const method = url.searchParams.get('method') || 'all';

    const result = await generateSalesReport(from, to, method);

    return match(
      (summary) => json({ success: true, data: summary }, 200),
      (errorMessage) => json({ success: false, error: errorMessage }, 400)
    )(result);
  } catch (err) {
    return json({ success: false, error: 'Gagal memproses data laporan' }, 500);
  }
}
