// =====================================================
// lib/escpos/format.ts (util format angka & kolom struk)
// Semua fungsi murni (tanpa efek samping) supaya mudah dites.
// Format angka mengikuti kebiasaan Indonesia: 67000 -> "67.000".
// =====================================================

import type { ReceiptItem } from './types'

// Lebar standar printer termal: 58mm = 32 kolom, 80mm = 48 kolom.
// (58mm = 384 titik / 12 titik per huruf Font A = 32 kolom.)
export const RECEIPT_WIDTH_58MM = 32
export const RECEIPT_WIDTH_80MM = 48
export const RECEIPT_DOTS_58MM = 384
export const RECEIPT_DOTS_80MM = 576

// Format angka uang gaya Indonesia, tanpa simbol Rp.
// Contoh: 67000 -> "67.000", 67000.5 -> "67.000,5"
export function formatAmount(value: number): string {
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(value)
}

const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

// Format tanggal struk: "13 Nov 2026, 10.21.19" (waktu lokal perangkat).
export function formatReceiptDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${date.getDate()} ${MONTHS_ID[date.getMonth()]} ${date.getFullYear()}, ` +
    `${pad(date.getHours())}.${pad(date.getMinutes())}.${pad(date.getSeconds())}`
  )
}

// Printer termal umumnya hanya paham karakter ASCII.
// Karakter lain (emoji, aksen, dsb.) dibuang supaya struk tidak rusak.
export function sanitizeReceiptText(value: string): string {
  return value.replace(/[^\x20-\x7E]/g, '')
}

// Potong teks bila lebih panjang dari kolom yang tersedia.
// Karakter terakhir diganti "~" sebagai tanda teks dipotong.
export function truncateReceiptText(value: string, maxLength: number): string {
  if (maxLength < 1) return ''
  return value.length > maxLength ? value.slice(0, maxLength - 1) + '~' : value
}

// Bungkus teks panjang jadi beberapa baris (pecah di spasi bila bisa).
export function wrapReceiptText(value: string, width: number): string[] {
  const words = value.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return ['']
  const lines: string[] = []
  let current = ''
  for (let word of words) {
    // Kata yang lebih panjang dari satu baris dipecah paksa.
    while (word.length > width) {
      if (current) {
        lines.push(current)
        current = ''
      }
      lines.push(word.slice(0, width))
      word = word.slice(width)
    }
    if (!current) current = word
    else if (current.length + 1 + word.length <= width) current += ' ' + word
    else {
      lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)
  return lines
}

// Satu baris dua kolom: label di kiri, nilai di kanan.
// Nilai (mis. jumlah uang) selalu utuh; label yang dipotong bila sempit.
export function padReceiptRow(left: string, right: string, width: number): string {
  const leftText = truncateReceiptText(left, Math.max(width - right.length - 1, 0))
  return leftText + right.padStart(width - leftText.length, ' ')
}

// Tengahkan teks dalam sebaris struk (pakai spasi, jadi aman juga
// untuk versi teks yang dicetak manual dari browser).
export function centerReceiptText(value: string, width: number): string {
  const text = truncateReceiptText(value, width)
  const leftPad = Math.max(Math.floor((width - text.length) / 2), 0)
  return ' '.repeat(leftPad) + text
}

// Item dicetak 2 baris (sesuai contoh struk):
//   Nasi Opor
//   6 x 25.000              150.000
// Catatan item (bila ada) dicetak di bawahnya dengan awalan "*".
export function formatItemLines(item: ReceiptItem, width: number): string[] {
  const lines = wrapReceiptText(sanitizeReceiptText(item.name), width)
  lines.push(
    padReceiptRow(
      `${item.quantity} x ${formatAmount(item.unitPrice)}`,
      formatAmount(item.subtotal),
      width,
    ),
  )
  if (item.notes) {
    lines.push(...wrapReceiptText('*' + sanitizeReceiptText(item.notes), width))
  }
  return lines
}
