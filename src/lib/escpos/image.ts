// =====================================================
// lib/escpos/image.ts (ubah gambar jadi 1-bit untuk printer termal)
// Khusus browser (pakai <canvas>). Alur:
//   gambar -> skala ke lebar titik printer -> grayscale ->
//   dithering Floyd-Steinberg -> bit hitam/putih (MSB dulu).
// Hasil yang sama dipakai untuk cetak raster DAN pratinjau,
// jadi logo di layar = logo yang tercetak.
// =====================================================

import type { MonoBitmap } from './types'

export type MonoImage = MonoBitmap & {
  // Data URL PNG hitam/putih hasil dithering, untuk pratinjau.
  previewUrl: string
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Gagal memuat gambar: ${src}`))
    img.src = src
  })
}

export type MonoImageOptions = {
  // Lebar dalam titik printer (58mm = 384 titik penuh). Default 128.
  targetWidth?: number
  // true = bagian TERANG jadi tinta hitam (untuk logo terang di atas latar gelap).
  invert?: boolean
  // true = Floyd-Steinberg (cocok untuk foto); false = ambang tegas (cocok untuk logo/line-art).
  dither?: boolean
  // Ambang hitam/putih 0-255 (default 128).
  threshold?: number
  // true = buang margin kosong di sekeliling logo sebelum diskalakan.
  trim?: boolean
}

// Cari kotak terkecil yang memuat semua piksel "tinta" (pada resolusi asli).
function findInkBox(img: HTMLImageElement, invert: boolean, threshold: number) {
  const w = img.naturalWidth
  const h = img.naturalHeight
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(img, 0, 0)
  const px = ctx.getImageData(0, 0, w, h).data

  let minX = w, minY = h, maxX = -1, maxY = -1
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      const lum = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]
      if ((invert ? 255 - lum : lum) < threshold) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (maxX < 0) return null
  return { sx: minX, sy: minY, sw: maxX - minX + 1, sh: maxY - minY + 1 }
}

export async function loadMonoImage(src: string, options: MonoImageOptions = {}): Promise<MonoImage> {
  const { targetWidth = 128, invert = false, dither = false, threshold = 128, trim = false } = options
  const img = await loadImage(src)

  // Area sumber yang dipakai (seluruh gambar, atau dipangkas ke bagian bertinta).
  let sx = 0
  let sy = 0
  let sw = img.naturalWidth
  let sh = img.naturalHeight
  if (trim) {
    const box = findInkBox(img, invert, threshold)
    if (box) ({ sx, sy, sw, sh } = box)
  }

  const width = Math.max(8, Math.round(targetWidth / 8) * 8)
  const height = Math.max(1, Math.round((sh * width) / sw))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D tidak tersedia')

  // Latar putih supaya area transparan tidak jadi hitam.
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height)

  const imageData = ctx.getImageData(0, 0, width, height)
  const px = imageData.data

  const gray = new Float32Array(width * height)
  for (let i = 0; i < gray.length; i++) {
    const lum = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2]
    gray[i] = invert ? 255 - lum : lum
  }

  const bytesPerRow = width / 8
  const data = new Uint8Array(bytesPerRow * height)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x
      const old = gray[i]
      const isBlack = old < threshold
      const value = isBlack ? 0 : 255

      if (isBlack) data[y * bytesPerRow + (x >> 3)] |= 0x80 >> (x & 7)
      px[i * 4] = px[i * 4 + 1] = px[i * 4 + 2] = value
      px[i * 4 + 3] = 255

      if (!dither) continue
      // Sebar galat ke tetangga (Floyd-Steinberg).
      const err = old - value
      if (x + 1 < width) gray[i + 1] += (err * 7) / 16
      if (y + 1 < height) {
        if (x > 0) gray[i + width - 1] += (err * 3) / 16
        gray[i + width] += (err * 5) / 16
        if (x + 1 < width) gray[i + width + 1] += err / 16
      }
    }
  }

  ctx.putImageData(imageData, 0, 0)
  return { width, height, data, previewUrl: canvas.toDataURL('image/png') }
}
