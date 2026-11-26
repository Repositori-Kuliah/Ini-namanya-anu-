// =====================================================
// lib/escpos/commands.ts (perintah mentah ESC/POS)
// Referensi umum: Epson ESC/POS Technical Reference.
// Semua byte disusun manual, tanpa dependensi luar.
// =====================================================

import type { MonoBitmap } from './types'

const textEncoder = new TextEncoder()

export type ReceiptAlign = 'left' | 'center' | 'right'

// Penyusun urutan perintah printer (builder pattern).
// Pemakaian: new EscposBuilder() -> susun perintah -> build() -> kirim byte.
export class EscposBuilder {
  private parts: Uint8Array[] = []

  // ESC @ : reset printer ke kondisi awal.
  init(): this {
    return this.push([0x1b, 0x40])
  }

  // ESC a n : atur perataan teks (0 kiri, 1 tengah, 2 kanan).
  align(mode: ReceiptAlign): this {
    const n = mode === 'left' ? 0 : mode === 'center' ? 1 : 2
    return this.push([0x1b, 0x61, n])
  }

  // ESC E n : teks tebal nyala/mati.
  bold(on: boolean): this {
    return this.push([0x1b, 0x45, on ? 1 : 0])
  }

  // GS ! n : ukuran huruf (0x11 = lebar & tinggi dobel, 0x00 = normal).
  doubleSize(on: boolean): this {
    return this.push([0x1d, 0x21, on ? 0x11 : 0x00])
  }

  // Cetak satu baris teks diakhiri newline.
  // Karakter non-ASCII dibuang supaya printer tidak mencetak sampah.
  text(value: string): this {
    const sanitized = value.replace(/[^\x20-\x7E]/g, '')
    return this.push(textEncoder.encode(sanitized + '\n'))
  }

  // GS v 0 m xL xH yL yH d... : cetak gambar raster 1-bit (mis. logo).
  // xL/xH = jumlah byte per baris, yL/yH = tinggi dalam titik.
  raster(bitmap: MonoBitmap): this {
    const bytesPerRow = Math.ceil(bitmap.width / 8)
    this.push([
      0x1d, 0x76, 0x30, 0x00,
      bytesPerRow & 0xff, (bytesPerRow >> 8) & 0xff,
      bitmap.height & 0xff, (bitmap.height >> 8) & 0xff,
    ])
    return this.push(bitmap.data)
  }

  // ESC d n : maju n baris (menggeser kertas tanpa mencetak).
  feed(lines: number): this {
    const n = Math.min(Math.max(Math.trunc(lines), 0), 255)
    return this.push([0x1b, 0x64, n])
  }

  // GS V 66 n : potong kertas (partial cut) setelah maju n unit.
  cut(): this {
    return this.push([0x1d, 0x56, 0x42, 0x00])
  }

  // Gabung semua perintah jadi satu urutan byte siap kirim ke printer.
  build(): Uint8Array {
    const total = this.parts.reduce((sum, part) => sum + part.length, 0)
    const out = new Uint8Array(total)
    let offset = 0
    for (const part of this.parts) {
      out.set(part, offset)
      offset += part.length
    }
    return out
  }

  // Tambah satu potong perintah ke urutan.
  private push(bytes: number[] | Uint8Array): this {
    this.parts.push(new Uint8Array(bytes))
    return this
  }
}
