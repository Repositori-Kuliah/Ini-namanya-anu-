'use client';

// Komponen inspektur sudah di-mount langsung di dalam App POS & Pelanggan
// agar selalu sinkron dengan state UI dan tidak terpengaruh siklus layout SSR Next.js.
export function DevInspectorWrapper() {
  return null;
}
