/**
 * Next.js App Router Route Handler: GET /api/tables (JavaScript).
 * Returns all active restaurant tables.
 */

import { supabase } from '@/lib/supabase.js';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .eq('is_active', true)
      .order('table_number');

    if (error) {
      return json({ success: false, error: 'Gagal memuat data meja' }, 500);
    }

    return json({ success: true, data }, 200);
  } catch (err) {
    return json({ success: false, error: 'Internal Server Error' }, 500);
  }
}
