import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { KitchenTicket } from '../types';

export const KitchenDisplayView: React.FC = () => {
  const { kitchenTickets, advanceTicketStatus, showToast, storeSettings } = useApp();

  const [activeLaneFilter, setActiveLaneFilter] = useState<'new' | 'preparing' | 'ready'>('new');
  const [stationFilter, setStationFilter] = useState<string>(storeSettings.soundStation || 'Semua Bagian');

  const soundEnabled = storeSettings.soundEnabled !== false;
  const selectedStation = storeSettings.soundStation || 'Semua Bagian';

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

  const handleAdvance = (ticket: KitchenTicket, itemType?: 'food' | 'drink') => {
    playKitchenChime();
    advanceTicketStatus(ticket.id);
    const typeLabel = itemType === 'drink' ? 'Minuman' : itemType === 'food' ? 'Makanan' : 'Pesanan';
    const actionLabel = itemType === 'drink' ? 'mulai dibuat' : 'mulai dimasak';

    if (ticket.status === 'new') {
      showToast(`${ticket.tableNumber}: ${typeLabel} ${actionLabel}`, 'info');
    } else if (ticket.status === 'preparing') {
      showToast(`${ticket.tableNumber}: ${typeLabel} siap diantar waiter`, 'success');
    } else if (ticket.status === 'ready') {
      showToast(`${ticket.tableNumber}: Selesai disajikan ke meja`, 'success');
    }
  };

  // Filter stasiun dapur (Dapur Utama vs Bar Minuman)
  const stationTickets = kitchenTickets.filter((t) => {
    if (stationFilter === 'Dapur Utama (Makanan)') {
      return t.items.some((i) => !i.isDrink);
    }
    if (stationFilter === 'Bar Minuman') {
      return t.items.some((i) => i.isDrink);
    }
    return true;
  });

  const newTickets = stationTickets.filter((t) => t.status === 'new');
  const preparingTickets = stationTickets.filter((t) => t.status === 'preparing');
  const readyTickets = stationTickets.filter((t) => t.status === 'ready');

  /* ── Kartu Tiket Dapur (Sederhana, Bersih, Terbaca Jelas dari Jauh) ── */
  const renderTicketCard = (ticket: KitchenTicket) => {
    const isNew = ticket.status === 'new';
    const isPrep = ticket.status === 'preparing';
    const isReady = ticket.status === 'ready';

    const isFoodOnlyStation = stationFilter === 'Dapur Utama (Makanan)';
    const isDrinkOnlyStation = stationFilter === 'Bar Minuman';

    // 1 Card per meja/antrean, tetapi item DIPISAH antara Makanan dan Minuman
    const foodItems = ticket.items.filter((item) => !item.isDrink);
    const drinkItems = ticket.items.filter((item) => item.isDrink);

    const displayFoodItems = isDrinkOnlyStation ? [] : foodItems;
    const displayDrinkItems = isFoodOnlyStation ? [] : drinkItems;

    // Jika filter stasiun khusus aktif dan tidak ada item, lewati
    if (displayFoodItems.length === 0 && displayDrinkItems.length === 0) return null;

    return (
      <article
        key={ticket.id}
        className={`bg-white rounded-xl border p-4 flex flex-col justify-between shadow-xs transition-shadow ${
          isPrep
            ? 'border-[#994703]'
            : isReady
            ? 'border-[#3d1018] ring-1 ring-[#3d1018]/20'
            : 'border-[#ebe8e3]'
        }`}
      >
        <div>
          {/* Baris Atas: Nomor Meja / Antrean */}
          <div className="pb-2 border-b border-[#ebe8e3]">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#1c1c19] tracking-tight leading-none">
              {ticket.tableNumber}
            </h3>
            {ticket.customerName && ticket.customerName !== 'Tamu' && ticket.customerName !== 'Pelanggan Bungkus' && (
              <span className="text-xs text-[#524344] font-semibold block mt-1.5">
                {ticket.customerName}
              </span>
            )}
          </div>

          {/* Banner Catatan Meja / Pesanan Jika Ada (Hanya jika kasir memberi catatan khusus) */}
          {ticket.notesBanner && ticket.notesBanner.trim() && (
            <div className="mt-2.5 p-2 rounded-lg bg-[#fcf9f4] border border-[#ebe8e3] text-xs text-[#524344]">
              <span className="font-bold text-[#1c1c19]">Catatan: </span>
              {ticket.notesBanner.replace(/^Catatan:\s*/i, '')}
            </div>
          )}

          {/* Daftar Menu Dipesan (DIPISAH garis biasa antara Makanan & Minuman) */}
          <div className="py-2.5 space-y-2.5 text-sm text-[#1c1c19]">
            {/* Bagian MAKANAN */}
            {displayFoodItems.length > 0 && (
              <ul className="space-y-2 pl-0.5">
                {displayFoodItems.map((item, idx) => (
                  <li key={`food-${idx}`} className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <span className="font-extrabold text-base text-[#3d1018] tabular-nums shrink-0">
                        {item.quantity}×
                      </span>
                      <div className="min-w-0">
                        <span className="font-bold text-sm sm:text-base text-[#1c1c19] block leading-snug">
                          {item.name}
                        </span>
                        {item.notes && (
                          <span className="text-xs text-[#994703] font-medium block">
                            Catatan: {item.notes}
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {/* Garis Pemisah Biasa Antara Makanan & Minuman */}
            {displayFoodItems.length > 0 && displayDrinkItems.length > 0 && (
              <div className="border-t border-[#ebe8e3] my-2" />
            )}

            {/* Bagian MINUMAN */}
            {displayDrinkItems.length > 0 && (
              <ul className="space-y-2 pl-0.5">
                {displayDrinkItems.map((item, idx) => (
                  <li key={`drink-${idx}`} className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <span className="font-extrabold text-base text-[#1e613b] tabular-nums shrink-0">
                        {item.quantity}×
                      </span>
                      <div className="min-w-0">
                        <span className="font-bold text-sm sm:text-base text-[#1c1c19] block leading-snug">
                          {item.name}
                        </span>
                        {item.notes && (
                          <span className="text-xs text-[#994703] font-medium block">
                            Catatan: {item.notes}
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Tombol Tindakan: Dipisah untuk Makanan (Mulai Masak) & Minuman (Mulai Membuat) */}
        <div className="pt-3 border-t border-[#ebe8e3] mt-1">
          {displayFoodItems.length > 0 && displayDrinkItems.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleAdvance(ticket, 'food')}
                className={`py-2.5 px-3 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-[0.99] ${
                  isNew
                    ? 'bg-[#3d1018] hover:bg-[#58252c]'
                    : isPrep
                    ? 'bg-[#994703] hover:bg-[#7a3200]'
                    : 'bg-[#58252c] hover:bg-[#3d1018]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isNew ? 'skillet' : isPrep ? 'notifications_active' : 'check_circle'}
                </span>
                <span>
                  {isNew ? 'Mulai Masak' : isPrep ? 'Makanan Siap' : 'Selesai'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleAdvance(ticket, 'drink')}
                className={`py-2.5 px-3 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-[0.99] ${
                  isNew
                    ? 'bg-[#1e613b] hover:bg-[#164a2c]'
                    : isPrep
                    ? 'bg-[#994703] hover:bg-[#7a3200]'
                    : 'bg-[#58252c] hover:bg-[#3d1018]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isNew ? 'local_bar' : isPrep ? 'notifications_active' : 'check_circle'}
                </span>
                <span>
                  {isNew ? 'Mulai Membuat' : isPrep ? 'Minuman Siap' : 'Selesai'}
                </span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => handleAdvance(ticket, displayDrinkItems.length > 0 ? 'drink' : 'food')}
              className={`w-full py-3 px-4 rounded-xl text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.99] ${
                isNew
                  ? displayDrinkItems.length > 0 ? 'bg-[#1e613b] hover:bg-[#164a2c]' : 'bg-[#3d1018] hover:bg-[#58252c]'
                  : isPrep
                  ? 'bg-[#994703] hover:bg-[#7a3200]'
                  : 'bg-[#58252c] hover:bg-[#3d1018]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isNew
                  ? displayDrinkItems.length > 0 ? 'local_bar' : 'skillet'
                  : isPrep ? 'notifications_active' : 'check_circle'}
              </span>
              <span>
                {isNew
                  ? displayDrinkItems.length > 0 ? 'Mulai Membuat' : 'Mulai Masak'
                  : isPrep
                  ? 'Siap Diantar'
                  : 'Sudah Diantar'}
              </span>
            </button>
          )}
        </div>
      </article>
    );
  };

  /* ── Kolom Kosong ── */
  const renderEmptyColumn = (message: string) => (
    <div className="rounded-xl border border-dashed border-[#ebe8e3] p-8 text-center text-xs text-[#847374] bg-white/40">
      {message}
    </div>
  );

  return (
    <div className="flex flex-col w-full min-h-screen pb-4 md:pb-8 max-w-[1720px] mx-auto px-4 sm:px-6 pt-3">
      {/* Top Bar Kontrol Dapur & Pemilih Stasiun (Makanan vs Minuman) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 mb-4 gap-3 border-b border-[#ebe8e3]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1c1c19] tracking-tight">
            Pantau Pesanan Dapur &amp; Bar
          </h1>
          <p className="text-xs text-[#524344] mt-0.5">
            Layar tiket dapur (KDS) dengan rute terpisah antara Dapur Utama (Makanan) dan Bar Minuman.
          </p>
        </div>

        {/* Tab Pemilih Stasiun Dapur */}
        <div className="flex items-center gap-1.5 bg-[#f0ede9] p-1 rounded-xl">
          {[
            { id: 'Semua Bagian', label: 'Semua Bagian', icon: 'splitscreen' },
            { id: 'Dapur Utama (Makanan)', label: 'Dapur Makanan', icon: 'soup_kitchen' },
            { id: 'Bar Minuman', label: 'Bar Minuman', icon: 'local_bar' },
          ].map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setStationFilter(st.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                stationFilter === st.id
                  ? 'bg-[#3d1018] text-white shadow-xs'
                  : 'text-[#524344] hover:text-[#1c1c19] hover:bg-white/60'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">{st.icon}</span>
              <span>{st.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex items-center gap-1 bg-[#f0ede9] p-1 rounded-xl mb-4">
        <button
          type="button"
          onClick={() => setActiveLaneFilter('new')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center ${
            activeLaneFilter === 'new' ? 'bg-white text-[#3d1018] shadow-xs' : 'text-[#524344]'
          }`}
        >
          Baru ({newTickets.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveLaneFilter('preparing')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center ${
            activeLaneFilter === 'preparing' ? 'bg-white text-[#3d1018] shadow-xs' : 'text-[#524344]'
          }`}
        >
          Dimasak ({preparingTickets.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveLaneFilter('ready')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center ${
            activeLaneFilter === 'ready' ? 'bg-white text-[#3d1018] shadow-xs' : 'text-[#524344]'
          }`}
        >
          Siap ({readyTickets.length})
        </button>
      </div>

      {/* Desktop 3-Column Layout */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-5 items-start">
        {/* Kolom 1: BARU */}
        <section aria-label="Kolom Pesanan Baru" className="flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#ebe8e3]">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#1c1c19]">1. Baru</h2>
              <span className="px-1.5 py-0.2 rounded-full bg-[#f0ede9] text-[#524344] text-[11px] font-bold">
                {newTickets.length}
              </span>
            </div>
            <span className="text-[11px] text-[#847374]">Menunggu dimasak</span>
          </div>

          <div className="space-y-3">
            {newTickets.length === 0
              ? renderEmptyColumn('Tidak ada pesanan baru.')
              : newTickets.map(renderTicketCard)}
          </div>
        </section>

        {/* Kolom 2: DIMASAK */}
        <section aria-label="Kolom Sedang Dimasak" className="flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#ebe8e3]">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#1c1c19]">2. Dimasak</h2>
              <span className="px-1.5 py-0.2 rounded-full bg-[#ffdbc9] text-[#753400] text-[11px] font-bold">
                {preparingTickets.length}
              </span>
            </div>
            <span className="text-[11px] text-[#994703] font-semibold">Proses dapur</span>
          </div>

          <div className="space-y-3">
            {preparingTickets.length === 0
              ? renderEmptyColumn('Dapur sedang tidak memasak.')
              : preparingTickets.map(renderTicketCard)}
          </div>
        </section>

        {/* Kolom 3: SIAP DIANTAR */}
        <section aria-label="Kolom Siap Diantar" className="flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#ebe8e3]">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#1c1c19]">3. Siap</h2>
              <span className="px-1.5 py-0.2 rounded-full bg-[#3d1018]/10 text-[#3d1018] text-[11px] font-bold">
                {readyTickets.length}
              </span>
            </div>
            <span className="text-[11px] text-[#524344] font-medium">Siap diantar waiter</span>
          </div>

          <div className="space-y-3">
            {readyTickets.length === 0
              ? renderEmptyColumn('Tidak ada pesanan menunggu diantar.')
              : readyTickets.map(renderTicketCard)}
          </div>
        </section>
      </div>

      {/* Mobile Single Column Stream Berdasarkan Tab Terpilih */}
      <div className="lg:hidden space-y-3">
        {activeLaneFilter === 'new' &&
          (newTickets.length === 0
            ? renderEmptyColumn('Tidak ada pesanan baru.')
            : newTickets.map(renderTicketCard))}
        {activeLaneFilter === 'preparing' &&
          (preparingTickets.length === 0
            ? renderEmptyColumn('Dapur sedang tidak memasak.')
            : preparingTickets.map(renderTicketCard))}
        {activeLaneFilter === 'ready' &&
          (readyTickets.length === 0
            ? renderEmptyColumn('Tidak ada pesanan menunggu diantar.')
            : readyTickets.map(renderTicketCard))}
      </div>
    </div>
  );
};
