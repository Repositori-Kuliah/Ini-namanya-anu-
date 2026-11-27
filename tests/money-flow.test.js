// Pemeriksaan alur uang Rawon Gusti (POS + self-order).
// Jalankan: npm test
//
// Modul yang diuji: src/lib/domain.ts (dipakai src/lib/report.ts,
// src/pos/context/AppContext.tsx, src/pos/components/PesananBaruView.tsx,
// src/customer/context/AppContext.tsx).
//
// Test yang GAGAL = bug nyata yang belum diperbaiki (lihat komentar di tiap test).
// Test yang LOLOS = aturan uang yang harus tetap dijaga.
//
// Setiap test yang menyalin angkarum dari komponen React mengutip file:baris
// asalnya. Kalau logika di sana berubah, perbarui angkarum di sini.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bill, billOfOrders, itemsSubtotal, splitFees, subtotalOf } from '../src/lib/domain.ts';

// --- Aturan dasar yang harus tetap berlaku (LILOS) ---

test('bill(): layanan 5% + PB1 10% dari (subtotal + layanan)', () => {
  assert.deepEqual(bill(100000), { subtotal: 100000, service: 5000, tax: 10500, total: 115500 });
});

test('itemsSubtotal(): jumlahkan unit_price * quantity dari order_items', () => {
  assert.equal(itemsSubtotal([{ unit_price: 15000, quantity: 2 }, { unit_price: 7000, quantity: 1 }]), 37000);
});

test('bill(): layanan dimatikan -> tidak ada biaya layanan sama sekali', () => {
  // Pengaturan -> Biaya Layanan dimatikan (store_settings.enable_service_charge = false)
  const opts = { enableService: false, serviceRate: 5, enableTax: true, taxRate: 10 };
  assert.deepEqual(bill(100000, opts), { subtotal: 100000, service: 0, tax: 10000, total: 110000 });
});

test('subtotalOf(): ikut tarif yang dipakai, bukan hardcode 1.155', () => {
  // src/lib/report.ts memakai subtotalOf() untuk kolom Subtotal laporan.
  const opts = { enableService: false, serviceRate: 5, enableTax: true, taxRate: 10 };
  const total = bill(10000, opts).total;
  assert.equal(total, 11000);
  assert.equal(subtotalOf(total, opts), 10000);
});

test('struk pelanggan = tagihan kasir untuk subtotal & tarif yang sama', () => {
  // Pelanggan: billOfOrders (src/customer/context/AppContext.tsx)
  // Kasir   : bill         (src/pos/context/AppContext.tsx)
  // Keduanya harus pakai rumus & tarif yang sama dari Pengaturan.
  const opts = { enableService: false, serviceRate: 5, enableTax: true, taxRate: 10 };
  const customerTotal = billOfOrders([150000], opts).total;
  const cashierTotal = bill(150000, opts).total;
  assert.equal(customerTotal, cashierTotal);
  assert.equal(cashierTotal, 165000); // tanpa layanan 5%
});

test('splitFees(): sisa pembayaran dibagi jadi layanan + pajak', () => {
  // Dipakai untuk menyusun ulang struk riwayat (src/pos/context/AppContext.tsx):
  // tabel payments hanya menyimpan total, sisanya dipecah dengan tarif pajak.
  assert.deepEqual(splitFees(115500, 100000), { service: 5000, tax: 10500 });
  assert.deepEqual(splitFees(110000, 100000, { enableService: false, taxRate: 10 }), { service: 0, tax: 10000 });
  assert.deepEqual(splitFees(100000, 100000), { service: 0, tax: 0 });
});

test('laporan & struk: subtotal sesi dihitung dari item SELURUH sesi', () => {
  // payments.order_id hanya menunjuk order pertama, tapi pembayarannya menutup
  // seluruh sesi -> struk & laporan harus memakai semua order sesi.
  //   Laporan : src/lib/report.ts
  //   Struk   : src/pos/context/AppContext.tsx (transactions)
  const orderA = 100000, orderB = 50000;
  const sessionItems = itemsSubtotal([
    { unit_price: orderA, quantity: 1 },
    { unit_price: orderB, quantity: 1 },
  ]);
  const anchorOnly = itemsSubtotal([{ unit_price: orderA, quantity: 1 }]);
  assert.equal(sessionItems, 150000);
  assert.notEqual(anchorOnly, sessionItems); // order pertama saja = 100.000 (struk rusak versi lama)
  assert.equal(subtotalOf(bill(sessionItems).total), sessionItems);
});

// --- Bug yang harus diperbaiki (GAGAL) ---

test('BUG self-order: total yang dilihat pelanggan != total yang ditagih kasir saat ada extras', () => {
  // Pelanggan: totalPrice = (base + extras) * qty  -> src/customer/context/AppContext.tsx:386
  // Disimpan ke DB: unit_price = base saja        -> src/customer/context/AppContext.tsx:528
  // Kasir menagih dari order_items                 -> src/pos/context/AppContext.tsx:963
  const base = 30000, extra = 5000, qty = 2;
  const quoted = bill((base + extra) * qty);
  const charged = bill(itemsSubtotal([{ unit_price: base, quantity: qty }]));
  assert.equal(
    charged.total,
    quoted.total,
    `pelanggan melihat ${quoted.total}, kasir menagih ${charged.total} (selisih extras)`,
  );
});
