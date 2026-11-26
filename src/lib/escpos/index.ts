// =====================================================
// lib/escpos/index.ts (pintu masuk cetak struk + fallback)
// Alur: susun struk -> kirim ke printer ESC/POS -> bila
// gagal, kembalikan struk teks supaya kasir tetap bisa
// mencetak manual. Fungsi ini sengaja dibuat TIDAK melempar
// error printer ke pemanggil (filosofi fail-open, sama seperti rate limiter).
// =====================================================

export * from './types'
export * from './commands'
export * from './format'
export * from './layout'
export * from './receipt'
export * from './text'
export * from './printer'
export * from './image'

import { renderEscposReceipt, type RenderReceiptOptions } from './receipt'
import { renderTextReceipt } from './text'
import { sendEscposToPrinter, type PrinterDeliveryOptions } from './printer'
import {
  PrinterDeliveryError,
  PrinterNotConfiguredError,
  type ReceiptData,
} from './types'

export type PrintReceiptOptions = PrinterDeliveryOptions & RenderReceiptOptions

export type PrintReceiptOutcome =
  | { delivered: true }
  | {
      delivered: false
      reason: 'not_configured' | 'delivery_failed' | 'render_failed'
      receiptText: string
    }

// Cetak struk pembayaran dengan sistem fallback dua jalur:
// 1. jalur utama    : printer termal via print server (ESCPOS_PRINTER_URL);
// 2. jalur cadangan : struk teks untuk dicetak manual dari browser.
// Kasir tidak pernah kehilangan struk hanya karena printer bermasalah.
export async function printReceiptWithFallback(
  data: ReceiptData,
  options: PrintReceiptOptions = {},
): Promise<PrintReceiptOutcome> {
  try {
    const bytes = renderEscposReceipt(data, options)
    await sendEscposToPrinter(bytes, options)
    return { delivered: true }
  } catch (error) {
    // Struk teks selalu disiapkan sebagai cadangan, apa pun penyebab gagalnya.
    const receiptText = renderTextReceipt(data, options)

    if (error instanceof PrinterNotConfiguredError) {
      return { delivered: false, reason: 'not_configured', receiptText }
    }
    if (error instanceof PrinterDeliveryError) {
      return { delivered: false, reason: 'delivery_failed', receiptText }
    }
    return { delivered: false, reason: 'render_failed', receiptText }
  }
}
