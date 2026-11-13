import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { HelpModal } from './Navigation';

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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Pengaturan Operasional & Modul (7 Kolom) */}
        <div className="lg:col-span-7 space-y-4">
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

            {/* Toggle Saklar Self Order */}
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

            {/* Toggle Saklar Force Close (Disatukan di Card Ini) */}
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

            {/* Form Jam Operasional */}
            <form onSubmit={handleSaveHours} className="space-y-3 pt-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#1c1c19] block mb-1">
                    Jam Buka Outlet:
                  </label>
                  <input
                    type="time"
                    value={openHourInput}
                    onChange={(e) => setOpenHourInput(e.target.value)}
                    className="w-full bg-[#fcf9f4] border border-[#ebe8e3] rounded-xl px-3 py-2 text-xs font-bold text-[#1c1c19] outline-none focus:border-[#3d1018]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#1c1c19] block mb-1">
                    Jam Tutup Outlet:
                  </label>
                  <input
                    type="time"
                    value={closeHourInput}
                    onChange={(e) => setCloseHourInput(e.target.value)}
                    className="w-full bg-[#fcf9f4] border border-[#ebe8e3] rounded-xl px-3 py-2 text-xs font-bold text-[#1c1c19] outline-none focus:border-[#3d1018]"
                  />
                </div>
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

            {/* Pilihan Area Stasiun Dapur (Dipindah dari KDS ke Pengaturan) */}
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

          {/* Card 4: Modul & Fitur Sistem (KDS Dapur & Stok Bahan Baku) */}
          <div className="bg-white p-5 rounded-2xl border border-[#ebe8e3] shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-[#ebe8e3]">
              <div className="w-8 h-8 rounded-lg bg-[#3d1018] text-white flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">tune</span>
              </div>
              <div>
                <h2 className="font-bold text-sm text-[#1c1c19]">Modul &amp; Fitur Sistem</h2>
                <p className="text-[11px] text-[#524344]">Kendali visibilitas alur tiket dapur dan pelacakan inventori</p>
              </div>
            </div>

            {/* Toggle Saklar KDS Dapur (Pantau Pesanan) */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#fcf9f4] border border-[#ebe8e3]">
              <div className="max-w-[80%]">
                <span className="font-bold text-xs text-[#1c1c19] block">
                  Pantau Pesanan (KDS Dapur)
                </span>
                <span className="text-[11px] text-[#524344] leading-relaxed block mt-0.5">
                  {isKdsActive
                    ? 'Aktif: Menu Pantau Pesanan muncul di navigasi & tiket dapur berjalan secara digital.'
                    : 'Nonaktif: Dapur menggunakan alur pesanan manual/cetak langsung (menu Pantau Pesanan disembunyikan dari sidebar).'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = !isKdsActive;
                  updateStoreSettings({ enableKitchenDisplay: next, kdsEnabled: next });
                  showToast(`Pantau Pesanan KDS ${next ? 'diaktifkan (muncul di sidebar)' : 'dinonaktifkan (disembunyikan dari sidebar)'}`, 'info');
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

            {/* Toggle Saklar Pelacakan Stok Bahan Baku Otomatis */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#fcf9f4] border border-[#ebe8e3]">
              <div className="max-w-[80%]">
                <span className="font-bold text-xs text-[#1c1c19] block">
                  Pelacakan Stok Bahan Baku Otomatis
                </span>
                <span className="text-[11px] text-[#524344] leading-relaxed block mt-0.5">
                  {isInventoryActive
                    ? 'Aktif: Bagian Kelola Bahan Makanan / Stok Bahan Baku tampil di menu Kelola Menu.'
                    : 'Nonaktif: Mode manual murni melalui saklar Tersedia / Habis di katalog menu (bagian stok bahan baku disembunyikan).'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = !isInventoryActive;
                  updateStoreSettings({ enableInventoryTracking: next, autoInventoryDeduction: next });
                  showToast(`Pelacakan bahan baku ${next ? 'diaktifkan (bagian stok tampil di Kelola Menu)' : 'dinonaktifkan (katalog manual murni)'}`, 'info');
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

        {/* Kolom Kanan: Panduan & Bantuan Operasional (5 Kolom) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-[#ebe8e3] shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-[#ebe8e3]">
              <div className="w-8 h-8 rounded-lg bg-[#3d1018] text-white flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">menu_book</span>
              </div>
              <div>
                <h2 className="font-bold text-sm text-[#1c1c19]">Bantuan &amp; Panduan Operasional</h2>
                <p className="text-[11px] text-[#524344]">Petunjuk kerja per divisi outlet Rawon Gusti</p>
              </div>
            </div>

            <div className="p-4 bg-[#fcf9f4] rounded-xl border border-[#ebe8e3] space-y-2">
              <h3 className="font-bold text-xs text-[#3d1018] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">info</span>
                <span>Pusat Bantuan Staf</span>
              </h3>
              <p className="text-xs text-[#524344] leading-relaxed">
                Panduan operasional lengkap untuk kasir, dapur, dan administrator outlet kini disajikan dalam bentuk jendela pop-up interaktif agar tidak memblokir ruang kerja.
              </p>
              <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[#3d1018] hover:bg-[#58252c] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">help</span>
                <span>Buka Pop-up Panduan Lengkap</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pop-up Dialog Bantuan Operasional (Terpusat, Pop-up Modal) */}
      <HelpModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} />
    </div>
  );
};
