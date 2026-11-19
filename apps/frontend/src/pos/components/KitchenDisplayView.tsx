import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { KitchenTicket } from '../types';

interface StationSubTicket {
  subId: string;
  orderId: string;
  ticket: KitchenTicket;
  categoryType: 'food' | 'drink';
  stationLabel: string;
  items: Array<{ name: string; quantity: number; notes?: string }>;
  actionLabel: string;
}

export const KitchenDisplayView: React.FC = () => {
  const { kitchenTickets, completeKitchenTicket, showToast, storeSettings } = useApp();

  const [stationFilter, setStationFilter] = useState<string>(storeSettings.soundStation || 'Semua Bagian');
  const [completedSubIds, setCompletedSubIds] = useState<Set<string>>(() => new Set());

  const soundEnabled = storeSettings.soundEnabled !== false;

  const playKitchenChime = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch {
      /* AudioContext fallback */
    }
  };

  // Memisahkan tiket menjadi kartu tersendiri per stasiun (Dapur Makanan vs Bar Minuman)
  const allSubTickets: StationSubTicket[] = kitchenTickets.flatMap((ticket) => {
    const foodItems = ticket.items.filter((item) => !item.isDrink);
    const drinkItems = ticket.items.filter((item) => item.isDrink);
    const result: StationSubTicket[] = [];

    const allowFood = stationFilter !== 'Bar Minuman';
    const allowDrink = stationFilter !== 'Dapur Utama (Makanan)';

    if (foodItems.length > 0 && allowFood) {
      result.push({
        subId: `${ticket.id}-food`,
        orderId: ticket.id,
        ticket,
        categoryType: 'food',
        stationLabel: 'Dapur Makanan',
        items: foodItems,
        actionLabel: 'Selesai Masak',
      });
    }

    if (drinkItems.length > 0 && allowDrink) {
      result.push({
        subId: `${ticket.id}-drink`,
        orderId: ticket.id,
        ticket,
        categoryType: 'drink',
        stationLabel: 'Bar Minuman',
        items: drinkItems,
        actionLabel: 'Selesai Nyeduh',
      });
    }

    return result;
  });

  const activeSubTickets = allSubTickets.filter(
    (sub) => sub.ticket.status !== 'served' && !completedSubIds.has(sub.subId)
  );

  const handleCompleteSub = (sub: StationSubTicket) => {
    playKitchenChime();

    const nextCompleted = new Set(completedSubIds);
    nextCompleted.add(sub.subId);
    setCompletedSubIds(nextCompleted);

    // Cek apakah pasangan itemnya (makanan atau minuman) juga sudah selesai
    const siblingId = sub.categoryType === 'food' ? `${sub.orderId}-drink` : `${sub.orderId}-food`;
    const hasSiblingItem = sub.categoryType === 'food'
      ? sub.ticket.items.some((i) => i.isDrink)
      : sub.ticket.items.some((i) => !i.isDrink);

    const isSiblingComplete = !hasSiblingItem || nextCompleted.has(siblingId);

    if (isSiblingComplete) {
      completeKitchenTicket(sub.orderId);
      showToast(`${sub.ticket.tableNumber}: Seluruh pesanan telah selesai`, 'success');
    } else {
      showToast(
        `${sub.ticket.tableNumber}: ${sub.categoryType === 'food' ? 'Makanan selesai dimasak' : 'Minuman selesai diseduh'}`,
        'info'
      );
    }
  };

  /* ── Render Kartu Tiket Mandiri Per Stasiun ── */
  const renderSubCard = (sub: StationSubTicket) => {
    const waitMinutes = Math.floor(sub.ticket.elapsedSeconds / 60);
    const isTakeaway =
      sub.ticket.type === 'Bawa Pulang' ||
      sub.ticket.tableNumber?.toLowerCase().includes('antrean') ||
      sub.ticket.tableNumber?.toLowerCase().includes('bungkus');

    return (
      <article
        key={sub.subId}
        className="bg-white rounded-2xl border p-4 sm:p-5 flex flex-col justify-between shadow-xs transition-shadow border-[#ebe8e3] hover:border-[#3d1018]/40"
      >
        <div>
          {/* Header Tiket: Nomor Meja & Waktu */}
          <div className="flex items-start justify-between pb-3 border-b border-[#ebe8e3] gap-2">
            <div>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#1c1c19] tracking-tight leading-none">
                {sub.ticket.tableNumber}
              </h3>
              {/* Nama hanya ditampilkan jika pesanan Bawa Pulang / Takeaway */}
              {isTakeaway && sub.ticket.customerName && sub.ticket.customerName !== 'Tamu' && sub.ticket.customerName !== 'Pelanggan Bungkus' && (
                <span className="text-xs text-[#524344] font-semibold block mt-1.5 truncate">
                  {sub.ticket.customerName}
                </span>
              )}
            </div>

            <div className="text-right shrink-0">
              <span className="text-[11px] font-bold text-[#847374] block">
                {sub.ticket.orderTime || `${waitMinutes} mnt lalu`}
              </span>
            </div>
          </div>

          {/* Banner Catatan Meja Jika Ada */}
          {sub.ticket.notesBanner && sub.ticket.notesBanner.trim() && (
            <div className="mt-3 p-2.5 rounded-xl bg-[#fcf9f4] border border-[#ebe8e3] text-xs text-[#524344]">
              <span className="font-bold text-[#1c1c19]">Catatan: </span>
              {sub.ticket.notesBanner.replace(/^Catatan:\s*/i, '')}
            </div>
          )}

          {/* Daftar Menu Khusus Stasiun Ini */}
          <div className="py-3 text-sm text-[#1c1c19]">
            <ul className="space-y-2.5">
              {sub.items.map((item, idx) => (
                <li key={`item-${idx}`} className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="font-extrabold text-base text-[#3d1018] tabular-nums shrink-0">
                      {item.quantity}×
                    </span>
                    <div className="min-w-0">
                      <span className="font-bold text-sm sm:text-base text-[#1c1c19] block leading-snug">
                        {item.name}
                      </span>
                      {item.notes && (
                        <span className="text-xs text-[#994703] font-medium block mt-0.5">
                          Catatan: {item.notes}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Tombol Tindakan Satu-Klik (Tanpa Logo) */}
        <div className="pt-3 border-t border-[#ebe8e3] mt-2">
          <button
            type="button"
            onClick={() => handleCompleteSub(sub)}
            className="w-full py-3.5 px-4 rounded-xl text-white font-bold text-xs sm:text-sm flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-[0.99] bg-[#3d1018] hover:bg-[#58252c]"
          >
            <span>{sub.actionLabel}</span>
          </button>
        </div>
      </article>
    );
  };

  return (
    <div className="flex flex-col w-full min-h-screen pb-4 md:pb-8 max-w-[1720px] mx-auto px-4 sm:px-6 pt-3 space-y-4">
      {/* Top Bar: Pemilih Stasiun Dapur */}
      <div className="flex items-center justify-end pb-3 border-b border-[#ebe8e3] gap-3">
        {/* Tab Pemilih Stasiun Dapur */}
        <div className="flex items-center gap-1.5 bg-[#f0ede9] p-1 rounded-xl">
          {[
            { id: 'Semua Bagian', label: 'Semua Bagian' },
            { id: 'Dapur Utama (Makanan)', label: 'Dapur Makanan' },
            { id: 'Bar Minuman', label: 'Bar Minuman' },
          ].map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setStationFilter(st.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                stationFilter === st.id
                  ? 'bg-[#3d1018] text-white shadow-xs'
                  : 'text-[#524344] hover:text-[#1c1c19]'
              }`}
            >
              <span>{st.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid Antrean Kartu Terpisah Per Stasiun */}
      {activeSubTickets.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-[#ebe8e3] bg-white/60 p-8 space-y-2">
          <h3 className="font-serif font-bold text-base text-[#1c1c19]">Tidak ada antrean pesanan</h3>
          <p className="text-xs text-[#847374] max-w-sm mx-auto">
            Semua hidangan dan minuman telah selesai disiapkan. Pesanan baru akan otomatis muncul di sini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
          {activeSubTickets.map((sub) => renderSubCard(sub))}
        </div>
      )}
    </div>
  );
};
