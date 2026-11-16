import React from 'react';
import { useApp } from '../context/AppContext';

export const StatusScreen: React.FC = () => {
  const {
    activeOrder,
    callWaiter,
    waiterCooldown,
    waiterCalled,
    navigate,
    formatRupiah,
  } = useApp();

  if (!activeOrder) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 pt-16 pb-20 bg-[#fcf9f4] text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#f0ede9] text-[#3d1018] flex items-center justify-center mb-4 border border-[#ebe8e3]">
          <span className="material-symbols-outlined text-3xl">receipt_long</span>
        </div>
        <h2 className="font-serif text-lg font-bold text-[#1c1c19]">Belum Ada Pesanan Aktif</h2>
        <p className="font-sans text-xs text-[#6b5a5b] max-w-xs mt-1 mb-6">
          Pesanan yang sudah Anda kirim ke dapur akan muncul di sini.
        </p>
        <button
          type="button"
          onClick={() => navigate('menu')}
          className="h-11 px-6 rounded-2xl bg-[#3d1018] hover:bg-[#58252c] text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs font-sans"
        >
          <span className="material-symbols-outlined text-[18px]">restaurant_menu</span>
          <span>Buka Katalog Menu</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full pt-16 pb-28 min-h-screen bg-[#fcf9f4]">
      <div className="px-4 md:px-6 py-4 max-w-xl mx-auto w-full space-y-4">
        {/* Rincian Menu yang Dipesan */}
        <div className="bg-white rounded-3xl p-5 border border-[#ebe8e3] shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#f0ede9]">
            <h2 className="text-xs font-bold text-[#1c1c19] uppercase tracking-wider font-sans">
              Daftar Pesanan
            </h2>
            <span className="text-[11px] text-[#847374] font-sans">
              {activeOrder.items.length} Menu
            </span>
          </div>

          <div className="divide-y divide-[#f0ede9]">
            {activeOrder.items.map((it, idx) => (
              <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                <div className="min-w-0 pr-3">
                  <div className="font-serif font-bold text-[#1c1c19] truncate">
                    {it.quantity}x {it.name}
                  </div>
                  {it.customization?.kitchenNotes && (
                    <div className="text-[11px] text-[#6b5a5b] italic font-sans mt-0.5">
                      "{it.customization.kitchenNotes}"
                    </div>
                  )}
                </div>
                <span className="font-sans font-semibold text-[#3d1018] tabular-nums shrink-0">
                  {formatRupiah(it.totalPrice)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Rincian Biaya, Pajak, dan Total */}
        <div className="bg-white rounded-3xl p-5 border border-[#ebe8e3] shadow-xs space-y-2.5 text-xs text-[#6b5a5b] font-sans">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-semibold text-[#1c1c19] tabular-nums">
              {formatRupiah(activeOrder.subtotal)}
            </span>
          </div>

          {activeOrder.serviceFee > 0 && (
            <div className="flex justify-between">
              <span>Biaya Layanan</span>
              <span className="font-semibold text-[#1c1c19] tabular-nums">
                {formatRupiah(activeOrder.serviceFee)}
              </span>
            </div>
          )}

          {activeOrder.tax > 0 && (
            <div className="flex justify-between">
              <span>PB1 (Pajak Restoran)</span>
              <span className="font-semibold text-[#1c1c19] tabular-nums">
                {formatRupiah(activeOrder.tax)}
              </span>
            </div>
          )}

          <div className="pt-2.5 border-t border-[#f0ede9] flex justify-between items-baseline">
            <span className="font-extrabold text-[#1c1c19] text-sm">TOTAL</span>
            <span className="font-serif text-lg font-bold text-[#3d1018] tabular-nums">
              {formatRupiah(activeOrder.total)}
            </span>
          </div>
        </div>

        {/* Tombol Tindakan: Pesan Tambahan & Panggil Pelayan */}
        <div className="grid grid-cols-2 gap-3 pt-2 font-sans">
          <button
            type="button"
            onClick={() => navigate('menu')}
            className="h-12 rounded-2xl bg-[#3d1018] hover:bg-[#58252c] text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Pesan Tambahan</span>
          </button>

          <button
            type="button"
            onClick={callWaiter}
            disabled={waiterCooldown > 0}
            className="h-12 rounded-2xl bg-white border border-[#ebe8e3] text-[#3d1018] font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-[#f0ede9] active:scale-95 transition-all cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px]">notifications</span>
            <span>
              {waiterCooldown > 0
                ? `Tunggu ${waiterCooldown}s`
                : waiterCalled
                ? 'Dipanggil'
                : 'Panggil Pelayan'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
