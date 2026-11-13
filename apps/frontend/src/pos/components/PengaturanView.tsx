import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const PengaturanView: React.FC = () => {
  const {
    storeSettings,
    updateStoreSettings,
    playDingSound,
    showToast,
  } = useApp();

  const [openHourInput, setOpenHourInput] = useState(storeSettings.openHour || '08:00');
  const [closeHourInput, setCloseHourInput] = useState(storeSettings.closeHour || '22:00');

  const handleSaveHours = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreSettings({
      openHour: openHourInput,
      closeHour: closeHourInput,
    });
    showToast('Jam operasional berhasil disimpan', 'success');
  };

  return (
    <div className="flex flex-col w-full pb-24 md:pb-8 max-w-[1540px] mx-auto px-4 sm:px-6 lg:px-8 pt-3 space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#ebe8e3]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1c1c19] tracking-tight">
            Pengaturan Sistem Outlet
          </h1>
          <p className="text-xs text-[#524344] mt-0.5">
            Konfigurasi operasional, kontrol self-ordering, suara notifikasi, dan panduan kerja restoran.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Pengaturan Fitur & Operasional (7 Kolom) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Card 1: Self Ordering & Force Close */}
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
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#fcf9f4] border border-[#ebe8e3]">
              <div className="max-w-[80%]">
                <span className="font-bold text-xs text-[#1c1c19] block">
                  Pesanan Mandiri Tamu (Self-Ordering)
                </span>
                <span className="text-[11px] text-[#524344] leading-relaxed block mt-0.5">
                  {storeSettings.selfOrderEnabled
                    ? 'Aktif: Pelanggan dapat langsung memesan dari QR meja.'
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

            {/* Toggle Saklar Force Close */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#fcf9f4] border border-[#ebe8e3]">
              <div className="max-w-[80%]">
                <span className="font-bold text-xs text-[#1c1c19] block">
                  Tutup Sementara Outlet (Force Close)
                </span>
                <span className="text-[11px] text-[#524344] leading-relaxed block mt-0.5">
                  {storeSettings.forceClose
                    ? 'Outlet sedang ditutup sementara (hari libur/khusus). Tamu tidak dapat memesan.'
                    : 'Outlet buka normal sesuai jadwal harian.'}
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
                  storeSettings.forceClose ? 'bg-[#ba1a1a]' : 'bg-[#e0dcd8]'
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
          </div>

          {/* Card 2: Jam Operasional */}
          <div className="bg-white p-5 rounded-2xl border border-[#ebe8e3] shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-[#ebe8e3]">
              <div className="w-8 h-8 rounded-lg bg-[#3d1018] text-white flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">schedule</span>
              </div>
              <div>
                <h2 className="font-bold text-sm text-[#1c1c19]">Jam Buka &amp; Operasional Harian</h2>
                <p className="text-[11px] text-[#524344]">Di luar rentang jam ini self-ordering otomatis mati</p>
              </div>
            </div>

            <form onSubmit={handleSaveHours} className="space-y-3">
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
                  className="px-4 py-2 rounded-xl bg-[#3d1018] hover:bg-[#58252c] text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
                >
                  Simpan Jam Operasional
                </button>
              </div>
            </form>
          </div>

          {/* Card 3: Notifikasi Suara & KDS */}
          <div className="bg-white p-5 rounded-2xl border border-[#ebe8e3] shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-[#ebe8e3]">
              <div className="w-8 h-8 rounded-lg bg-[#3d1018] text-white flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">notifications_active</span>
              </div>
              <div>
                <h2 className="font-bold text-sm text-[#1c1c19]">Suara Notifikasi &amp; Pantau Pesanan</h2>
                <p className="text-[11px] text-[#524344]">Peringatan audio pesanan masuk dan layar dapur KDS</p>
              </div>
            </div>

            {/* Suara Ding */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#fcf9f4] border border-[#ebe8e3]">
              <div className="max-w-[75%]">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-[#1c1c19]">
                    Audio Ding Notifikasi
                  </span>
                  <button
                    type="button"
                    onClick={playDingSound}
                    className="text-[10px] text-[#994703] font-bold hover:underline cursor-pointer"
                  >
                    (Uji Coba Suara)
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
                  showToast(`Suara notifikasi ${next ? 'diaktifkan' : 'dimatikan'}`, 'info');
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

            {/* KDS (Pantau Pesanan) */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#fcf9f4] border border-[#ebe8e3]">
              <div className="max-w-[80%]">
                <span className="font-bold text-xs text-[#1c1c19] block">
                  Pantau Pesanan (KDS Dapur)
                </span>
                <span className="text-[11px] text-[#524344] leading-relaxed block mt-0.5">
                  {storeSettings.kdsEnabled
                    ? 'Aktif: Tiket dapur dimonitor interaktif lewat layar KDS.'
                    : 'Nonaktif: Dapur menggunakan alur pesanan manual/cetak langsung.'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = !storeSettings.kdsEnabled;
                  updateStoreSettings({ kdsEnabled: next });
                  showToast(`Pantau Pesanan KDS ${next ? 'diaktifkan' : 'dinonaktifkan'}`, 'info');
                }}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                  storeSettings.kdsEnabled ? 'bg-[#3d1018]' : 'bg-[#e0dcd8]'
                }`}
                aria-pressed={storeSettings.kdsEnabled}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                    storeSettings.kdsEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Mode Stok Bahan Baku Otomatis */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#fcf9f4] border border-[#ebe8e3]">
              <div className="max-w-[80%]">
                <span className="font-bold text-xs text-[#1c1c19] block">
                  Pelacakan Stok Bahan Baku Otomatis
                </span>
                <span className="text-[11px] text-[#524344] leading-relaxed block mt-0.5">
                  {storeSettings.autoInventoryDeduction
                    ? 'On: Pengurangan stok bahan baku berjalan otomatis berdasarkan porsi terjual.'
                    : 'Off: Mode manual murni melalui saklar Tersedia / Habis di katalog menu.'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = !storeSettings.autoInventoryDeduction;
                  updateStoreSettings({ autoInventoryDeduction: next });
                  showToast(`Stok bahan baku otomatis: ${next ? 'Aktif' : 'Manual'}`, 'info');
                }}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                  storeSettings.autoInventoryDeduction ? 'bg-[#3d1018]' : 'bg-[#e0dcd8]'
                }`}
                aria-pressed={storeSettings.autoInventoryDeduction}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                    storeSettings.autoInventoryDeduction ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Bantuan & Panduan Operasional Restoran (5 Kolom) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-[#ebe8e3] shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#ebe8e3]">
              <div className="w-8 h-8 rounded-lg bg-[#3d1018] text-white flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">help</span>
              </div>
              <div>
                <h2 className="font-bold text-sm text-[#1c1c19]">
                  Bantuan &amp; Panduan Operasional
                </h2>
                <p className="text-[11px] text-[#524344]">Standar operasional POS Rawon Gusti</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-[#524344] leading-relaxed">
              <div className="p-3.5 bg-[#fcf9f4] rounded-xl border border-[#ebe8e3]">
                <h3 className="font-bold text-[#3d1018] flex items-center gap-1.5 mb-1.5 text-xs">
                  <span className="material-symbols-outlined text-[16px]">point_of_sale</span>
                  <span>1. Peran Kasir POS</span>
                </h3>
                <p>
                  Kasir mengelola layanan santap di tempat pada <strong>Meja &amp; Pelanggan</strong>, pembuatan <strong>Pesanan Baru</strong>, pencatatan pembayaran (Tunai, QRIS, Kartu Debit, atau Pecah Bayar), cetak struk termal monokrom, serta modal awal dan rekonsiliasi kas pada <strong>Buka/Tutup Kasir</strong> di tab Checkout.
                </p>
              </div>

              <div className="p-3.5 bg-[#fcf9f4] rounded-xl border border-[#ebe8e3]">
                <h3 className="font-bold text-[#3d1018] flex items-center gap-1.5 mb-1.5 text-xs">
                  <span className="material-symbols-outlined text-[16px]">skillet</span>
                  <span>2. Peran Dapur &amp; Bar</span>
                </h3>
                <p>
                  Dapur dan bar memantau tiket pesanan pelanggan pada stasiun <strong>Dapur Utama (Makanan)</strong> dan <strong>Bar Minuman</strong> melalui alur penyajian <strong>Baru ➔ Dimasak ➔ Siap Diantar</strong>.
                </p>
              </div>

              <div className="p-3.5 bg-[#fcf9f4] rounded-xl border border-[#ebe8e3]">
                <h3 className="font-bold text-[#3d1018] flex items-center gap-1.5 mb-1.5 text-xs">
                  <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
                  <span>3. Peran Admin Outlet</span>
                </h3>
                <p>
                  Admin memiliki otorisasi penuh: analisis <strong>Dashboard Penjualan</strong>, katalog <strong>Kelola Menu</strong> dengan toggle cepat Habis/Tersedia, pendaftaran <strong>Kelola Meja</strong> nomor dan kode QR, pengoperasian <strong>Akun Staf</strong>, audit <strong>Laporan Transaksi</strong>, serta kendali <strong>Pengaturan Outlet</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
