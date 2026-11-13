import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { HelpModal } from './Navigation';

interface RollerWheelProps {
  label: string;
  value: number;
  max: number;
  step?: number;
  onChange: (val: number) => void;
}

const RollerWheel: React.FC<RollerWheelProps> = ({ label, value, max, step = 1, onChange }) => {
  const pad = (n: number) => String(n).padStart(2, '0');

  const prev = (value - step + max) % max;
  const next = (value + step) % max;

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY > 0) {
      onChange(next);
    } else {
      onChange(prev);
    }
  };

  const touchStartY = React.useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;
    if (Math.abs(diff) > 20) {
      if (diff > 0) {
        onChange(prev);
      } else {
        onChange(next);
      }
      touchStartY.current = currentY;
    }
  };

  const handleTouchEnd = () => {
    touchStartY.current = null;
  };

  return (
    <div className="flex flex-col items-center select-none">
      <span className="text-[10px] font-bold text-[#847374] uppercase tracking-wider mb-0.5">
        {label}
      </span>

      {/* Tombol Chevron Atas */}
      <button
        type="button"
        onClick={() => onChange(prev)}
        className="w-10 h-5 flex items-center justify-center text-[#847374] hover:text-[#3d1018] hover:bg-[#ebe8e3] rounded transition-colors cursor-pointer"
        aria-label={`Kurang ${label}`}
      >
        <span className="material-symbols-outlined text-[16px]">keyboard_arrow_up</span>
      </button>

      {/* Wadah Silinder Roller Berputar */}
      <div
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="flex flex-col items-center justify-center py-0.5 w-12 cursor-grab active:cursor-grabbing"
        title="Scroll roda mouse atau geser ke atas/bawah untuk mengubah"
      >
        {/* Angka Sebelumnya */}
        <button
          type="button"
          onClick={() => onChange(prev)}
          className="text-xs text-[#847374] opacity-40 hover:opacity-100 font-mono py-0.5 transition-opacity cursor-pointer"
        >
          {pad(prev)}
        </button>

        {/* Nilai Aktif Terpilih (Kapsul Burgundy) */}
        <div className="w-11 h-8 my-0.5 rounded-lg bg-[#3d1018] text-white flex items-center justify-center font-mono font-bold text-sm shadow-xs ring-1 ring-[#3d1018]/20">
          {pad(value)}
        </div>

        {/* Angka Sesudahnya */}
        <button
          type="button"
          onClick={() => onChange(next)}
          className="text-xs text-[#847374] opacity-40 hover:opacity-100 font-mono py-0.5 transition-opacity cursor-pointer"
        >
          {pad(next)}
        </button>
      </div>

      {/* Tombol Chevron Bawah */}
      <button
        type="button"
        onClick={() => onChange(next)}
        className="w-10 h-5 flex items-center justify-center text-[#847374] hover:text-[#3d1018] hover:bg-[#ebe8e3] rounded transition-colors cursor-pointer"
        aria-label={`Tambah ${label}`}
      >
        <span className="material-symbols-outlined text-[16px]">keyboard_arrow_down</span>
      </button>
    </div>
  );
};

interface RollerTimePickerProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  presets?: string[];
}

const RollerTimePicker: React.FC<RollerTimePickerProps> = ({ label, value, onChange, presets }) => {
  const [hStr, mStr] = (value || '08:00').split(':');
  const h = parseInt(hStr, 10) || 0;
  const m = parseInt(mStr, 10) || 0;

  const handleHourChange = (newH: number) => {
    const formatted = `${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    onChange(formatted);
  };

  const handleMinuteChange = (newM: number) => {
    const formatted = `${String(h).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
    onChange(formatted);
  };

  return (
    <div className="bg-[#fcf9f4] p-3 rounded-xl border border-[#ebe8e3] flex flex-col justify-between">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-bold text-[#1c1c19]">{label}</span>
        <span className="font-mono text-sm font-bold text-[#3d1018] tabular-nums bg-white px-2 py-0.5 rounded border border-[#ebe8e3] shadow-2xs">
          {value}
        </span>
      </div>

      {/* Dual Roller Drums (Jam & Menit) */}
      <div className="flex items-center justify-center gap-2 bg-white py-1 px-2.5 rounded-xl border border-[#ebe8e3] shadow-2xs">
        <RollerWheel
          label="Jam"
          value={h}
          max={24}
          step={1}
          onChange={handleHourChange}
        />
        <div className="text-lg font-bold font-mono text-[#3d1018] self-center pb-2">:</div>
        <RollerWheel
          label="Menit"
          value={m}
          max={60}
          step={5}
          onChange={handleMinuteChange}
        />
      </div>

      {/* Presets Jam Populer */}
      {presets && presets.length > 0 && (
        <div className="flex items-center justify-center gap-1.5 flex-wrap pt-2 mt-2 border-t border-[#ebe8e3]">
          {presets.map((timeStr) => (
            <button
              key={timeStr}
              type="button"
              onClick={() => onChange(timeStr)}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                value === timeStr
                  ? 'bg-[#3d1018] text-white shadow-2xs'
                  : 'bg-white text-[#524344] hover:bg-[#ebe8e3] border border-[#ebe8e3]'
              }`}
            >
              {timeStr}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const PengaturanView: React.FC = () => {
  const {
    storeSettings,
    updateStoreSettings,
    playDingSound,
    showToast,
  } = useApp();

  const [openHourInput, setOpenHourInput] = useState(storeSettings.openHour || '08:00');
  const [closeHourInput, setCloseHourInput] = useState(storeSettings.closeHour || '22:00');
  const [drawerCashInput, setDrawerCashInput] = useState<number>(storeSettings.drawerInitialCash ?? 200000);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const handleSaveOperational = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreSettings({
      openHour: openHourInput,
      closeHour: closeHourInput,
      drawerInitialCash: drawerCashInput,
    });
    showToast('Pengaturan jam operasional & modal awal laci berhasil disimpan', 'success');
  };

  const isKdsActive = storeSettings.enableKitchenDisplay ?? storeSettings.kdsEnabled ?? true;
  const isInventoryActive = storeSettings.enableInventoryTracking ?? storeSettings.autoInventoryDeduction ?? true;

  return (
    <div className="flex flex-col w-full pb-24 md:pb-8 max-w-[1540px] mx-auto px-4 sm:px-6 lg:px-8 pt-3 space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#ebe8e3]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1c1c19] tracking-tight">
            Pengaturan Sistem Outlet
          </h1>
          <p className="text-xs text-[#524344] mt-0.5">
            Konfigurasi jam kerja, kontrol modul fitur, notifikasi suara, dan panduan operasional Rawon Gusti.
          </p>
        </div>
      </div>

      {/* ================= BARIS 1: OPERASIONAL UTAMA OUTLET (2 KOLOM SEJAJAR BERIMBANG) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        {/* Kartu Kiri: Jam Buka & Operasional Harian */}
        <div className="bg-white p-5 rounded-2xl border border-[#ebe8e3] shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2.5 pb-2 border-b border-[#ebe8e3]">
              <div className="w-8 h-8 rounded-lg bg-[#3d1018] text-white flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-[18px]">schedule</span>
              </div>
              <div>
                <h2 className="font-bold text-sm text-[#1c1c19]">Jam Buka &amp; Operasional Harian</h2>
                <p className="text-[11px] text-[#524344]">Jadwal aktif pemesanan outlet &amp; status hari libur</p>
              </div>
            </div>

            {/* Saklar Force Close */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#fcf9f4] border border-[#ebe8e3] mt-3">
              <div className="max-w-[78%]">
                <span className="font-bold text-xs text-[#1c1c19] block">
                  Tutup Sementara Outlet (Force Close)
                </span>
                <span className="text-[11px] text-[#524344] leading-relaxed block mt-0.5">
                  {storeSettings.forceClose
                    ? 'Outlet tutup sementara. Pemesanan mandiri meja dinonaktifkan.'
                    : 'Outlet buka normal sesuai jadwal harian di bawah.'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = !storeSettings.forceClose;
                  updateStoreSettings({ forceClose: next });
                  showToast(`Status outlet: ${next ? 'Tutup Sementara' : 'Buka Normal'}`, next ? 'warning' : 'success');
                }}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                  storeSettings.forceClose ? 'bg-[#994703]' : 'bg-[#e0dcd8]'
                }`}
                aria-pressed={storeSettings.forceClose}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                    storeSettings.forceClose ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Roller Time Picker Jam Buka & Jam Tutup serta Modal Awal Kasir */}
            <form onSubmit={handleSaveOperational} className="space-y-3 pt-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <RollerTimePicker
                  label="Jam Buka Outlet"
                  value={openHourInput}
                  onChange={setOpenHourInput}
                  presets={['07:00', '08:00', '09:00', '10:00']}
                />
                <RollerTimePicker
                  label="Jam Tutup Outlet"
                  value={closeHourInput}
                  onChange={setCloseHourInput}
                  presets={['20:00', '21:00', '22:00', '23:00']}
                />
              </div>

              {/* Input Modal Awal Kasir di Laci */}
              <div className="p-3 rounded-xl bg-[#fcf9f4] border border-[#ebe8e3] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="max-w-[65%]">
                  <label htmlFor="drawer-cash-input" className="font-bold text-xs text-[#1c1c19] block">
                    Modal Awal Kasir di Laci (Drawer)
                  </label>
                  <span className="text-[11px] text-[#524344] block mt-0.5 leading-relaxed">
                    Nominal kas awal pecahan kecil kembalian. Masuk otomatis ke rekonsiliasi kas di Laporan.
                  </span>
                </div>
                <div className="relative shrink-0 w-full sm:w-44">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#847374]">Rp</span>
                  <input
                    id="drawer-cash-input"
                    type="text"
                    inputMode="numeric"
                    value={drawerCashInput.toLocaleString('id-ID')}
                    onChange={(e) => {
                      const num = parseInt(e.target.value.replace(/\D/g, ''), 10) || 0;
                      setDrawerCashInput(num);
                    }}
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#ebe8e3] rounded-xl text-xs font-bold text-[#1c1c19] text-right focus:outline-none focus:border-[#3d1018] shadow-2xs"
                    placeholder="200.000"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#3d1018] hover:bg-[#58252c] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  Simpan Pengaturan Operasional
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Kartu Kanan: Suara & Audio Notifikasi */}
        <div className="bg-white p-5 rounded-2xl border border-[#ebe8e3] shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-[#ebe8e3]">
              <div className="w-8 h-8 rounded-lg bg-[#3d1018] text-white flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-[18px]">notifications_active</span>
              </div>
              <div>
                <h2 className="font-bold text-sm text-[#1c1c19]">Suara &amp; Audio Notifikasi</h2>
                <p className="text-[11px] text-[#524344]">Pengingat nada suara lonceng pesanan baru &amp; rute stasiun</p>
              </div>
            </div>

            {/* Toggle Saklar Audio Ding */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#fcf9f4] border border-[#ebe8e3]">
              <div className="max-w-[75%]">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-[#1c1c19]">
                    Audio Ding Notifikasi
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      playDingSound();
                      showToast('Uji coba suara chime berhasil', 'info');
                    }}
                    className="px-2 py-0.5 rounded-md bg-white border border-[#ebe8e3] hover:bg-[#ebe8e3] text-[10px] font-bold text-[#3d1018] cursor-pointer transition-colors shadow-2xs"
                  >
                    Uji Coba Suara
                  </button>
                </div>
                <span className="text-[11px] text-[#524344] leading-relaxed block mt-0.5">
                  Berbunyi otomatis saat ada tiket pesanan masuk atau panggilan pelayan meja.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = !storeSettings.soundEnabled;
                  updateStoreSettings({ soundEnabled: next });
                  showToast(`Suara notifikasi ${next ? 'diaktifkan' : 'dimatikan'}`);
                }}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                  storeSettings.soundEnabled ? 'bg-[#3d1018]' : 'bg-[#e0dcd8]'
                }`}
                aria-pressed={storeSettings.soundEnabled}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                    storeSettings.soundEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Pilihan Area Stasiun Dapur */}
            <div className="p-3.5 rounded-xl bg-[#fcf9f4] border border-[#ebe8e3] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="font-bold text-xs text-[#1c1c19] block">
                  Area Dapur / Stasiun Pantau
                </span>
                <span className="text-[11px] text-[#524344] block mt-0.5">
                  Pilih stasiun default untuk pemfilteran tiket dan nada notifikasi.
                </span>
              </div>
              <select
                value={storeSettings.soundStation || 'Semua Bagian'}
                onChange={(e) => {
                  updateStoreSettings({ soundStation: e.target.value });
                  showToast(`Area stasiun diatur ke: ${e.target.value}`, 'info');
                }}
                className="bg-white border border-[#ebe8e3] rounded-xl px-3 py-2 text-xs font-bold text-[#1c1c19] outline-none cursor-pointer focus:border-[#3d1018]"
              >
                <option value="Semua Bagian">Semua Bagian</option>
                <option value="Dapur Utama (Makanan)">Dapur Utama (Makanan)</option>
                <option value="Bar Minuman">Bar Minuman</option>
              </select>
            </div>

            {/* Status Info Speaker */}
            <div className="p-3 bg-[#fcf9f4] rounded-xl border border-[#ebe8e3] flex items-center gap-2.5 text-xs text-[#524344]">
              <span className="material-symbols-outlined text-[18px] text-[#994703]">volume_up</span>
              <span>
                Audio sintetis Web Audio API aktif. Suara diputar lokal pada peramban perangkat kasir/dapur tanpa internet tambahan.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= BARIS 2: MODUL FITUR OUTLET (3 KOLOM SEJAJAR 100% PERSIS / SEJEJER) ================= */}
      <div>
        <div className="pb-2 mb-3 border-b border-[#ebe8e3]">
          <h2 className="font-bold text-sm text-[#1c1c19] flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-[#994703]">toggle_on</span>
            <span>Kendali Saklar Modul Fitur Restoran</span>
          </h2>
          <p className="text-[11px] text-[#524344]">Hidupkan atau matikan modul sistem sesuai alur operasional cabang</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          {/* Modul 1: Self-Ordering Meja */}
          <div className="bg-white p-5 rounded-2xl border border-[#ebe8e3] shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2.5 pb-2 border-b border-[#ebe8e3]">
                <div className="w-8 h-8 rounded-lg bg-[#3d1018] text-white flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1c1c19]">Pemesanan Mandiri Tamu</h3>
                  <p className="text-[11px] text-[#524344]">Self-Ordering QR Meja</p>
                </div>
              </div>

              <div className="py-3">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold mb-2 ${
                  storeSettings.selfOrderEnabled
                    ? 'bg-amber-100 text-[#3d1018] border border-amber-200'
                    : 'bg-stone-100 text-[#847374]'
                }`}>
                  {storeSettings.selfOrderEnabled ? 'Status: Aktif' : 'Status: Nonaktif'}
                </span>
                <p className="text-xs text-[#524344] leading-relaxed">
                  {storeSettings.selfOrderEnabled
                    ? 'Pelanggan dapat memindai stiker QR di meja untuk memesan hidangan dan menyelesaikan pembayaran mandiri.'
                    : 'Pemesanan digital ditutup; tamu diarahkan memanggil pelayan manual untuk pemesanan di meja.'}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-[#ebe8e3] flex items-center justify-between">
              <span className="text-xs font-bold text-[#1c1c19]">Aktifkan Modul</span>
              <button
                type="button"
                onClick={() => {
                  const next = !storeSettings.selfOrderEnabled;
                  updateStoreSettings({ selfOrderEnabled: next });
                  showToast(`Self ordering ${next ? 'diaktifkan' : 'dinonaktifkan (mode panggil pelayan)'}`, 'info');
                }}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                  storeSettings.selfOrderEnabled ? 'bg-[#3d1018]' : 'bg-[#e0dcd8]'
                }`}
                aria-pressed={storeSettings.selfOrderEnabled}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                    storeSettings.selfOrderEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Modul 2: Pantau Pesanan (KDS Dapur) */}
          <div className="bg-white p-5 rounded-2xl border border-[#ebe8e3] shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2.5 pb-2 border-b border-[#ebe8e3]">
                <div className="w-8 h-8 rounded-lg bg-[#3d1018] text-white flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-[18px]">soup_kitchen</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1c1c19]">Pantau Pesanan Dapur</h3>
                  <p className="text-[11px] text-[#524344]">Kitchen Display System (KDS)</p>
                </div>
              </div>

              <div className="py-3">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold mb-2 ${
                  isKdsActive
                    ? 'bg-amber-100 text-[#3d1018] border border-amber-200'
                    : 'bg-stone-100 text-[#847374]'
                }`}>
                  {isKdsActive ? 'Status: Aktif' : 'Status: Nonaktif'}
                </span>
                <p className="text-xs text-[#524344] leading-relaxed">
                  {isKdsActive
                    ? 'Tab "Pantau Pesanan" muncul di navigasi samping kasir/dapur untuk memantau tiket antrean memasak secara digital.'
                    : 'Modul disembunyikan dari sidebar jika dapur memilih alur pesanan manual atau mengandalkan tiket cetak.'}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-[#ebe8e3] flex items-center justify-between">
              <span className="text-xs font-bold text-[#1c1c19]">Aktifkan Modul</span>
              <button
                type="button"
                onClick={() => {
                  const next = !isKdsActive;
                  updateStoreSettings({
                    enableKitchenDisplay: next,
                    kdsEnabled: next,
                  });
                  showToast(`Modul Pantau Pesanan (KDS) ${next ? 'diaktifkan' : 'dinonaktifkan'}`);
                }}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                  isKdsActive ? 'bg-[#3d1018]' : 'bg-[#e0dcd8]'
                }`}
                aria-pressed={isKdsActive}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                    isKdsActive ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Modul 3: Pelacakan Stok Bahan Baku Otomatis */}
          <div className="bg-white p-5 rounded-2xl border border-[#ebe8e3] shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2.5 pb-2 border-b border-[#ebe8e3]">
                <div className="w-8 h-8 rounded-lg bg-[#3d1018] text-white flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-[18px]">inventory</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1c1c19]">Pelacakan Bahan Baku</h3>
                  <p className="text-[11px] text-[#524344]">Inventarisasi &amp; Restock Bahan</p>
                </div>
              </div>

              <div className="py-3">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold mb-2 ${
                  isInventoryActive
                    ? 'bg-amber-100 text-[#3d1018] border border-amber-200'
                    : 'bg-stone-100 text-[#847374]'
                }`}>
                  {isInventoryActive ? 'Status: Aktif' : 'Status: Nonaktif'}
                </span>
                <p className="text-xs text-[#524344] leading-relaxed">
                  {isInventoryActive
                    ? 'Tab "Stok Bahan Baku" aktif di Kelola Menu dan gramasi daging/bumbu terpotong otomatis setiap kali kasir menyelesaikan transaksi.'
                    : 'Mode manual murni. Tab bahan baku disembunyikan; stok dikontrol kasir lewat tombol "Habis/Tersedia" di menu.'}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-[#ebe8e3] flex items-center justify-between">
              <span className="text-xs font-bold text-[#1c1c19]">Aktifkan Modul</span>
              <button
                type="button"
                onClick={() => {
                  const next = !isInventoryActive;
                  updateStoreSettings({
                    enableInventoryTracking: next,
                    autoInventoryDeduction: next,
                  });
                  showToast(`Pelacakan Stok Bahan Baku ${next ? 'diaktifkan' : 'dinonaktifkan (mode manual)'}`);
                }}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                  isInventoryActive ? 'bg-[#3d1018]' : 'bg-[#e0dcd8]'
                }`}
                aria-pressed={isInventoryActive}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                    isInventoryActive ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= BARIS 3: BANTUAN & PANDUAN OPERASIONAL (FULL-WIDTH BOTTOM SECTION) ================= */}
      <div className="bg-white p-6 rounded-2xl border border-[#ebe8e3] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#ebe8e3]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#3d1018] text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[22px]">menu_book</span>
            </div>
            <div>
              <h2 className="font-bold text-base text-[#1c1c19]">Bantuan &amp; Panduan Operasional</h2>
              <p className="text-xs text-[#524344]">Petunjuk ringkas prosedur kerja outlet Rawon Gusti Surabaya</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            className="px-5 py-2.5 rounded-xl bg-[#3d1018] hover:bg-[#58252c] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-[18px]">help</span>
            <span>Buka Pop-up Panduan Lengkap</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="p-4 bg-[#fcf9f4] rounded-xl border border-[#ebe8e3] space-y-1.5">
            <h3 className="font-bold text-xs text-[#3d1018] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">point_of_sale</span>
              <span>1. Kasir &amp; Checkout</span>
            </h3>
            <p className="text-[11px] text-[#524344] leading-relaxed">
              Mulai shift dengan "Buka Kasir", proses pelunasan Tunai, QRIS, Kartu Debit, atau Pecah Pembayaran, serta cetak struk rekap transaksi saat tutup kasir.
            </p>
          </div>

          <div className="p-4 bg-[#fcf9f4] rounded-xl border border-[#ebe8e3] space-y-1.5">
            <h3 className="font-bold text-xs text-[#3d1018] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">soup_kitchen</span>
              <span>2. Alur Pesanan &amp; Dapur</span>
            </h3>
            <p className="text-[11px] text-[#524344] leading-relaxed">
              Pesanan dari tamu (QR Meja) atau Kasir masuk secara real-time. Dapur memantau tiket antrean dan menandai sajian yang selesai dimasak.
            </p>
          </div>

          <div className="p-4 bg-[#fcf9f4] rounded-xl border border-[#ebe8e3] space-y-1.5">
            <h3 className="font-bold text-xs text-[#3d1018] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">tune</span>
              <span>3. Operasional &amp; Meja</span>
            </h3>
            <p className="text-[11px] text-[#524344] leading-relaxed">
              Atur ketersediaan menu habis/tersedia, atur penggabungan meja beruntun, serta tutup sementara saat hari libur melalui kendali Force Close.
            </p>
          </div>
        </div>
      </div>

      {/* Pop-up Dialog Bantuan Operasional (Terpusat) */}
      <HelpModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} />
    </div>
  );
};
