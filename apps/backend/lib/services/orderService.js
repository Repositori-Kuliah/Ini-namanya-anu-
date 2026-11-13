/**
 * Functional Order Service Pipeline (JavaScript).
 * Orchestrates order validation and RPC persistence via pure functional pipelines.
 */

import { supabase } from '../supabase.js';
import { ok, err } from '../fp/result.js';
import { sum } from '../domain/billing.js';
import { sanitizeNote } from '../domain/orderStateMachine.js';

/**
 * Validates raw cart items securely against current database prices
 * @param {Array<{ id: number, qty: number, note?: string, extras?: number[] }>} rawItems
 */
export const resolveAndValidateItems = async (rawItems) => {
  if (!rawItems || !Array.isArray(rawItems) || rawItems.length === 0) {
    return err('Keranjang belanja kosong. Pilih minimal satu menu.');
  }

  const productIds = rawItems.map((i) => i.id);
  const { data: dbProducts, error: prodErr } = await supabase
    .from('products')
    .select('product_id, name, price, is_available')
    .in('product_id', productIds);

  if (prodErr || !dbProducts) {
    return err('Gagal mengambil data produk dari database');
  }

  const productMap = new Map(dbProducts.map((p) => [p.product_id, p]));
  const validated = [];

  for (const item of rawItems) {
    const prod = productMap.get(item.id);
    if (!prod) return err(`Menu dengan ID ${item.id} tidak ditemukan`);
    if (!prod.is_available) return err(`Menu "${prod.name}" sedang habis`);

    const qty = Math.min(Math.max(1, Math.floor(Number(item.qty) || 1)), 50);

    let extraPrice = 0;
    if (item.extras && item.extras.length > 0) {
      const { data: extrasData } = await supabase
        .from('extras')
        .select('extra_id, price')
        .in('extra_id', item.extras)
        .eq('is_available', true);

      if (extrasData) {
        extraPrice = sum(extrasData.map((e) => Number(e.price)));
      }
    }

    const unitPrice = Number(prod.price) + extraPrice;
    const subtotal = unitPrice * qty;

    validated.push({
      productId: item.id,
      productName: prod.name,
      unitPrice,
      quantity: qty,
      subtotal,
      note: sanitizeNote(item.note),
    });
  }

  const orderSubtotal = sum(validated.map((v) => v.subtotal));
  return ok({ items: validated, subtotal: orderSubtotal });
};

/**
 * Submits an order initiated by customer QR scan
 * @param {object} input
 */
export const submitQrOrder = async (input) => {
  try {
    const { data: res, error } = await supabase.rpc('place_order', {
      p_token: input.token,
      p_guests: Math.min(Math.max(1, Number(input.guestCount) || 1), 50),
      p_items: input.items,
      p_note: sanitizeNote(input.note),
      p_pay_pref: input.paymentPreference || 'cashier',
    });

    if (error || res?.error) {
      return err(error?.message || res?.error || 'Gagal memproses pesanan');
    }

    return ok({
      orderNumber: res.ok,
      orderId: res.order_id,
      total: res.total || 0,
    });
  } catch (e) {
    return err(`Gagal memproses pesanan: ${String(e)}`);
  }
};

/**
 * Advances order status in kitchen/serving workflow
 * @param {number} orderId
 */
export const advanceOrder = async (orderId) => {
  try {
    const { data, error } = await supabase.rpc('advance_order', {
      p_order: Number(orderId),
    });

    if (error || data?.error) {
      return err(error?.message || data?.error || 'Gagal memajukan status pesanan');
    }

    return ok({ orderId, newStatus: data.ok });
  } catch (e) {
    return err(`Gagal memajukan status: ${String(e)}`);
  }
};
