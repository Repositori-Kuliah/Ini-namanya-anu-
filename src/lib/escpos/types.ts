// =====================================================
// lib/escpos/types.ts (tipe data & error struk)
// Dipakai oleh semua modul cetak struk: printer ESC/POS,
// fallback struk teks, maupun pratinjau di layar.
// =====================================================

// Satu item di struk. Dicetak 2 baris: nama, lalu "qty x harga   subtotal".
export type ReceiptItem = {
  name: string
  quantity: number
  unitPrice: number
  subtotal: number
  notes?: string
}

// Baris info dua kolom (mis. "Waktu", "No. Bill", "Meja", "Pelanggan").
export type ReceiptRow = {
  label: string
  value: string
}

// Biaya tambahan di bawah subtotal (mis. "Layanan 5%", "PB1 10%").
export type ReceiptCharge = {
  label: string
  amount: number
}

// Data lengkap yang dibutuhkan untuk menyusun satu struk.
export type ReceiptData = {
  storeName: string
  addressLines?: string[]
  // Default: "STRUK PEMBAYARAN".
  title?: string
  infoRows: ReceiptRow[]
  items: ReceiptItem[]
  subtotal?: number
  charges?: ReceiptCharge[]
  total: number
  // Label metode bayar, mis. "TUNAI" / "QRIS".
  paymentLabel: string
  // Default: "LUNAS".
  paymentStatus?: string
  amountPaid?: number
  changeAmount?: number
  footerLines?: string[]
}

// Gambar 1-bit (hitam/putih) siap cetak raster ESC/POS.
// width selalu kelipatan 8; data = bit per piksel, MSB dulu, 1 = hitam.
export type MonoBitmap = {
  width: number
  height: number
  data: Uint8Array
}

// URL print server belum diset (printerUrl / ESCPOS_PRINTER_URL kosong).
export class PrinterNotConfiguredError extends Error {
  constructor() {
    super('Printer kasir belum dikonfigurasi')
    this.name = 'PrinterNotConfiguredError'
  }
}

// Print server sudah diset, tapi pengiriman struk gagal / timed out.
export class PrinterDeliveryError extends Error {
  constructor(readonly originalError?: unknown) {
    super('Gagal mengirim struk ke printer kasir')
    this.name = 'PrinterDeliveryError'
  }
}
