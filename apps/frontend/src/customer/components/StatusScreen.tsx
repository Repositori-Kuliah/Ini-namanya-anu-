import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RESTAURANT_INFO } from '../data/menuData';
import { placeholderImage } from '../../lib/placeholder';

export const StatusScreen: React.FC = () => {
  const {
    activeOrder,
    selectedTable,
    callWaiter,
    waiterCooldown,
    checkoutRequested,
    checkoutCooldown,
    requestCheckout,
    navigate,
    showToast,
    formatRupiah,
  } = useApp();

  const [copiedWifi, setCopiedWifi] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Baca konfigurasi WiFi dari pengaturan outlet POS jika tersedia
  const [wifiSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('rg_pos_store_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          enabled: parsed.enableGuestWifi ?? true,
          ssid: parsed.wifiSsid || RESTAURANT_INFO.wifiSsid,
          password: parsed.wifiPassword || RESTAURANT_INFO.wifiPass,
        };
      }
    } catch {}
    return {
      enabled: true,
      ssid: RESTAURANT_INFO.wifiSsid,
      password: RESTAURANT_INFO.wifiPass,
    };
  });

  const handleCopyWifi = async () => {
    try {
      await navigator.clipboard?.writeText(wifiSettings.password);
    } catch {
      // abaikan jika clipboard diblokir browser
    }
    setCopiedWifi(true);
    showToast(`Kata sandi WiFi "${wifiSettings.password}" disalin!`, 'content_copy');
    setTimeout(() => setCopiedWifi(false), 2500);
  };

  const handleCopyReceiptSummary = async () => {
    if (!activeOrder) return;
    const lines = [
      `${RESTAURANT_INFO.name} (${RESTAURANT_INFO.branch})`,
      `Meja ${selectedTable} · ${activeOrder.ticketNumber} (${activeOrder.orderTime})`,
      '---',
      ...activeOrder.items.map(
        (i) => `${i.quantity}x ${i.name} = ${formatRupiah(i.totalPrice)}`
      ),
      '---',
      `Subtotal: ${formatRupiah(activeOrder.subtotal)}`,
      `Layanan: ${formatRupiah(activeOrder.serviceFee)}`,
      `Pajak: ${formatRupiah(activeOrder.tax)}`,
      `Total: ${formatRupiah(activeOrder.total)} (${activeOrder.paymentStatus})`,
    ].join('\n');

    try {
      await navigator.clipboard?.writeText(lines);
      setCopiedSummary(true);
      showToast('Ringkasan tagihan berhasil disalin!', 'content_copy');
      setTimeout(() => setCopiedSummary(false), 2500);
    } catch {
      showToast('Gagal menyalin ringkasan tagihan', 'error');
    }
  };

  if (!activeOrder) {
    return (
      <div className="flex flex-col items-center justify-center w-full px-6 pt-16 pb-28 bg-[#fcf9f4] min-h-screen gap-3 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#f0ede9] text-[#994703] flex items-center justify-center border border-[#ebe8e3]">
          <span className="material-symbols-outlined text-3xl" aria-hidden="true">
            receipt_long
          </span>
        </div>
        <h2 className="font-serif text-xl font-bold text-[#3d1018]">Belum ada pesanan</h2>
        <p className="font-sans text-xs text-[#524344] max-w-xs leading-relaxed">
          Pesanan Anda akan tampil di halaman ini setelah pesanan dikirim ke dapur.
        </p>
        <button
          type="button"
          onClick={() => navigate('menu')}
          className="mt-2 min-h-[44px] px-6 rounded-xl bg-[#3d1018] hover:bg-[#58252c] text-white font-sans font-bold text-xs cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-[#3d1018] focus-visible:outline-none"
        >
          Lihat Katalog Menu
        </button>
      </div>
    );
  }

  const isPaid = activeOrder.paymentStatus === 'LUNAS';

  return (
    <div className="flex flex-col w-full px-4 md:px-6 pb-28 pt-16 bg-[#fcf9f4] min-h-screen gap-4">
      {/* Header Info Pesanan */}
      <section
        aria-label="Info Pesanan Meja"
        className="rounded-2xl bg-white p-4 sm:p-5 shadow-xs border border-[#ebe8e3] mt-3"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-[#994703] uppercase tracking-wider block">
              Pesanan Terhubung ke Dapur
            </span>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#3d1018] leading-tight">
              Tiket{' '}
              {activeOrder.orderNumbers && activeOrder.orderNumbers.length > 1
                ? `${activeOrder.orderNumbers.length} Pesanan`
                : activeOrder.ticketNumber}
            </h1>
            <p className="font-sans text-xs text-[#524344] mt-0.5">
              Dipesan pukul {activeOrder.orderTime} · Meja {selectedTable}
            </p>
          </div>

          {isPaid && (
            <div className="text-right shrink-0">
              <span className="font-sans text-[11px] px-3 py-1.5 rounded-xl font-bold border inline-block bg-[#e8f5e9] text-[#1b5e20] border-[#c8e6c9]">
                LUNAS
              </span>
            </div>
          )}
        </div>

        {/* Tombol Aksi Cepat Meja */}
        <div className="grid grid-cols-2 gap-3 mt-4 pt-3.5 border-t border-[#f0ede9]">
          <button
            type="button"
            onClick={callWaiter}
            className={`min-h-[44px] flex items-center justify-center gap-2 px-3 rounded-xl shadow-xs active:scale-95 transition-all text-xs font-sans font-bold cursor-pointer border focus-visible:ring-2 focus-visible:ring-[#3d1018] focus-visible:outline-none ${
              waiterCooldown > 0
                ? 'bg-[#ffdbc9] text-[#753400] border-[#fc934f]'
                : 'bg-[#fcf9f4] text-[#3d1018] border-[#ebe8e3] hover:bg-[#f6f3ee]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px] text-[#994703]" aria-hidden="true">
              {waiterCooldown > 0 ? 'hourglass_top' : 'notifications_active'}
            </span>
            <span className="tabular-nums">
              {waiterCooldown > 0 ? `Pelayan (${waiterCooldown}d)` : 'Panggil Pelayan'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigate('menu')}
            className="min-h-[44px] flex items-center justify-center gap-2 px-3 rounded-xl bg-[#3d1018] text-white shadow-xs hover:bg-[#58252c] active:scale-95 transition-all text-xs font-sans font-bold cursor-pointer focus-visible:ring-2 focus-visible:ring-[#3d1018] focus-visible:outline-none"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              add_circle
            </span>
            <span>Tambah Pesanan</span>
          </button>
        </div>
      </section>

      {/* Grid Utama: Rincian Hidangan & Ringkasan / WiFi */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        {/* Kolom Kiri: Rincian Hidangan */}
        <div className="md:col-span-7 space-y-4">
          <section
            aria-label="Rincian Hidangan Dipesan"
            className="rounded-2xl bg-white p-4 shadow-xs border border-[#ebe8e3] flex flex-col gap-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#f0ede9]">
              <h2 className="font-serif font-bold text-sm text-[#3d1018] flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  restaurant
                </span>
                <span>Rincian Hidangan</span>
              </h2>
              <span className="font-sans text-[11px] text-[#524344] font-semibold tabular-nums">
                {activeOrder.items?.length || 0} Item
              </span>
            </div>

            <div className="space-y-2.5">
              {activeOrder.items?.map((item) => (
                <div
                  key={item.cartItemId}
                  className="flex items-start gap-3 p-2.5 bg-[#fcf9f4] rounded-xl border border-[#ebe8e3]"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (!img.dataset.fallbackApplied) {
                        img.dataset.fallbackApplied = '1';
                        img.src = placeholderImage(item.name);
                      }
                    }}
                    className="w-14 h-14 rounded-lg object-cover shrink-0 bg-[#f0ede9] border border-[#ebe8e3]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <p className="font-serif font-bold text-xs sm:text-sm text-[#1c1c19] leading-snug">
                        {item.name}
                      </p>
                      <span className="font-sans text-xs text-[#3d1018] font-bold tabular-nums shrink-0">
                        {formatRupiah(item.totalPrice)}
                      </span>
                    </div>
                    <p className="font-sans text-[11px] text-[#524344] mt-0.5 tabular-nums">
                      {item.subtitleDesc || `${item.quantity}x Porsi`}
                    </p>
                    {item.customization?.kitchenNotes && (
                      <p className="font-sans text-[11px] text-[#994703] mt-1">
                        Catatan: {item.customization.kitchenNotes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Kolom Kanan: Rincian Tagihan + WiFi Tamu */}
        <div className="md:col-span-5 space-y-4">
          {/* Ringkasan Tagihan */}
          <section
            aria-label="Status Pembayaran dan Tagihan"
            className="rounded-2xl bg-white p-4 shadow-xs border border-[#ebe8e3] space-y-3"
          >
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#f0ede9]">
              <div className="flex items-center gap-2">
                <span
                  className={`material-symbols-outlined text-[20px] ${
                    isPaid ? 'text-[#2e7d32]' : 'text-[#994703]'
                  }`}
                  style={{ fontVariationSettings: "'FILL' 1" }}
                  aria-hidden="true"
                >
                  {isPaid ? 'check_circle' : 'point_of_sale'}
                </span>
                <h2 className="font-serif font-bold text-sm text-[#1c1c19]">
                  Ringkasan Tagihan
                </h2>
              </div>
              <span className="font-sans text-xs text-[#524344] font-medium">
                Bayar di Kasir
              </span>
            </div>

            <div className="space-y-1.5 font-sans text-xs">
              <div className="flex justify-between text-[#524344]">
                <span>Subtotal Menu</span>
                <span className="font-medium text-[#1c1c19] tabular-nums">
                  {formatRupiah(activeOrder.subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-[#524344]">
                <span>Biaya Layanan</span>
                <span className="font-medium text-[#1c1c19] tabular-nums">
                  {formatRupiah(activeOrder.serviceFee)}
                </span>
              </div>
              <div className="flex justify-between text-[#524344]">
                <span>Pajak Restoran</span>
                <span className="font-medium text-[#1c1c19] tabular-nums">
                  {formatRupiah(activeOrder.tax)}
                </span>
              </div>
              <div className="flex justify-between items-baseline pt-2 mt-1 border-t border-[#f0ede9]">
                <span className="font-bold text-[#1c1c19]">Total Tagihan</span>
                <span className="font-serif font-bold text-lg text-[#3d1018] tabular-nums">
                  {formatRupiah(activeOrder.total)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyReceiptSummary}
              className="w-full min-h-[40px] rounded-xl bg-[#f0ede9] hover:bg-[#ebe8e3] text-[#3d1018] font-sans font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-[#3d1018] focus-visible:outline-none"
            >
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                {copiedSummary ? 'check' : 'content_copy'}
              </span>
              <span>{copiedSummary ? 'Ringkasan Disalin' : 'Salin Ringkasan Tagihan'}</span>
            </button>
          </section>

          {!isPaid && (
            <button
              type="button"
              onClick={requestCheckout}
              disabled={checkoutCooldown > 0}
              className="w-full h-11 rounded-xl bg-[#3d1018] hover:bg-[#58252c] text-white font-sans font-bold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-65 transition-colors focus-visible:ring-2 focus-visible:ring-[#3d1018] focus-visible:outline-none"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                receipt_long
              </span>
              <span className="tabular-nums">
                {checkoutCooldown > 0
                  ? `Tagihan diminta · Tunggu ${checkoutCooldown}d`
                  : checkoutRequested
                  ? 'Minta Tagihan Lagi ke Kasir'
                  : 'Minta Tagihan ke Kasir'}
              </span>
            </button>
          )}

          {/* WiFi Tamu Restoran Card (Hanya muncul jika modul WiFi aktif di Pengaturan) */}
          {wifiSettings.enabled && (
            <div className="rounded-2xl bg-[#f6f3ee] p-4 flex items-center justify-between gap-3 border border-[#ebe8e3]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#3d1018] shadow-xs border border-[#ebe8e3] shrink-0">
                  <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                    wifi
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="font-sans font-bold text-xs text-[#1c1c19] truncate">
                    WiFi Tamu: {wifiSettings.ssid}
                  </p>
                  <p className="font-sans text-xs text-[#524344] font-mono truncate">
                    Sandi: <span className="font-bold text-[#3d1018]">{wifiSettings.password}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyWifi}
                aria-label="Salin kata sandi WiFi"
                className={`min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center transition-colors shadow-xs cursor-pointer border shrink-0 focus-visible:ring-2 focus-visible:ring-[#3d1018] focus-visible:outline-none ${
                  copiedWifi
                    ? 'bg-[#ffdbc9] text-[#753400] border-[#fc934f]'
                    : 'bg-white text-[#3d1018] hover:bg-[#ebe8e3] border-[#ebe8e3]'
                }`}
                title="Salin Kata Sandi"
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  {copiedWifi ? 'check' : 'content_copy'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
