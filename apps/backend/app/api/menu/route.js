/**
 * Next.js App Router Route Handler: GET /api/menu (JavaScript).
 * Returns menu products and categories.
 */

import { supabase } from '@/lib/supabase.js';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export async function GET() {
  try {
    const [productsRes, categoriesRes] = await Promise.all([
      supabase.from('products').select('*, categories(name)').order('product_id'),
      supabase.from('categories').select('*').order('category_id'),
    ]);

    if (productsRes.error || categoriesRes.error) {
      return json({ success: false, error: 'Gagal memuat katalog menu' }, 500);
    }

    return json({
      success: true,
      data: {
        products: productsRes.data || [],
        categories: categoriesRes.data || [],
      },
    }, 200);
  } catch (err) {
    return json({ success: false, error: 'Internal Server Error' }, 500);
  }
}
