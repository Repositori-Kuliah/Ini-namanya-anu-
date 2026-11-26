// =====================================================
// lib/escpos/layout.ts (tata letak struk bersama)
// Satu sumber kebenaran untuk isi struk: printer ESC/POS,
// fallback teks, dan pratinjau di layar memakai baris yang
// sama persis, jadi yang terlihat = yang tercetak.
// =====================================================

import {
  centerReceiptText,
  formatAmount,
  formatItemLines,
  padReceiptRow,
  sanitizeReceiptText,
  wrapReceiptText,
} from './format'
import type { ReceiptData } from './types'

export type ReceiptLine = {
  text: string
  bold?: boolean
}

// Susun seluruh baris struk pembayaran.
// Urutan: header warung -> judul -> info transaksi -> item ->
// subtotal & biaya -> total & pembayaran -> footer.
// (Logo dicetak terpisah sebagai gambar raster di atas baris pertama.)
export function buildReceiptLines(data: ReceiptData, width: number): ReceiptLine[] {
  const separator: ReceiptLine = { text: '-'.repeat(width) }
  const line = (text: string, bold = false): ReceiptLine => (bold ? { text, bold } : { text })
  const centered = (value: string, bold = false) =>
    wrapReceiptText(sanitizeReceiptText(value), width).map((t) => line(centerReceiptText(t, width), bold))
  const row = (label: string, value: string, bold = false) =>
    line(padReceiptRow(sanitizeReceiptText(label), sanitizeReceiptText(value), width), bold)

  const lines: ReceiptLine[] = [...centered(data.storeName, true)]
  for (const address of data.addressLines ?? []) {
    lines.push(...centered(address))
  }

  lines.push(separator, ...centered(data.title ?? 'STRUK PEMBAYARAN', true), separator)

  for (const info of data.infoRows) {
    lines.push(row(info.label, info.value))
  }
  lines.push(separator)

  data.items.forEach((item, index) => {
    if (index > 0) lines.push(line(''))
    lines.push(...formatItemLines(item, width).map((t) => line(t)))
  })
  lines.push(separator)

  const charges = data.charges ?? []
  if (data.subtotal !== undefined || charges.length > 0) {
    if (data.subtotal !== undefined) lines.push(row('Subtotal', formatAmount(data.subtotal)))
    for (const charge of charges) lines.push(row(charge.label, formatAmount(charge.amount)))
    lines.push(separator)
  }

  lines.push(
    row('TOTAL', formatAmount(data.total), true),
    row(data.paymentLabel, data.paymentStatus ?? 'LUNAS'),
  )
  if (data.amountPaid !== undefined) lines.push(row('Dibayar', formatAmount(data.amountPaid)))
  if (data.changeAmount !== undefined) lines.push(row('Kembalian', formatAmount(data.changeAmount)))
  lines.push(separator)

  const footer = data.footerLines ?? ['Terima kasih!']
  if (footer.length > 0) {
    lines.push(line(''))
    for (const text of footer) lines.push(...centered(text))
  }
  return lines
}
