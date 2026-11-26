// =====================================================
// lib/escpos/printer.ts (pengiriman ke printer kasir)
// Byte dikirim lewat print server berbasis HTTP karena
// Node.js tidak bisa menulis langsung ke perangkat USB/serial.
// Contoh print server: CUPS dengan raw queue, atau bridge TCP port 9100.
// =====================================================

import { PrinterDeliveryError, PrinterNotConfiguredError } from './types'

export type PrinterDeliveryOptions = {
  // URL print server; default dari env ESCPOS_PRINTER_URL.
  printerUrl?: string
  // Batas waktu kirim (default 5 detik, agar kasir nunggu lama).
  timeoutMs?: number
}

// Kirim byte ESC/POS ke printer lewat print server.
// Melempar PrinterNotConfiguredError bila URL kosong,
// atau PrinterDeliveryError bila pengiriman gagal / timed out.
// Pemanggil seharusnya menangkap kedua error ini lalu jatuh ke fallback teks.
export async function sendEscposToPrinter(
  bytes: Uint8Array,
  options: PrinterDeliveryOptions = {},
): Promise<void> {
  const printerUrl =
    options.printerUrl ?? (typeof process !== 'undefined' ? process.env.ESCPOS_PRINTER_URL : undefined)
  const timeoutMs = options.timeoutMs ?? 5000

  // Tanpa print server, jalur utama tidak bisa dipakai.
  if (!printerUrl) {
    throw new PrinterNotConfiguredError()
  }

  try {
    const response = await fetch(printerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: bytes as unknown as BodyInit,
      signal: AbortSignal.timeout(timeoutMs),
    })

    if (!response.ok) {
      throw new Error(`print server merespons status ${response.status}`)
    }
  } catch (error) {
    // Error jaringan dibungkus supaya detail mentahnya tidak bocor ke pemanggil.
    throw new PrinterDeliveryError(error)
  }
}
