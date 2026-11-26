// =====================================================
// lib/escpos/text.ts (fallback struk teks polos)
// Jalur cadangan bila printer gagal / belum diset:
// kasir tinggal mencetak teks ini manual dari browser.
// =====================================================

import { RECEIPT_WIDTH_58MM } from './format'
import { buildReceiptLines } from './layout'
import type { ReceiptData } from './types'
import type { RenderReceiptOptions } from './receipt'

// Susun struk versi teks polos, tanpa satu pun byte kontrol printer.
export function renderTextReceipt(
  data: ReceiptData,
  options: RenderReceiptOptions = {},
): string {
  const width = options.width ?? RECEIPT_WIDTH_58MM
  return buildReceiptLines(data, width).map((line) => line.text).join('\n') + '\n'
}
