import QRCode from 'qrcode';
import type { TableItem } from '../types';

/**
 * Batch QR stand exporter.
 *
 * Renders the same stand card as QrCodeModal into an offscreen canvas, then:
 * - "pdf"  -> one A4 page per table, stand placed at the top-left safe margin
 * - "png"  -> one PNG per table, bundled in a ZIP
 * - "jpeg" -> one JPEG per table, bundled in a ZIP
 *
 * No extra dependencies: the PDF (JPEG DCTDecode) and ZIP (store) writers below
 * keep the bundle small.
 */

export type QrExportFormat = 'pdf' | 'png' | 'jpeg';

const PX_PER_MM = 12; // ~305 dpi artwork
const CARD_WIDTH_MM = 100;
const SAFE_MARGIN_MM = 12;
const A4_WIDTH_PT = 595.28;
const A4_HEIGHT_PT = 841.89;
const PT_PER_MM = 72 / 25.4;

const BRAND_LOGO_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC4jDTg2zGsW66D3mPi0LCCgkEKAz6A3C_LyMjRjF33cCX-hxn-FMKJ-VmnANEDzHK36CnYdj065-0rxRIyAzaBK6gX8QPIzL_SZbagw1SD7hPd2ZxzJIZ6yhPlB0wT0wYg5V1QYZIndg6LMBj-RspFW4GjCZKuvGWpMCQZZXFIpvETPHdcZZBqLKJziB4JXaXmcwodTl3uHGVnuzTEmOl9Fam2CBCupu5HozhgUINKbYrxNyF4ccQ9FOYEpUIXWooGFlE';
const FALLBACK_LOGO_URL = '/logo-rawon.png';

const DESC_TEXT =
  'Buka kamera ponsel Anda, arahkan ke QR untuk melihat katalog menu, memilih varian, dan memesan langsung dari meja.';

const mm = (value: number) => value * PX_PER_MM;

const fontSans = (weight: number, size: number) =>
  `${weight} ${size}px "Plus Jakarta Sans", Arial, sans-serif`;
const fontSerif = (weight: number, size: number, italic = false) =>
  `${italic ? 'italic ' : ''}${weight} ${size}px "Playfair Display", Georgia, serif`;

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    if (!src.startsWith('data:')) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.arcTo(x + w, y, x + w, y + radius, radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
  ctx.lineTo(x + radius, y + h);
  ctx.arcTo(x, y + h, x, y + h - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

/** Letter-spaced centered text (canvas letterSpacing is not supported everywhere). */
function drawSpacedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  y: number,
  spacing: number
) {
  const chars = Array.from(text);
  let total = 0;
  for (const ch of chars) total += ctx.measureText(ch).width + spacing;
  total -= spacing;

  ctx.save();
  ctx.textAlign = 'left';
  let x = centerX - total / 2;
  for (const ch of chars) {
    ctx.fillText(ch, x, y);
    x += ctx.measureText(ch).width + spacing;
  }
  ctx.restore();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function ensureFonts(): Promise<void> {
  if (typeof document === 'undefined' || !('fonts' in document)) return;
  try {
    await Promise.allSettled([
      document.fonts.load('700 72px "Playfair Display"'),
      document.fonts.load('italic 600 36px "Playfair Display"'),
      document.fonts.load('700 36px "Plus Jakarta Sans"'),
      document.fonts.load('400 36px "Plus Jakarta Sans"'),
    ]);
    await document.fonts.ready;
  } catch {
    // Canvas falls back to system fonts; export still succeeds.
  }
}

async function renderQrImage(table: TableItem): Promise<HTMLImageElement | null> {
  if (!table.qrUrl) return null;
  try {
    const dataUrl = await QRCode.toDataURL(table.qrUrl, {
      margin: 1,
      width: 560,
      errorCorrectionLevel: 'M',
      color: { dark: '#3d1018', light: '#f6f3ee' },
    });
    return await loadImage(dataUrl);
  } catch {
    return null;
  }
}

function drawLogo(
  ctx: CanvasRenderingContext2D,
  logo: HTMLImageElement | null,
  x: number,
  y: number,
  size: number,
  radius: number
) {
  ctx.save();
  roundRectPath(ctx, x, y, size, size, radius);
  ctx.fillStyle = '#3d1018';
  ctx.fill();
  ctx.clip();

  if (logo) {
    const scale = Math.max(size / logo.width, size / logo.height);
    const w = logo.width * scale;
    const h = logo.height * scale;
    ctx.drawImage(logo, x + (size - w) / 2, y + (size - h) / 2, w, h);
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.font = fontSerif(700, size * 0.46);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('RG', x + size / 2, y + size / 2);
  }
  ctx.restore();
}

/** Renders the printable QR stand card to an offscreen canvas. */
export async function renderQrStandCard(
  table: TableItem,
  logo: HTMLImageElement | null = null
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context is not available');

  const width = Math.round(mm(CARD_WIDTH_MM));
  const pad = mm(8);
  const innerWidth = width - pad * 2;
  const centerX = width / 2;
  const logoSize = mm(13);
  const titleSize = mm(6.4);
  const taglineSize = mm(3.2);
  const qrBox = mm(54);
  const qrPad = mm(4);
  const labelSize = mm(3.2);
  const mejaSize = mm(11);
  const descSize = mm(3);
  const descLineHeight = descSize * 1.5;

  const titleH = titleSize * 1.2;
  const taglineH = taglineSize * 1.35;
  const labelH = labelSize * 1.2;
  const mejaH = mejaSize * 1.15;

  const gapLogoTitle = mm(2.5);
  const gapTitleTagline = mm(1.5);
  const gapTaglineQr = mm(6);
  const gapQrLabel = mm(5);
  const gapLabelMeja = mm(1);
  const gapMejaDesc = mm(3.5);

  ctx.font = fontSans(400, descSize);
  const descLines = wrapText(ctx, DESC_TEXT, innerWidth - mm(10));
  const descH = descLines.length * descLineHeight;

  const height = Math.ceil(
    pad +
      logoSize +
      gapLogoTitle +
      titleH +
      gapTitleTagline +
      taglineH +
      gapTaglineQr +
      qrBox +
      gapQrLabel +
      labelH +
      gapLabelMeja +
      mejaH +
      gapMejaDesc +
      descH +
      pad
  );

  canvas.width = width;
  canvas.height = height;

  // Background + card border
  ctx.fillStyle = '#fffdfa';
  ctx.fillRect(0, 0, width, height);
  const borderWidth = mm(0.8);
  roundRectPath(
    ctx,
    borderWidth / 2,
    borderWidth / 2,
    width - borderWidth,
    height - borderWidth,
    mm(4)
  );
  ctx.strokeStyle = '#3d1018';
  ctx.lineWidth = borderWidth;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  let y = pad;

  // Logo
  drawLogo(ctx, logo, centerX - logoSize / 2, y, logoSize, mm(3));
  y += logoSize + gapLogoTitle;

  // Wordmark + tagline
  ctx.fillStyle = '#3d1018';
  ctx.font = fontSerif(700, titleSize);
  ctx.fillText('Rawon Gusti', centerX, y);
  y += titleH + gapTitleTagline;

  ctx.fillStyle = '#847374';
  ctx.font = fontSerif(600, taglineSize, true);
  ctx.fillText('Rasa asli, sepenuh hati.', centerX, y);
  y += taglineH + gapTaglineQr;

  // QR panel
  roundRectPath(ctx, centerX - qrBox / 2, y, qrBox, qrBox, mm(4));
  ctx.fillStyle = '#f6f3ee';
  ctx.fill();
  ctx.strokeStyle = '#d7c2c2';
  ctx.lineWidth = Math.max(2, mm(0.4));
  ctx.stroke();

  const qrImage = await renderQrImage(table);
  if (qrImage) {
    ctx.drawImage(
      qrImage,
      centerX - qrBox / 2 + qrPad,
      y + qrPad,
      qrBox - qrPad * 2,
      qrBox - qrPad * 2
    );
  }
  y += qrBox + gapQrLabel;

  // Call to action + table number
  ctx.fillStyle = '#994703';
  ctx.font = fontSans(700, labelSize);
  drawSpacedText(ctx, 'PINDAI & PESAN MANDIRI', centerX, y, mm(0.55));
  y += labelH + gapLabelMeja;

  ctx.fillStyle = '#1c1c19';
  ctx.font = fontSerif(700, mejaSize);
  ctx.fillText(`MEJA ${table.number}`, centerX, y);
  y += mejaH + gapMejaDesc;

  // Description
  ctx.fillStyle = '#847374';
  ctx.font = fontSans(400, descSize);
  for (const line of descLines) {
    ctx.fillText(line, centerX, y);
    y += descLineHeight;
  }

  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas export failed'))),
      type,
      quality
    );
  });
}

// ---------- ZIP (store only) ----------

const CRC_TABLE: Uint32Array = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date: Date): { time: number; date: number } {
  return {
    time:
      ((date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2)) &
      0xffff,
    date:
      (((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()) & 0xffff,
  };
}

interface ZipEntry {
  name: string;
  bytes: Uint8Array;
}

function buildZip(entries: ZipEntry[]): Blob {
  const encoder = new TextEncoder();
  const stamp = dosDateTime(new Date());
  const localChunks: Uint8Array[] = [];
  const centralChunks: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    const crc = crc32(entry.bytes);

    const local = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0x0800, true); // UTF-8 file name
    lv.setUint16(8, 0, true); // stored
    lv.setUint16(10, stamp.time, true);
    lv.setUint16(12, stamp.date, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, entry.bytes.length, true);
    lv.setUint32(22, entry.bytes.length, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    local.set(nameBytes, 30);

    localChunks.push(local, entry.bytes);

    const central = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x0800, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, stamp.time, true);
    cv.setUint16(14, stamp.date, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, entry.bytes.length, true);
    cv.setUint32(24, entry.bytes.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint32(42, offset, true);
    central.set(nameBytes, 46);
    centralChunks.push(central);

    offset += local.length + entry.bytes.length;
  }

  const centralSize = centralChunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);

  const parts = [...localChunks, ...centralChunks, eocd] as unknown as BlobPart[];
  return new Blob(parts, { type: 'application/zip' });
}

// ---------- PDF (A4, JPEG DCTDecode) ----------

interface PdfPageImage {
  jpeg: Uint8Array;
  width: number;
  height: number;
}

function buildPdf(images: PdfPageImage[]): Blob {
  const chunks: Uint8Array[] = [];
  let length = 0;
  const encoder = new TextEncoder();

  const pushText = (text: string) => {
    const bytes = encoder.encode(text);
    chunks.push(bytes);
    length += bytes.length;
  };
  const pushBytes = (bytes: Uint8Array) => {
    chunks.push(bytes);
    length += bytes.length;
  };

  const objectCount = 2 + images.length * 3;
  const offsets = new Array<number>(objectCount + 1).fill(0);

  pushText('%PDF-1.4\n');

  offsets[1] = length;
  pushText('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  const layout = images.map((image, index) => {
    const pageNum = 3 + index * 3;
    const contentNum = pageNum + 1;
    const imageNum = pageNum + 2;

    const naturalWidth = CARD_WIDTH_MM * PT_PER_MM;
    const naturalHeight = (naturalWidth * image.height) / image.width;
    const maxWidth = (210 - 2 * SAFE_MARGIN_MM) * PT_PER_MM;
    const maxHeight = (297 - 2 * SAFE_MARGIN_MM) * PT_PER_MM;
    const scale = Math.min(1, maxWidth / naturalWidth, maxHeight / naturalHeight);
    const width = naturalWidth * scale;
    const height = naturalHeight * scale;

    return {
      pageNum,
      contentNum,
      imageNum,
      width,
      height,
      x: SAFE_MARGIN_MM * PT_PER_MM,
      y: A4_HEIGHT_PT - SAFE_MARGIN_MM * PT_PER_MM - height,
    };
  });

  offsets[2] = length;
  pushText(
    `2 0 obj\n<< /Type /Pages /Kids [${layout
      .map((page) => `${page.pageNum} 0 R`)
      .join(' ')}] /Count ${images.length} >>\nendobj\n`
  );

  images.forEach((image, index) => {
    const page = layout[index];

    offsets[page.pageNum] = length;
    pushText(
      `${page.pageNum} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4_WIDTH_PT} ${A4_HEIGHT_PT}] ` +
        `/Resources << /XObject << /Im0 ${page.imageNum} 0 R >> >> /Contents ${page.contentNum} 0 R >>\nendobj\n`
    );

    const content =
      `q\n${page.width.toFixed(3)} 0 0 ${page.height.toFixed(3)} ` +
      `${page.x.toFixed(3)} ${page.y.toFixed(3)} cm\n/Im0 Do\nQ\n`;
    offsets[page.contentNum] = length;
    pushText(
      `${page.contentNum} 0 obj\n<< /Length ${content.length} >>\nstream\n${content}endstream\nendobj\n`
    );

    offsets[page.imageNum] = length;
    pushText(
      `${page.imageNum} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} ` +
        `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.jpeg.length} >>\nstream\n`
    );
    pushBytes(image.jpeg);
    pushText('\nendstream\nendobj\n');
  });

  const xrefOffset = length;
  pushText(`xref\n0 ${objectCount + 1}\n`);
  pushText('0000000000 65535 f\r\n');
  for (let i = 1; i <= objectCount; i++) {
    pushText(`${String(offsets[i] ?? 0).padStart(10, '0')} 00000 n\r\n`);
  }
  pushText(
    `trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`
  );

  return new Blob(chunks as BlobPart[], { type: 'application/pdf' });
}

// ---------- Public API ----------

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function safeFilePart(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'meja';
}

function fileStamp(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(
    now.getHours()
  )}${pad(now.getMinutes())}`;
}

export interface QrExportProgress {
  done: number;
  total: number;
}

export async function exportTableQrs(
  tables: TableItem[],
  format: QrExportFormat,
  onProgress?: (progress: QrExportProgress) => void
): Promise<void> {
  if (!tables.length) throw new Error('Tidak ada meja untuk diekspor');

  await ensureFonts();
  const logo = (await loadImage(BRAND_LOGO_URL)) ?? (await loadImage(FALLBACK_LOGO_URL));

  const stamp = fileStamp();

  if (format === 'pdf') {
    const pages: PdfPageImage[] = [];
    for (let i = 0; i < tables.length; i++) {
      const canvas = await renderQrStandCard(tables[i], logo);
      const blob = await canvasToBlob(canvas, 'image/jpeg', 0.94);
      pages.push({
        jpeg: new Uint8Array(await blob.arrayBuffer()),
        width: canvas.width,
        height: canvas.height,
      });
      onProgress?.({ done: i + 1, total: tables.length });
    }
    downloadBlob(buildPdf(pages), `QR-Meja-Rawon-Gusti-${stamp}.pdf`);
    return;
  }

  const mime = format === 'png' ? 'image/png' : 'image/jpeg';
  const extension = format === 'png' ? 'png' : 'jpg';
  const entries: ZipEntry[] = [];

  for (let i = 0; i < tables.length; i++) {
    const canvas = await renderQrStandCard(tables[i], logo);
    const blob = await canvasToBlob(canvas, mime, 0.94);
    entries.push({
      name: `QR-Meja-${safeFilePart(tables[i].number)}.${extension}`,
      bytes: new Uint8Array(await blob.arrayBuffer()),
    });
    onProgress?.({ done: i + 1, total: tables.length });
  }

  downloadBlob(buildZip(entries), `QR-Meja-Rawon-Gusti-${stamp}.zip`);
}
