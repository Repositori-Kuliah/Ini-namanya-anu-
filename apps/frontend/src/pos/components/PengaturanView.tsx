import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { HelpModal } from './Navigation';

interface TouchTimePickerProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  presets: string[];
}

const TouchTimePicker: React.FC<TouchTimePickerProps> = ({ label, value, onChange, presets }) => {
  const [hStr, mStr] = (value || '08:00').split(':');
  const h = parseInt(hStr, 10) || 0;
  const m = parseInt(mStr, 10) || 0;

  const updateTime = (newH: number, newM: number) => {
    const validH = (newH + 24) % 24;
    const validM = (newM + 60) % 60;
    const formatted = `${String(validH).padStart(2, '0')}:${String(validM).padStart(2, '0')}`;
    onChange(formatted);
  };

  return (
    <div className="bg-[#fcf9f4] p-3 rounded-xl border border-[#ebe8e3] space-y-2">
      <span className="text-xs font-bold text-[#1c1c19] block text-center sm:text-left">{label}</span>
      <div className="flex items-center justify-center gap-3 py-1">
        {/* Kontrol Jam */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={() => updateTime(h + 1, m)}
            className="w-8 h-7 rounded-lg bg-white border border-[#ebe8e3] hover:bg-[#3d1018] hover:text-white text-[#1c1c19] flex items-center justify-center font-bold text-xs cursor-pointer transition-colors shadow-2xs"
            aria-label="Tambah jam"
          >
            ▲
          </button>
          <span className="font-mono text-xl font-bold text-[#3d1018] my-1 tabular-nums">
            {String(h).padStart(2, '0')}
          </span>
          <button
            type="button"
            onClick={() => updateTime(h - 1, m)}
            className="w-8 h-7 rounded-lg bg-white border border-[#ebe8e3] hover:bg-[#3d1018] hover:text-white text-[#1c1c19] flex items-center justify-center font-bold text-xs cursor-pointer transition-colors shadow-2xs"
            aria-label="Kurang jam"
          >
            ▼
          </button>
        </div>

        <span className="text-xl font-bold text-[#3d1018] -mt-1">:</span>

        {/* Kontrol Menit */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={() => updateTime(h, m + 15 >= 60 ? 0 : m + 15)}
            className="w-8 h-7 rounded-lg bg-white border border-[#ebe8e3] hover:bg-[#3d1018] hover:text-white text-[#1c1c19] flex items-center justify-center font-bold text-xs cursor-pointer transition-colors shadow-2xs"
            aria-label="Tambah menit"
          >
            ▲
          </button>
          <span className="font-mono text-xl font-bold text-[#3d1018] my-1 tabular-nums">
            {String(m).padStart(2, '0')}
          </span>
          <button
            type="button"
            onClick={() => updateTime(h, m - 15 < 0 ? 45 : m - 15)}
            className="w-8 h-7 rounded-lg bg-white border border-[#ebe8e3] hover:bg-[#3d1018] hover:text-white text-[#1c1c19] flex items-center justify-center font-bold text-xs cursor-pointer transition-colors shadow-2xs"
            aria-label="Kurang menit"
          >
            ▼
          </button>
        </div>
      </div>

      {/* Pilihan Cepat Jam Populer */}
      <div className="flex items-center justify-center gap-1.5 flex-wrap pt-1 border-t border-[#ebe8e3]">
        {presets.map((timeStr) => (
          <button
            key={timeStr}
            type="button"
            onClick={() => onChange(timeStr)}
            className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
              value === timeStr
                ? 'bg-[#3d1018] text-white shadow-2xs'
                : 'bg-white text-[#524344] hover:bg-[#ebe8e3] border border-[#ebe8e3]'
            }`}
          >
            {timeStr}
          </button>
        ))}
      </div>
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
  const [showHelpModal, setShowHelpModal] = useState(false);

  const handleSaveHours = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreSettings({
      openHour: openHourInput,
      closeHour: closeHourInput,
    });
    showToast('Jam operasional berhasil disimpan', 'success');
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
            Konfigurasi operasional, kontrol self-ordering, modul sistem, dan suara notifikasi restoran.
          </p>
        </div>
      </div>

      {/* Grid Kartu Pengaturan Utama (Responsif 2 Kolom) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
        {/* Card 1: Self Ordering Sendiri */}
        <div className="bg-white p-5 rounded-2xl border border-[#ebe8e3] shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-[#ebe8e3]">
            <div className="w-8 h-8 rounded-lg bg-[#3d1018] text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
            </div>
            <div>
              <h2 className="font-bold text-sm text-[#1c1c19]">Sistem Pembayaran &amp; Self-Ordering Meja</h2>
              <p className="text-[11px] text-[#524344]">Kendali pesanan mandiri tamu lewat QR meja</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#fcf9f4] border border-[#ebe8e3]">
            <div className="max-w-[80%]">
              <span className="font-bold text-xs text-[#1c1c19] block">
                Pesanan Mandiri Tamu (Self-Ordering)
              </span>
              <span className="text-[11px] text-[#524344] leading-relaxed block mt-0.5">
                {storeSettings.selfOrderEnabled
                  ? 'Aktif: Pelanggan dapat langsung memesan makanan dari QR meja.'
                  : 'Nonaktif: Pelanggan diarahkan memanggil pelayan manual.'}
              </span>
            </div>
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

        {/* Card 2: Jam Operasional Disatukan dengan Force Close */}
        <div className="bg-white p-5 rounded-2xl border border-[#ebe8e3] shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-[#ebe8e3]">
            <div className="w-8 h-8 rounded-lg bg-[#3d1018] text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">schedule</span>
            </div>
            <div>
              <h2 className="font-bold text-sm text-[#1c1c19]">Jam Buka &amp; Operasional Harian</h2>
              <p className="text-[11px] text-[#524344]">Jadwal buka outlet dan kontrol tutup sementara (force close)</p>
            </div>
          </div>

          {/* Toggle Saklar Force Close */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#fcf9f4] border border-[#ebe8e3]">
            <div className="max-w-[80%]">
              <span className="font-bold text-xs text-[#1c1c19] block">
                Tutup Sementara Outlet (Force Close)
              </span>
              <span className="text-[11px] text-[#524344] leading-relaxed block mt-0.5">
                {storeSettings.forceClose
                  ? 'Outlet sedang ditutup sementara (hari libur/khusus). Tamu tidak dapat memesan.'
                  : 'Outlet buka normal sesuai jadwal jam operasional harian.'}
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

          {/* Touch-Friendly Visual Time Picker */}
          <form onSubmit={handleSaveHours} className="space-y-3 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TouchTimePicker
                label="Jam Buka Outlet"
                value={openHourInput}
                onChange={setOpenHourInput}
                presets={['07:00', '08:00', '09:00', '10:00']}
              />
              <TouchTimePicker
                label="Jam Tutup Outlet"
                value={closeHourInput}
                onChange={setCloseHourInput}
                presets={['20:00', '21:00', '22:00', '23:00']}
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-4 py-2 bg-[#3d1018] hover:bg-[#58252c] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
              >
                Simpan Jam Operasional
              </button>
            </div>
          </form>
        </div>

        {/* Card 3: Suara Notifikasi & Pilihan Area Bagian */}
        <div className="bg-white p-5 rounded-2xl border border-[#ebe8e3] shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-[#ebe8e3]">
            <div className="w-8 h-8 rounded-lg bg-[#3d1018] text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">notifications_active</span>
            </div>
            <div>
              <h2 className="font-bold text-sm text-[#1c1c19]">Suara &amp; Audio Notifikasi</h2>
              <p className="text-[11px] text-[#524344]">Peringatan suara pesanan masuk dan filter bagian dapur</p>
            </div>
          </div>

          {/* Toggle Audio Ding */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#fcf9f4] border border-[#ebe8e3]">
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
                  className="px-2 py-0.5 rounded-md bg-[#ebe8e3] hover:bg-[#d7c2c2] text-[10px] font-bold text-[#3d1018] cursor-pointer transition-colors"
                >
                  Uji Coba Suara
                </button>
              </div>
              <span className="text-[11px] text-[#524344] leading-relaxed block mt-0.5">
                Berbunyi otomatis saat ada pesanan baru atau panggilan pelayan dari meja.
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
                Pilih stasiun default untuk pemfilteran tiket dan notifikasi.
              </span>
            </div>
            <select
              value={storeSettings.soundStation || 'Semua Bagian'}
              onChange={(e) => {
                updateStoreSettings({ soundStation: e.target.value });
                showToast(`Area stasiun diatur ke: ${e.target.value}`, 'info');
              }}
              className="bg-white border border-[#ebe8e3] rounded-xl px-3 py-1.5 text-xs font-bold text-[#1c1c19] outline-none cursor-pointer focus:border-[#3d1018]"
            >
              <option value="Semua Bagian">Semua Bagian</option>
              <option value="Dapur Utama (Makanan)">Dapur Utama (Makanan)</option>
              <option value="Bar Minuman">Bar Minuman</option>
            </select>
          </div>
        </div>

        {/* Card 4: Pantau Pesanan (KDS Dapur) */}
        <div className="bg-white p-5 rounded-2xl border border-[#ebe8e3] shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-[#ebe8e3]">
            <div className="w-8 h-8 rounded-lg bg-[#3d1018] text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">soup_kitchen</span>
            </div>
            <div>
              <h2 className="font-bold text-sm text-[#1c1c19]">Pantau Pesanan (KDS Dapur)</h2>
              <p className="text-[11px] text-[#524344]">Kendali visibilitas modul Kitchen Display System di sidebar</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#fcf9f4] border border-[#ebe8e3]">
            <div className="max-w-[80%]">
              <span className="font-bold text-xs text-[#1c1c19] block">
                {isKdsActive ? 'Modul KDS Aktif' : 'Modul KDS Nonaktif'}
              </span>
              <span className="text-[11px] text-[#524344] leading-relaxed block mt-0.5">
                {isKdsActive
                  ? 'Aktif: Tab Pantau Pesanan muncul di navigasi samping untuk alur digital.'
                  : 'Nonaktif: Dapur menggunakan alur pesanan manual/cetak langsung (tab disembunyikan).'}
              </span>
            </div>
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

        {/* Card 5: Pelacakan Stok Bahan Baku Otomatis (Full Width across 2 cols) */}
        <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-[#ebe8e3] shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-[#ebe8e3]">
            <div className="w-8 h-8 rounded-lg bg-[#3d1018] text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">inventory</span>
            </div>
            <div>
              <h2 className="font-bold text-sm text-[#1c1c19]">Pelacakan Stok Bahan Baku Otomatis</h2>
              <p className="text-[11px] text-[#524344]">Pengurangan stok otomatis saat transaksi &amp; tab kelola bahan makanan</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#fcf9f4] border border-[#ebe8e3]">
            <div className="max-w-[80%]">
              <span className="font-bold text-xs text-[#1c1c19] block">
                {isInventoryActive ? 'Pelacakan Bahan Baku Aktif' : 'Pelacakan Bahan Baku Nonaktif'}
              </span>
              <span className="text-[11px] text-[#524344] leading-relaxed block mt-0.5">
                {isInventoryActive
                  ? 'Aktif: Tab "Stok Bahan Baku" tampil di Kelola Menu dan stok terpotong otomatis saat checkout.'
                  : 'Nonaktif: Mode manual murni melalui saklar Tersedia / Habis di katalog menu (tab bahan disembunyikan).'}
              </span>
            </div>
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

      {/* Bagian Bawah: Bantuan & Panduan Operasional (Full-Width Bottom Section) */}
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
