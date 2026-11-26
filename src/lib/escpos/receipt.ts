// =====================================================
// lib/escpos/receipt.ts (byte struk untuk printer termal)
// Semua baris diambil dari layout bersama (layout.ts),
// jadi versi printer, versi teks, dan pratinjau isinya identik.
// =====================================================

import { RECEIPT_WIDTH_58MM } from './format'
import { buildReceiptLines } from './layout'
import { EscposBuilder } from './commands'
import type { MonoBitmap, ReceiptData } from './types'

export type RenderReceiptOptions = {
  // Lebar kertas dalam jumlah kolom karakter (default 58mm = 32 kolom).
  width?: number
  // Logo 1-bit (lihat image.ts) yang dicetak di tengah, di atas nama warung.
  logo?: MonoBitmap
}

// Susun struk lengkap sebagai urutan byte ESC/POS siap kirim ke printer.
export function renderEscposReceipt(
  data: ReceiptData,
  options: RenderReceiptOptions = {},
): Uint8Array {
  const width = options.width ?? RECEIPT_WIDTH_58MM
  const builder = new EscposBuilder().init()

  if (options.logo) {
    builder.align('center').raster(options.logo).align('left')
  }

  // Perataan tengah sudah diwujudkan dengan spasi di layout,
  // jadi printer cukup mencetak rata kiri apa adanya.
  for (const line of buildReceiptLines(data, width)) {
    if (line.bold) builder.bold(true).text(line.text).bold(false)
    else builder.text(line.text)
  }

  // Geser kertas sedikit lalu potong supaya hasil potongan rapi.
  return builder.feed(3).cut().build()
}
