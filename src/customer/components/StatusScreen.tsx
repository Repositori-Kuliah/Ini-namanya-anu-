import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';

export const StatusScreen: React.FC = () => {
  const {
    activeOrder,
    selectedTable,
    callWaiter,
    waiterCooldown,
    waiterCalled,
    navigate,
    formatRupiah,
  } = useApp();

  // Konsolidasi/gabungkan item dengan nama menu yang sama agar ringkas seperti pada POS
  const consolidatedItems = useMemo(() => {
    if (!activeOrder?.items) return [];
    const map = new Map<
      string,
      {
        name: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        notes: string[];
      }
    >();

    for (const it of activeOrder.items) {
      const note = it.customization?.kitchenNotes?.trim();
      const existing = map.get(it.name);
      if (existing) {
        existing.quantity += it.quantity;
        existing.totalPrice += it.totalPrice;
        if (note && !existing.notes.includes(note)) {
          existing.notes.push(note);
        }
      } else {
        map.set(it.name, {
          name: it.name,
          quantity: it.quantity,
          unitPrice: it.basePrice,
          totalPrice: it.totalPrice,
          notes: note ? [note] : [],
        });
      }
    }

    return Array.from(map.values());
  }, [activeOrder?.items]);

  // Format kode tagihan identik dengan POS: MEJA_02_181126
  const billCode = useMemo(() => {
    const tbl = String(activeOrder?.tableNumber || selectedTable || '01').padStart(2, '0');
    const orderNum = activeOrder?.ticketNumber?.replace('#', '') || '0001';
    return `MEJA_${tbl}_${orderNum}`;
  }, [activeOrder?.tableNumber, activeOrder?.ticketNumber, selectedTable]);

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
          className="h-11 px-6 rounded-xl bg-[#3d1018] hover:bg-[#58252c] text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs font-sans"
        >
          <span className="material-symbols-outlined text-[18px]">restaurant_menu</span>
          <span>Buka Katalog Menu</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full pt-16 pb-28 min-h-screen bg-[#fcf9f4]">
      <div className="px-4 md:px-6 py-4 max-w-xl mx-auto w-full">
        {/* Card Section: Desain Plek Ketiplek dengan Detail Pembayaran POS Checkout */}
        <section
          aria-label="Detail Pembayaran Tagihan Terpilih"
          className="bg-white rounded-xl border border-[#ebe8e3] p-4 sm:p-5 flex flex-col gap-4 shadow-xs"
        >
          {/* Header Rincian Tagihan Terpilih */}
          <div className="pb-3 border-b border-[#ebe8e3] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold text-[#1c1c19] tracking-tight">
                {billCode}
              </h2>
            </div>
          </div>

          {/* Rincian Menu Yang Dipesan (Tabel Ringkas POS) */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#524344] block mb-2">
              Daftar Pesanan ({consolidatedItems.length} menu)
            </span>

            {consolidatedItems.length === 0 ? (
              <p className="text-xs text-[#847374] italic py-2">Tidak ada item pesanan.</p>
            ) : (
              <div className="divide-y divide-[#ebe8e3] text-xs">
                {consolidatedItems.map((item, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 text-center font-bold text-[#3d1018] tabular-nums shrink-0">
                        {item.quantity}×
                      </span>
                      <div className="min-w-0">
                        <span className="font-semibold text-[#1c1c19] truncate block">
                          {item.name}
                        </span>
                        {item.notes.length > 0 && (
                          <span className="text-[11px] text-[#994703] block truncate">
                            Catatan: {item.notes.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="font-medium text-[#1c1c19] tabular-nums shrink-0">
                      {formatRupiah(item.totalPrice)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Kalkulasi Finansial (Subtotal Menu, Biaya Layanan, PB1, Total Pembayaran) */}
          <div className="pt-3 border-t border-[#ebe8e3] space-y-1.5 text-xs">
            <div className="flex justify-between text-[#524344]">
              <span>Subtotal Menu</span>
              <span className="font-medium text-[#1c1c19] tabular-nums">
                {formatRupiah(activeOrder.subtotal)}
              </span>
            </div>
            {activeOrder.serviceFee > 0 && (
              <div className="flex justify-between text-[#524344]">
                <span>Biaya Layanan (5%)</span>
                <span className="font-medium text-[#1c1c19] tabular-nums">
                  {formatRupiah(activeOrder.serviceFee)}
                </span>
              </div>
            )}
            {activeOrder.tax > 0 && (
              <div className="flex justify-between text-[#524344]">
                <span>Pajak Restoran PB1 (10%)</span>
                <span className="font-medium text-[#1c1c19] tabular-nums">
                  {formatRupiah(activeOrder.tax)}
                </span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-[#ebe8e3] items-baseline">
              <span className="text-sm font-bold text-[#1c1c19]">TOTAL PEMBAYARAN</span>
              <span className="text-2xl font-bold text-[#3d1018] tabular-nums">
                {formatRupiah(activeOrder.total)}
              </span>
            </div>
          </div>

          {/* Tombol Aksi: Pesan Tambahan */}
          <div className="flex pt-2 font-sans border-t border-[#ebe8e3]">
            <button
              type="button"
              onClick={() => navigate('menu')}
              className="w-full h-11 rounded-xl bg-[#3d1018] hover:bg-[#58252c] text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-[17px]">add</span>
              <span>Pesan Tambahan</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
