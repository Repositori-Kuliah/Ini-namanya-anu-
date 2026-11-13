import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { KitchenTicket } from '../types';

export const KitchenDisplayView: React.FC = () => {
  const { kitchenTickets, advanceTicketStatus, showToast } = useApp();

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedStation, setSelectedStation] = useState('All stations');
  const [activeLaneFilter, setActiveLaneFilter] = useState<'new' | 'preparing' | 'ready'>('new');

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

  const handleAdvance = (ticket: KitchenTicket) => {
    playKitchenChime();
    advanceTicketStatus(ticket.id);
    if (ticket.status === 'new') {
      showToast(`${ticket.tableNumber}: Mulai dimasak`, 'info');
    } else if (ticket.status === 'preparing') {
      showToast(`${ticket.tableNumber}: Siap diantar waiter`, 'success');
    } else if (ticket.status === 'ready') {
      showToast(`${ticket.tableNumber}: Selesai disajikan ke meja`, 'success');
    }
  };

  const formatTimer = (seconds: number) => {
    if (seconds >= 3600) {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      return `${hours}j ${String(mins).padStart(2, '0')}m`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Filter stasiun dapur
  const stationTickets = kitchenTickets.filter((t) =>
    selectedStation === 'All stations' ? true : t.station === selectedStation
  );

  const newTickets = stationTickets.filter((t) => t.status === 'new');
  const preparingTickets = stationTickets.filter((t) => t.status === 'preparing');
  const readyTickets = stationTickets.filter((t) => t.status === 'ready');

  /* ── Kartu Tiket Dapur (Sederhana, Bersih, Terbaca Jelas dari Jauh) ── */
  const renderTicketCard = (ticket: KitchenTicket) => {
    const isOverdue = ticket.elapsedSeconds >= 900; // >15 menit
    const isNew = ticket.status === 'new';
    const isPrep = ticket.status === 'preparing';
    const isReady = ticket.status === 'ready';

    return (
      <article
        key={ticket.id}
        className={`bg-white rounded-xl border p-4 flex flex-col justify-between shadow-xs transition-shadow ${
          isOverdue
            ? 'border-red-600 ring-2 ring-red-500/30'
            : isPrep
            ? 'border-[#994703]'
            : isReady
            ? 'border-[#3d1018] ring-1 ring-[#3d1018]/20'
            : 'border-[#ebe8e3]'
        }`}
      >
        <div>
          {/* Baris Atas: Nomor Meja & Timer */}
          <div className="flex items-start justify-between pb-2 border-b border-[#ebe8e3]">
            <div>
              <span className="text-[10px] font-bold text-[#847374] uppercase tracking-wider block">
                {ticket.type} • {ticket.ticketNumber}
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#1c1c19] tracking-tight leading-none mt-0.5">
                {ticket.tableNumber}
              </h3>
            </div>

            <div className="text-right">
              <span
                className={`inline-block font-mono font-bold text-sm px-2.5 py-1 rounded tabular-nums ${
                  isOverdue
                    ? 'bg-red-700 text-white'
                    : isPrep
                    ? 'bg-[#ffdbc9] text-[#753400]'
                    : isReady
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-[#f0ede9] text-[#1c1c19]'
                }`}
              >
                {formatTimer(ticket.elapsedSeconds)}
              </span>
              {isOverdue && (
                <span className="text-[10px] text-red-700 font-bold block mt-0.5 uppercase tracking-wide">
                  &gt;15 Menit
                </span>
              )}
            </div>
          </div>

          {/* Banner Catatan Meja / Pesanan Jika Ada */}
          {ticket.notesBanner && (
            <div className="mt-2.5 p-2 rounded bg-amber-50 border border-amber-200 text-xs text-amber-950 font-medium">
              <strong>Catatan:</strong> {ticket.notesBanner}
            </div>
          )}

          {/* Daftar Menu Dipesan (Besar & Kontras Tinggi) */}
          <ul className="py-3 space-y-2 text-sm text-[#1c1c19]">
            {ticket.items.map((item, idx) => (
              <li key={idx} className="flex items-start justify-between gap-2">
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

                {isReady && (
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded shrink-0">
                    Siap
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Tombol Tindakan Alur Operasional */}
        <div className="pt-3 border-t border-[#ebe8e3] mt-1">
          <button
            type="button"
            onClick={() => handleAdvance(ticket)}
            className={`w-full py-3 px-4 rounded-xl text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.99] ${
              isNew
                ? 'bg-[#3d1018] hover:bg-[#58252c]'
                : isPrep
                ? 'bg-[#994703] hover:bg-[#7a3200]'
                : 'bg-emerald-700 hover:bg-emerald-800'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isNew ? 'skillet' : isPrep ? 'notifications_active' : 'check_circle'}
            </span>
            <span>
              {isNew
                ? 'Mulai Masak'
                : isPrep
                ? 'Siap Diantar'
                : 'Sudah Diantar'}
            </span>
          </button>
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
    <div className="flex flex-col w-full min-h-screen pb-20 md:pb-8 max-w-[1720px] mx-auto px-4 sm:px-6 pt-3">
      {/* Top Bar Kontrol Dapur */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 mb-4 gap-3 border-b border-[#ebe8e3]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1c1c19] tracking-tight">
            Pantau Pesanan
          </h1>
        </div>

        {/* Pengaturan Suara & Stasiun Dapur */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              showToast(`Suara bel dapur: ${!soundEnabled ? 'Aktif' : 'Mati'}`);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              soundEnabled
                ? 'bg-white border-[#ebe8e3] text-[#1c1c19] hover:bg-[#f6f3ee]'
                : 'bg-[#f0ede9] border-[#ebe8e3] text-[#847374]'
            }`}
            aria-label="Tombol pengatur suara notifikasi dapur"
          >
            <span className="material-symbols-outlined text-[16px]">
              {soundEnabled ? 'volume_up' : 'volume_off'}
            </span>
            <span>{soundEnabled ? 'Suara Aktif' : 'Senyap'}</span>
          </button>

          <div className="relative">
            <select
              value={selectedStation}
              onChange={(e) => setSelectedStation(e.target.value)}
              className="appearance-none bg-white border border-[#ebe8e3] rounded-lg px-3 py-1.5 pr-8 text-xs font-semibold text-[#1c1c19] cursor-pointer outline-none hover:bg-[#f6f3ee] transition-colors focus:border-[#3d1018]"
              aria-label="Pilih stasiun dapur"
            >
              <option value="All stations">Semua Bagian</option>
              <option value="Dapur Utama (Makanan)">Dapur Utama (Makanan)</option>
              <option value="Bar Minuman">Bar Minuman</option>
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[#847374] text-[16px] pointer-events-none">
              expand_more
            </span>
          </div>
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
