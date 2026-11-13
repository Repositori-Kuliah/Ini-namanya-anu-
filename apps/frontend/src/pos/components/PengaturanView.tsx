import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { HelpModal } from './Navigation';

interface ScrollTimePickerProps {
  label: string;
  value: string; // "HH:MM"
  onChange: (val: string) => void;
}

const ScrollTimePicker: React.FC<ScrollTimePickerProps> = ({ label, value, onChange }) => {
  const [hStr, mStr] = (value || '08:00').split(':');
  const selectedH = parseInt(hStr, 10) || 0;
  const selectedM = parseInt(mStr, 10) || 0;

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 15, 30, 45];

  const handleSelectHour = (h: number) => {
    const formatted = `${String(h).padStart(2, '0')}:${String(selectedM).padStart(2, '0')}`;
    onChange(formatted);
  };

  const handleSelectMinute = (m: number) => {
    const formatted = `${String(selectedH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    onChange(formatted);
  };

  return (
    <div className="bg-[#fcf9f4] p-3 rounded-xl border border-[#ebe8e3] flex flex-col justify-between">
      <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#ebe8e3]">
        <span className="text-xs font-bold text-[#1c1c19]">{label}</span>
        <span className="font-mono text-sm font-bold text-[#3d1018] bg-white px-2 py-0.5 rounded border border-[#ebe8e3] tabular-nums">
          {String(selectedH).padStart(2, '0')}:{String(selectedM).padStart(2, '0')}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Kolom Scroll Jam (00 - 23) */}
        <div>
          <span className="text-[10px] font-bold text-[#847374] block text-center mb-1 uppercase tracking-wider">
            Jam
          </span>
          <div className="h-32 overflow-y-auto rounded-lg border border-[#ebe8e3] bg-white p-1 space-y-1 custom-scrollbar">
            {hours.map((h) => {
              const isSelected = h === selectedH;
              return (
                <button
                  key={h}
                  type="button"
                  onClick={() => handleSelectHour(h)}
                  className={`w-full py-1 text-xs font-mono font-bold rounded-md transition-colors cursor-pointer text-center ${
                    isSelected
                      ? 'bg-[#3d1018] text-white shadow-2xs'
                      : 'text-[#1c1c19] hover:bg-[#f6f3ee]'
                  }`}
                >
                  {String(h).padStart(2, '0')}
                </button>
              );
            })}
          </div>
        </div>

        {/* Kolom Scroll Menit (00, 15, 30, 45) */}
        <div>
          <span className="text-[10px] font-bold text-[#847374] block text-center mb-1 uppercase tracking-wider">
            Menit
          </span>
          <div className="h-32 overflow-y-auto rounded-lg border border-[#ebe8e3] bg-white p-1 space-y-1 custom-scrollbar">
            {minutes.map((m) => {
              const isSelected = m === selectedM;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleSelectMinute(m)}
                  className={`w-full py-1 text-xs font-mono font-bold rounded-md transition-colors cursor-pointer text-center ${
                    isSelected
                      ? 'bg-[#3d1018] text-white shadow-2xs'
                      : 'text-[#1c1c19] hover:bg-[#f6f3ee]'
                  }`}
                >
                  {String(m).padStart(2, '0')}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export const PengaturanView: React.FC = () => {
  const {
    storeSettings,
    updateStoreSettings,
    cashierShift,
    playDingSound,
    showToast,
  } = useApp();

  const [openHourInput, setOpenHourInput] = useState(storeSettings.openHour || '08:00');
  const [closeHourInput, setCloseHourInput] = useState(storeSettings.closeHour || '22:00');
  const [defaultCashInput, setDefaultCashInput] = useState(storeSettings.defaultInitialCash ?? 200000);
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
  const isDrawerActive = storeSettings.enableCashDrawer ?? true;

  return (
    <div className="flex flex-col w-full pb-24 md:pb-8 max-w-[1540px] mx-auto px-4 sm:px-6 lg:px-8 pt-3 space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#ebe8e3]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1c1c19] tracking-tight">
            Pengaturan Sistem Outlet
          </h1>
          <p className="text-xs text-[#524344] mt-0.5">
            Konfigurasi jam kerja, status laci kas, modul fitur restoran, dan suara notifikasi Rawon Gusti.
          </p>
        </div>
      </div>

      {/* ================= BARIS 1: OPERASIONAL UTAMA OUTLET (2 KOLOM SEJAJAR BERIMBANG) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        {/* Kartu 1: Jam Buka & Operasional Harian (Scroll Jam) */}
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

            {/* Scroll Jam Buka & Jam Tutup */}
            <form onSubmit={handleSaveHours} className="space-y-3 pt-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ScrollTimePicker
                  label="Jam Buka Outlet"
                  value={openHourInput}
                  onChange={setOpenHourInput}
                />
                <ScrollTimePicker
                  label="Jam Tutup Outlet"
                  value={closeHourInput}
                  onChange={setCloseHourInput}
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
        </div>

        {/* Kartu 2: Manajemen Laci Kasir & Shift Kerja (Point of Sale / f_sale) */}
        <div className="bg-white p-5 rounded-2xl border border-[#ebe8e3] shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 pb-2 border-b border-[#ebe8e3]">
              <div className="w-8 h-8 rounded-lg bg-[#3d1018] text-white flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-[18px]">point_of_sale</span>
              </div>
              <div>
                <h2 className="font-bold text-sm text-[#1c1c19]">Manajemen Laci Kasir &amp; Shift</h2>
                <p className="text-[11px] text-[#524344]">Kendali status saldo kas, tutup kasir, dan modal laci</p>
              </div>
            </div>

            {/* Saklar Fitur Laci Kas */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#fcf9f4] border border-[#ebe8e3]">
              <div className="max-w-[78%]">
                <span className="font-bold text-xs text-[#1c1c19] block">
                  Fitur Status Laci Kasir &amp; Tutup Kasir
                </span>
                <span className="text-[11px] text-[#524344] leading-relaxed block mt-0.5">
                  {isDrawerActive
                    ? 'Aktif: Menampilkan bar modal laci kas & tombol Tutup Kasir di bilah Checkout.'
                    : 'Nonaktif: Mode checkout cepat tanpa pelacakan uang fisik laci kasir.'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = !isDrawerActive;
                  updateStoreSettings({ enableCashDrawer: next });
                  showToast(`Fitur laci kasir ${next ? 'diaktifkan' : 'dinonaktifkan'}`);
                }}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                  isDrawerActive ? 'bg-[#3d1018]' : 'bg-[#e0dcd8]'
                }`}
                aria-pressed={isDrawerActive}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                    isDrawerActive ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Pengaturan Modal Awal Kasir Default */}
            <div className="p-3 bg-[#fcf9f4] rounded-xl border border-[#ebe8e3] space-y-2">
              <label className="text-xs font-bold text-[#1c1c19] block">
                Modal Awal Kasir Standar (Rp):
              </label>
              <div className="flex items-center gap-2 bg-white border border-[#ebe8e3] rounded-xl px-3 py-2">
                <span className="text-xs font-bold text-[#524344]">Rp</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={defaultCashInput}
                  onChange={(e) => {
                    const val = parseInt(e.target.value.replace(/\D/g, ''), 10) || 0;
                    setDefaultCashInput(val);
                  }}
                  className="w-full text-xs font-bold text-[#3d1018] outline-none tabular-nums"
                  placeholder="200000"
                />
                <button
                  type="button"
                  onClick={() => {
                    updateStoreSettings({ defaultInitialCash: defaultCashInput });
                    showToast(`Modal awal standar diatur ke Rp ${defaultCashInput.toLocaleString('id-ID')}`, 'success');
                  }}
                  className="px-3 py-1 bg-[#3d1018] hover:bg-[#58252c] text-white text-[11px] font-bold rounded-lg cursor-pointer transition-colors shrink-0"
                >
                  Terapkan
                </button>
              </div>
              <p className="text-[11px] text-[#524344]">
                Uang receh/kembalian awal yang otomatis terisi saat outlet buka di jam operasional.
              </p>
            </div>

            {/* Pratinjau Kapsul Status Laci Kasir */}
            <div className="p-3 bg-stone-50 rounded-xl border border-[#ebe8e3] space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#847374] block">
                Pratinjau Status di Halaman Checkout:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 bg-[#3d1018] text-white px-3 py-1.5 rounded-xl border border-[#58252c] text-xs shadow-xs">
                  <span className="material-symbols-outlined text-[16px] text-[#fc934f]">point_of_sale</span>
                  <div className="flex items-center gap-2.5">
                    <div>
                      <span className="text-[10px] text-[#ffdadc]/70 block leading-none">Modal</span>
                      <span className="font-bold text-white text-xs tabular-nums">
                        Rp {(cashierShift.modalAwal || defaultCashInput).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="h-4 w-px bg-white/20"></div>
                    <div>
                      <span className="text-[10px] text-[#ffdadc]/70 block leading-none">Masuk</span>
                      <span className="font-bold text-[#fc934f] text-xs tabular-nums">+0</span>
                    </div>
                    <div className="h-4 w-px bg-white/20"></div>
                    <div>
                      <span className="text-[10px] text-[#ffdadc]/70 block leading-none">Total Laci</span>
                      <span className="font-bold text-white text-xs tabular-nums">
                        Rp {(cashierShift.totalLaci || defaultCashInput).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#994703] text-white text-xs font-bold shadow-xs">
                  <span className="material-symbols-outlined text-[16px]">lock_clock</span>
                  <span>Tutup Kasir</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= BARIS 2: MODUL FITUR RESTORAN & AUDIO (4 KOLOM SEJAJAR 100% SEJEJER) ================= */}
      <div>
        <div className="pb-2 mb-3 border-b border-[#ebe8e3]">
          <h2 className="font-bold text-sm text-[#1c1c19] flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-[#994703]">toggle_on</span>
            <span>Kendali Saklar Modul Fitur Restoran</span>
          </h2>
          <p className="text-[11px] text-[#524344]">Aktifkan atau nonaktifkan fitur sesuai alur operasional cabang</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
          {/* Modul 1: Self-Ordering Meja */}
          <div className="bg-white p-4 rounded-2xl border border-[#ebe8e3] shadow-xs flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 pb-2 border-b border-[#ebe8e3]">
                <div className="w-7 h-7 rounded-lg bg-[#3d1018] text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
                </div>
                <div>
                  <h3 className="font-bold text-xs text-[#1c1c19]">Pemesanan Mandiri</h3>
                  <p className="text-[10px] text-[#524344]">Self-Ordering QR</p>
                </div>
              </div>

              <div className="py-2">
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mb-1.5 ${
                  storeSettings.selfOrderEnabled
                    ? 'bg-amber-100 text-[#3d1018] border border-amber-200'
                    : 'bg-stone-100 text-[#847374]'
                }`}>
                  {storeSettings.selfOrderEnabled ? 'Status: Aktif' : 'Status: Nonaktif'}
                </span>
                <p className="text-[11px] text-[#524344] leading-relaxed">
                  {storeSettings.selfOrderEnabled
                    ? 'Pelanggan dapat memindai QR di meja untuk memesan dan membayar mandiri.'
                    : 'Pemesanan digital ditutup; tamu diarahkan memanggil pelayan manual.'}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-[#ebe8e3] flex items-center justify-between">
              <span className="text-xs font-bold text-[#1c1c19]">Saklar Modul</span>
              <button
                type="button"
                onClick={() => {
                  const next = !storeSettings.selfOrderEnabled;
                  updateStoreSettings({ selfOrderEnabled: next });
                  showToast(`Self ordering ${next ? 'diaktifkan' : 'dinonaktifkan (mode panggil pelayan)'}`, 'info');
                }}
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                  storeSettings.selfOrderEnabled ? 'bg-[#3d1018]' : 'bg-[#e0dcd8]'
                }`}
                aria-pressed={storeSettings.selfOrderEnabled}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                    storeSettings.selfOrderEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Modul 2: Pantau Pesanan (KDS Dapur) */}
          <div className="bg-white p-4 rounded-2xl border border-[#ebe8e3] shadow-xs flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 pb-2 border-b border-[#ebe8e3]">
                <div className="w-7 h-7 rounded-lg bg-[#3d1018] text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px]">soup_kitchen</span>
                </div>
                <div>
                  <h3 className="font-bold text-xs text-[#1c1c19]">Pantau Pesanan</h3>
                  <p className="text-[10px] text-[#524344]">KDS Layar Dapur</p>
                </div>
              </div>

              <div className="py-2">
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mb-1.5 ${
                  isKdsActive
                    ? 'bg-amber-100 text-[#3d1018] border border-amber-200'
                    : 'bg-stone-100 text-[#847374]'
                }`}>
                  {isKdsActive ? 'Status: Aktif' : 'Status: Nonaktif'}
                </span>
                <p className="text-[11px] text-[#524344] leading-relaxed">
                  {isKdsActive
                    ? 'Tab Pantau Pesanan tampil di sidebar kasir/dapur untuk antrean memasak.'
                    : 'Tab disembunyikan jika dapur mengandalkan pesanan manual/cetak langsung.'}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-[#ebe8e3] flex items-center justify-between">
              <span className="text-xs font-bold text-[#1c1c19]">Saklar Modul</span>
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
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                  isKdsActive ? 'bg-[#3d1018]' : 'bg-[#e0dcd8]'
                }`}
                aria-pressed={isKdsActive}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                    isKdsActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Modul 3: Pelacakan Stok Bahan Baku Otomatis */}
          <div className="bg-white p-4 rounded-2xl border border-[#ebe8e3] shadow-xs flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 pb-2 border-b border-[#ebe8e3]">
                <div className="w-7 h-7 rounded-lg bg-[#3d1018] text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px]">inventory</span>
                </div>
                <div>
                  <h3 className="font-bold text-xs text-[#1c1c19]">Pelacakan Bahan Baku</h3>
                  <p className="text-[10px] text-[#524344]">Inventarisasi Otomatis</p>
                </div>
              </div>

              <div className="py-2">
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mb-1.5 ${
                  isInventoryActive
                    ? 'bg-amber-100 text-[#3d1018] border border-amber-200'
                    : 'bg-stone-100 text-[#847374]'
                }`}>
                  {isInventoryActive ? 'Status: Aktif' : 'Status: Nonaktif'}
                </span>
                <p className="text-[11px] text-[#524344] leading-relaxed">
                  {isInventoryActive
                    ? 'Tab stok bahan tampil di menu & bahan terpotong otomatis saat transaksi.'
                    : 'Mode manual murni via saklar Habis/Tersedia pada kartu hidangan menu.'}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-[#ebe8e3] flex items-center justify-between">
              <span className="text-xs font-bold text-[#1c1c19]">Saklar Modul</span>
              <button
                type="button"
                onClick={() => {
                  const next = !isInventoryActive;
                  updateStoreSettings({
                    enableInventoryTracking: next,
                    autoInventoryDeduction: next,
                  });
                  showToast(`Pelacakan Bahan Baku ${next ? 'diaktifkan' : 'dinonaktifkan'}`);
                }}
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                  isInventoryActive ? 'bg-[#3d1018]' : 'bg-[#e0dcd8]'
                }`}
                aria-pressed={isInventoryActive}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                    isInventoryActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Modul 4: Suara & Audio Notifikasi */}
          <div className="bg-white p-4 rounded-2xl border border-[#ebe8e3] shadow-xs flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 pb-2 border-b border-[#ebe8e3]">
                <div className="w-7 h-7 rounded-lg bg-[#3d1018] text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px]">notifications_active</span>
                </div>
                <div>
                  <h3 className="font-bold text-xs text-[#1c1c19]">Suara Notifikasi</h3>
                  <p className="text-[10px] text-[#524344]">Audio Chime Pesanan</p>
                </div>
              </div>

              <div className="py-2 space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    storeSettings.soundEnabled
                      ? 'bg-amber-100 text-[#3d1018] border border-amber-200'
                      : 'bg-stone-100 text-[#847374]'
                  }`}>
                    {storeSettings.soundEnabled ? 'Status: Aktif' : 'Status: Nonaktif'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      playDingSound();
                      showToast('Uji coba suara chime berhasil', 'info');
                    }}
                    className="px-2 py-0.5 rounded bg-white border border-[#ebe8e3] text-[10px] font-bold text-[#3d1018] hover:bg-[#ebe8e3] cursor-pointer shadow-2xs"
                  >
                    Uji Suara
                  </button>
                </div>
                <select
                  value={storeSettings.soundStation || 'Semua Bagian'}
                  onChange={(e) => {
                    updateStoreSettings({ soundStation: e.target.value });
                    showToast(`Area stasiun: ${e.target.value}`, 'info');
                  }}
                  className="w-full bg-white border border-[#ebe8e3] rounded-lg px-2 py-1 text-[11px] font-bold text-[#1c1c19] outline-none cursor-pointer"
                >
                  <option value="Semua Bagian">Semua Bagian</option>
                  <option value="Dapur Utama (Makanan)">Dapur Utama</option>
                  <option value="Bar Minuman">Bar Minuman</option>
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-[#ebe8e3] flex items-center justify-between">
              <span className="text-xs font-bold text-[#1c1c19]">Saklar Modul</span>
              <button
                type="button"
                onClick={() => {
                  const next = !storeSettings.soundEnabled;
                  updateStoreSettings({ soundEnabled: next });
                  showToast(`Suara notifikasi ${next ? 'diaktifkan' : 'dimatikan'}`);
                }}
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                  storeSettings.soundEnabled ? 'bg-[#3d1018]' : 'bg-[#e0dcd8]'
                }`}
                aria-pressed={storeSettings.soundEnabled}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                    storeSettings.soundEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= BARIS 3: BANTUAN & PANDUAN OPERASIONAL (FULL-WIDTH) ================= */}
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
              Otomatis buka di jam operasional. Proses pembayaran Tunai, QRIS, Kartu Debit, atau Pecah Pembayaran, serta cetak struk rekap transaksi saat tutup kasir.
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

      {/* Pop-up Dialog Bantuan Operasional */}
      <HelpModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} />
    </div>
  );
};
