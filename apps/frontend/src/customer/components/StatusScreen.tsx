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

  const handleCopyWifi = async () => {
    try {
      await navigator.clipboard?.writeText(RESTAURANT_INFO.wifiPass);
    } catch {
      // abaikan jika clipboard diblokir browser
    }
    setCopiedWifi(true);
    showToast(`Kata sandi WiFi "${RESTAURANT_INFO.wifiPass}" disalin!`, 'content_copy');
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
      `Layanan (5%): ${formatRupiah(activeOrder.serviceFee)}`,
      `PB1 (10%): ${formatRupiah(activeOrder.tax)}`,
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
          Pesanan Anda akan tampil di halaman ini beserta progres dapurnya setelah dikirim.
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

  const stage = activeOrder.statusStage || 1;
  const stagePercentages: Record<1 | 2 | 3 | 4, string> = {
    1: '25%',
    2: '50%',
    3: '75%',
    4: '100%',
  };

  const stageMeta: Record<1 | 2 | 3 | 4, { title: string; icon: string }> = {
    1: { title: 'Pesanan Diterima Dapur', icon: 'receipt_long' },
    2: { title: 'Sedang Dimasak', icon: 'skillet' },
    3: { title: 'Siap Diantar ke Meja', icon: 'room_service' },
    4: { title: 'Sudah Disajikan', icon: 'dinner_dining' },
  };

  const steps = [
    {
      num: 1,
      title: 'Pesanan Diterima',
      desc: 'Pesanan masuk ke sistem dapur untuk segera disiapkan.',
      icon: 'receipt_long',
      time: activeOrder.orderTime,
    },
    {
      num: 2,
      title: 'Sedang Dimasak',
      desc: 'Hidangan sedang disiapkan dan diracik oleh tim dapur.',
      icon: 'skillet',
      time: stage === 2 ? 'Sedang berjalan' : stage > 2 ? 'Selesai' : 'Menunggu',
    },
    {
      num: 3,
      title: 'Siap Diantar',
      desc: 'Hidangan telah selesai dimasak dan siap diantar pelayan.',
      icon: 'room_service',
      time: stage === 3 ? 'Menuju meja' : stage > 3 ? 'Selesai' : 'Menunggu',
    },
    {
      num: 4,
      title: `Terhidang di Meja ${selectedTable}`,
      desc: 'Seluruh hidangan pesanan Anda telah disajikan.',
      icon: 'dinner_dining',
      time: stage === 4 ? 'Selesai' : 'Menunggu',
    },
  ];

  const isPaid = activeOrder.paymentStatus === 'LUNAS';

  return (
    <div className="flex flex-col w-full px-4 md:px-6 pb-28 pt-16 bg-[#fcf9f4] min-h-screen gap-4">
      <div className="pt-3 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        {/* Left Column: Status Banner + Vertical Stepper + Quick Actions */}
        <div className="md:col-span-7 space-y-4">
          {/* Status Estimasi Banner Card */}
          <section
            aria-label="Status Pesanan Saat Ini"
            className="rounded-2xl bg-white p-4 sm:p-5 shadow-xs border border-[#ebe8e3]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-1.5 mb-1 text-xs font-bold text-[#994703]">
                  <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                    {stageMeta[stage].icon}
                  </span>
                  <span>{stageMeta[stage].title}</span>
                </div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#3d1018] leading-tight">
                  Tiket{' '}
                  {activeOrder.orderNumbers && activeOrder.orderNumbers.length > 1
                    ? `${activeOrder.orderNumbers.length} Pesanan`
                    : activeOrder.ticketNumber}
                </h2>
                <p className="font-sans text-xs text-[#524344] mt-1">
                  Dipesan pukul {activeOrder.orderTime} · Meja {selectedTable}
                </p>
              </div>

              <div className="px-3 py-2 rounded-xl bg-[#f6f3ee] text-right border border-[#ebe8e3] shrink-0">
                <span className="block font-sans text-[10px] text-[#524344] font-semibold uppercase tracking-wider">
                  {stage === 4 ? 'Status' : 'Estimasi Siap'}
                </span>
                <span className="font-serif text-sm sm:text-base text-[#3d1018] font-bold tabular-nums">
                  {stage === 4 ? 'Tersaji' : activeOrder.estimatedMinutes}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4 pt-3 flex flex-col gap-1.5 border-t border-[#f0ede9]">
              <div className="flex justify-between items-center font-sans text-xs">
                <span className="text-[#524344] font-medium">Progres Penyajian</span>
                <span className="text-[#994703] font-bold tabular-nums">
                  Tahap {stage} dari 4
                </span>
              </div>
              <div
                role="progressbar"
                aria-valuenow={stage}
                aria-valuemin={1}
                aria-valuemax={4}
                aria-label="Progres penyajian pesanan"
                className="w-full h-2 rounded-full bg-[#f0ede9] overflow-hidden"
              >
                <div
                  className="h-full bg-[#3d1018] rounded-full transition-all duration-500 ease-out"
                  style={{ width: stagePercentages[stage] }}
                />
              </div>
            </div>
          </section>

          {/* Vertical Stepper Card */}
          <section
            aria-label="Tahapan Proses Dapur"
            className="rounded-2xl bg-white p-4 sm:p-5 shadow-xs border border-[#ebe8e3]"
          >
            <h3 className="font-serif font-bold text-base text-[#3d1018] flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                timeline
              </span>
              <span>Proses Dapur &amp; Penyajian</span>
            </h3>

            <ol className="space-y-4">
              {steps.map((step, idx) => {
                const isDone = stage > step.num || (stage === 4 && step.num === 4);
                const isCurrent = stage === step.num && stage < 4;
                const isPending = stage < step.num;

                return (
                  <li key={step.num} className="relative flex gap-3.5">
                    {/* Vertical connector line */}
                    {idx < steps.length - 1 && (
                      <div
                        aria-hidden="true"
                        className={`absolute left-[15px] top-8 bottom-[-16px] w-0.5 ${
                          stage > step.num ? 'bg-[#3d1018]' : 'bg-[#ebe8e3]'
                        }`}
                      />
                    )}

                    {/* Step Circle */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                        isDone
                          ? 'bg-[#3d1018] text-white border-[#3d1018]'
                          : isCurrent
                          ? 'bg-[#994703] text-white border-[#994703] ring-4 ring-[#ffdbc9]'
                          : 'bg-[#f6f3ee] text-[#847374] border-[#ebe8e3]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                        {isDone ? 'check' : step.icon}
                      </span>
                    </div>

                    {/* Step Text */}
                    <div
                      className={`flex-1 min-w-0 pb-1 ${
                        isCurrent
                          ? 'bg-[#fcf9f4] border border-[#ebe8e3] rounded-xl p-3 -mt-0.5'
                          : isPending
                          ? 'opacity-65'
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`font-sans font-bold text-xs sm:text-[13px] ${
                            isCurrent ? 'text-[#994703]' : 'text-[#1c1c19]'
                          }`}
                        >
                          {step.title}
                        </span>
                        <span className="font-sans text-[11px] font-medium text-[#524344] shrink-0 tabular-nums">
                          {step.time}
                        </span>
                      </div>
                      <p className="font-sans text-[11px] text-[#524344] mt-0.5 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          {/* Guest Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={callWaiter}
              className={`min-h-[48px] flex items-center justify-center gap-2 px-3 rounded-xl shadow-xs active:scale-95 transition-all text-xs font-sans font-bold cursor-pointer border focus-visible:ring-2 focus-visible:ring-[#3d1018] focus-visible:outline-none ${
                waiterCooldown > 0
                  ? 'bg-[#ffdbc9] text-[#753400] border-[#fc934f]'
                  : 'bg-white text-[#3d1018] border-[#ebe8e3] hover:bg-[#f6f3ee]'
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
              className="min-h-[48px] flex items-center justify-center gap-2 px-3 rounded-xl bg-[#3d1018] text-white shadow-xs hover:bg-[#58252c] active:scale-95 transition-all text-xs font-sans font-bold cursor-pointer focus-visible:ring-2 focus-visible:ring-[#3d1018] focus-visible:outline-none"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                add_circle
              </span>
              <span>Tambah Pesanan</span>
            </button>
          </div>
        </div>

        {/* Right Column: Items Breakdown + Payment Summary + Checkout + WiFi */}
        <div className="md:col-span-5 space-y-4">
          {/* Rincian Hidangan Card */}
          <section
            aria-label="Rincian Hidangan Dipesan"
            className="rounded-2xl bg-white p-4 shadow-xs border border-[#ebe8e3] flex flex-col gap-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#f0ede9]">
              <h3 className="font-serif font-bold text-sm text-[#3d1018] flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  restaurant
                </span>
                <span>Rincian Hidangan</span>
              </h3>
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

          {/* Status Pembayaran & Ringkasan Tagihan */}
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
                  {isPaid ? 'check_circle' : 'schedule'}
                </span>
                <span className="font-serif font-bold text-sm text-[#1c1c19]">
                  Status Pembayaran
                </span>
              </div>
              <span
                className={`font-sans text-[11px] px-2.5 py-1 rounded-lg font-bold border ${
                  isPaid
                    ? 'bg-[#e8f5e9] text-[#1b5e20] border-[#c8e6c9]'
                    : 'bg-[#ffdbc9] text-[#753400] border-[#fc934f]'
                }`}
              >
                {activeOrder.paymentStatus}
              </span>
            </div>

            <div className="space-y-1.5 font-sans text-xs">
              <div className="flex justify-between text-[#524344]">
                <span>Preferensi Metode</span>
                <span className="font-bold text-[#1c1c19] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-[#3d1018]" aria-hidden="true">
                    {activeOrder.paymentMethod === 'qris' ? 'qr_code_scanner' : 'point_of_sale'}
                  </span>
                  {activeOrder.paymentMethod === 'qris' ? 'QRIS (Konfirmasi Kasir)' : 'Bayar di Kasir'}
                </span>
              </div>
              <div className="flex justify-between text-[#524344]">
                <span>Subtotal Menu</span>
                <span className="font-medium text-[#1c1c19] tabular-nums">
                  {formatRupiah(activeOrder.subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-[#524344]">
                <span>Biaya Layanan (5%)</span>
                <span className="font-medium text-[#1c1c19] tabular-nums">
                  {formatRupiah(activeOrder.serviceFee)}
                </span>
              </div>
              <div className="flex justify-between text-[#524344]">
                <span>PB1 Pajak Daerah (10%)</span>
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
              className="w-full min-h-[44px] rounded-xl bg-[#f0ede9] hover:bg-[#ebe8e3] text-[#3d1018] font-sans font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-[#3d1018] focus-visible:outline-none"
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
              className="w-full h-12 rounded-xl bg-[#3d1018] hover:bg-[#58252c] text-white font-sans font-bold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-65 transition-colors focus-visible:ring-2 focus-visible:ring-[#3d1018] focus-visible:outline-none"
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

          {/* WiFi Tamu Restoran Card */}
          <div className="rounded-2xl bg-[#f6f3ee] p-4 flex items-center justify-between gap-3 border border-[#ebe8e3]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#3d1018] shadow-xs border border-[#ebe8e3] shrink-0">
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                  wifi
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-sans font-bold text-xs text-[#1c1c19] truncate">
                  WiFi Tamu: {RESTAURANT_INFO.wifiSsid}
                </p>
                <p className="font-sans text-xs text-[#524344] font-mono truncate">
                  Sandi: <span className="font-bold text-[#3d1018]">{RESTAURANT_INFO.wifiPass}</span>
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
        </div>
      </div>
    </div>
  );
};
