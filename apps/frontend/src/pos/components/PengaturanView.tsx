import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

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
}

const RollerTimePicker: React.FC<RollerTimePickerProps> = ({ label, value, onChange }) => {
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
          step={1}
          onChange={handleMinuteChange}
        />
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
  // --- State Finansial & Pajak Modular ---
  const [enableTaxInput, setEnableTaxInput] = useState(storeSettings.enableTax ?? true);
  const [taxNameInput, setTaxNameInput] = useState(storeSettings.taxName || 'PB1');
  const [taxRateInput, setTaxRateInput] = useState(storeSettings.taxRate ?? 10);

  const [enableServiceInput, setEnableServiceInput] = useState(storeSettings.enableServiceCharge ?? true);
  const [serviceNameInput, setServiceNameInput] = useState(storeSettings.serviceChargeName || 'Biaya Layanan');
  const [serviceRateInput, setServiceRateInput] = useState(storeSettings.serviceChargeRate ?? 5);

  // Pengaturan WiFi Tamu Restoran
  const [enableWifiInput, setEnableWifiInput] = useState(storeSettings.enableGuestWifi ?? true);
  const [wifiSsidInput, setWifiSsidInput] = useState(storeSettings.wifiSsid || 'RawonGusti_VIP');
  const [wifiPasswordInput, setWifiPasswordInput] = useState(storeSettings.wifiPassword || 'rawonenak08');

  const handleSaveHours = (e: React.FormEvent) => {
    e.preventDefault();
    let finalClose = closeHourInput;

    // Jika jam buka sama dengan jam tutup, otomatis berikan rentang 2 jam langsung tanpa peringatan
    if (openHourInput === closeHourInput) {
      const [oH, oM] = openHourInput.split(':').map((v) => parseInt(v, 10) || 0);
      const newCloseH = (oH + 2) % 24;
      finalClose = `${String(newCloseH).padStart(2, '0')}:${String(oM).padStart(2, '0')}`;
      setCloseHourInput(finalClose);
    }

    updateStoreSettings({
      openHour: openHourInput,
      closeHour: finalClose,
    });
    showToast(`Jam operasional disimpan: ${openHourInput} – ${finalClose}`, 'success');
  };

  const handleSaveFinancials = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreSettings({
      enableTax: enableTaxInput,
      taxName: taxNameInput,
      taxRate: taxRateInput,
      enableServiceCharge: enableServiceInput,
      serviceChargeName: serviceNameInput,
      serviceChargeRate: serviceRateInput,
    });
    showToast('Pengaturan Pajak & Biaya Layanan berhasil disimpan', 'success');
  };

  const handleSaveWifi = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreSettings({
      enableGuestWifi: enableWifiInput,
      wifiSsid: wifiSsidInput.trim() || 'RawonGusti_VIP',
      wifiPassword: wifiPasswordInput.trim() || 'rawonenak08',
    });
    showToast('Pengaturan WiFi Tamu Restoran berhasil disimpan', 'success');
  };

  const isKdsActive = storeSettings.enableKitchenDisplay ?? storeSettings.kdsEnabled ?? true;

  return (
    <div className="flex flex-col w-full pb-4 md:pb-8 max-w-[1540px] mx-auto px-4 sm:px-6 lg:px-8 pt-3 space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#ebe8e3]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1c1c19] tracking-tight">
            Pengaturan Sistem Outlet
          </h1>
        </div>
      </div>

      {/* ================= BARIS 1: OPERASIONAL UTAMA OUTLET ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* Kartu Kiri: Jam Buka & Operasional Harian */}
        <div className="bg-white p-5 rounded-2xl border border-[#ebe8e3] shadow-xs flex flex-col space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-[#ebe8e3]">
            <div className="w-8 h-8 rounded-lg bg-[#3d1018] text-white flex items-center justify-center shadow-xs shrink-0">
              <span className="material-symbols-outlined text-[18px]">schedule</span>
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-sm text-[#1c1c19]">Jam Buka &amp; Operasional Harian</h2>
              <p className="text-[11px] text-[#524344]">Jadwal aktif pemesanan outlet &amp; status hari libur</p>
            </div>
          </div>

          {/* Saklar Force Close */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#fcf9f4] border border-[#ebe8e3]">
            <div className="min-w-0 pr-1">
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
              className={`w-12 h-6 shrink-0 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
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

          {/* Roller Time Picker Jam Buka & Jam Tutup */}
          <form onSubmit={handleSaveHours} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <RollerTimePicker
                label="Jam Buka Outlet"
                value={openHourInput}
                onChange={setOpenHourInput}
              />
              <RollerTimePicker
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

        {/* Kartu Kanan: Suara & Audio Notifikasi */}
        <div className="bg-white p-5 rounded-2xl border border-[#ebe8e3] shadow-xs flex flex-col space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-[#ebe8e3]">
            <div className="w-8 h-8 rounded-lg bg-[#3d1018] text-white flex items-center justify-center shadow-xs shrink-0">
              <span className="material-symbols-outlined text-[18px]">notifications_active</span>
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-sm text-[#1c1c19]">Suara &amp; Audio Notifikasi</h2>
              <p className="text-[11px] text-[#524344]">Pengingat nada suara lonceng pesanan baru &amp; rute stasiun</p>
            </div>
          </div>

          {/* Toggle Saklar Audio Ding */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#fcf9f4] border border-[#ebe8e3]">
            <div className="min-w-0 pr-1">
              <div className="flex items-center gap-2 flex-wrap">
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
              className={`w-12 h-6 shrink-0 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
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
            <div className="min-w-0">
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
              className="bg-white border border-[#ebe8e3] rounded-xl px-3 py-2 text-xs font-bold text-[#1c1c19] outline-none cursor-pointer focus:border-[#3d1018] shrink-0"
            >
              <option value="Semua Bagian">Semua Bagian</option>
              <option value="Dapur Utama (Makanan)">Dapur Utama (Makanan)</option>
              <option value="Bar Minuman">Bar Minuman</option>
            </select>
          </div>
        </div>
      </div>

      {/* ================= BARIS 2: PAJAK & BIAYA LAYANAN ================= */}
      <div className="bg-white p-5 rounded-2xl border border-[#ebe8e3] shadow-xs space-y-4">
        {/* Header Modul Finansial */}
        <div className="flex items-center gap-2.5 pb-3 border-b border-[#ebe8e3]">
          <div className="w-8 h-8 rounded-lg bg-[#3d1018] text-white flex items-center justify-center shadow-xs shrink-0">
            <span className="material-symbols-outlined text-[18px]">receipt_long</span>
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-sm text-[#1c1c19]">Pajak &amp; Biaya Layanan</h2>
            <p className="text-[11px] text-[#524344]">
              Atur persentase PB1/PPN dan biaya layanan restoran.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveFinancials} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
            {/* Kartu Pajak Restoran (PB1 / PPN) */}
            <div className="p-4 rounded-xl bg-[#fcf9f4] border border-[#ebe8e3] flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 pr-1">
                  <span className="font-bold text-xs text-[#1c1c19] block truncate">
                    Pajak Restoran (PB1 / PPN)
                  </span>
                  <span className="text-[11px] text-[#524344] block">
                    Dikenakan pada kasir &amp; pesanan QR meja.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setEnableTaxInput(!enableTaxInput)}
                  className={`w-12 h-6 shrink-0 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                    enableTaxInput ? 'bg-[#3d1018]' : 'bg-[#e0dcd8]'
                  }`}
                  aria-pressed={enableTaxInput}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                      enableTaxInput ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Input Label & Tarif */}
              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2.5 transition-opacity ${!enableTaxInput ? 'opacity-40 pointer-events-none' : ''}`}>
                <div>
                  <label htmlFor="tax-label-input" className="text-[10px] font-bold text-[#847374] uppercase block mb-1">
                    Label Nama Pajak
                  </label>
                  <input
                    id="tax-label-input"
                    type="text"
                    disabled={!enableTaxInput}
                    value={taxNameInput}
                    onChange={(e) => setTaxNameInput(e.target.value)}
                    placeholder="Contoh: PB1"
                    className="w-full px-3 py-1.5 bg-white border border-[#ebe8e3] rounded-lg text-xs font-semibold text-[#1c1c19] outline-none focus:border-[#3d1018]"
                  />
                </div>
                <div>
                  <label htmlFor="tax-rate-input" className="text-[10px] font-bold text-[#847374] uppercase block mb-1">
                    Tarif Pajak (%)
                  </label>
                  <input
                    id="tax-rate-input"
                    type="number"
                    min="0"
                    max="100"
                    disabled={!enableTaxInput}
                    value={taxRateInput}
                    onChange={(e) => setTaxRateInput(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                    className="w-full px-3 py-1.5 bg-white border border-[#ebe8e3] rounded-lg text-xs font-bold text-[#1c1c19] outline-none focus:border-[#3d1018]"
                  />
                </div>
              </div>
            </div>

            {/* Kartu Biaya Layanan (Service Charge) */}
            <div className="p-4 rounded-xl bg-[#fcf9f4] border border-[#ebe8e3] flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 pr-1">
                  <span className="font-bold text-xs text-[#1c1c19] block truncate">
                    Biaya Layanan (Service Charge)
                  </span>
                  <span className="text-[11px] text-[#524344] block">
                    Biaya operasional &amp; kebersihan resto.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setEnableServiceInput(!enableServiceInput)}
                  className={`w-12 h-6 shrink-0 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                    enableServiceInput ? 'bg-[#3d1018]' : 'bg-[#e0dcd8]'
                  }`}
                  aria-pressed={enableServiceInput}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                      enableServiceInput ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Input Label & Tarif Layanan */}
              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2.5 transition-opacity ${!enableServiceInput ? 'opacity-40 pointer-events-none' : ''}`}>
                <div>
                  <label htmlFor="service-label-input" className="text-[10px] font-bold text-[#847374] uppercase block mb-1">
                    Label Biaya Layanan
                  </label>
                  <input
                    id="service-label-input"
                    type="text"
                    disabled={!enableServiceInput}
                    value={serviceNameInput}
                    onChange={(e) => setServiceNameInput(e.target.value)}
                    placeholder="Contoh: Biaya Layanan"
                    className="w-full px-3 py-1.5 bg-white border border-[#ebe8e3] rounded-lg text-xs font-semibold text-[#1c1c19] outline-none focus:border-[#3d1018]"
                  />
                </div>
                <div>
                  <label htmlFor="service-rate-input" className="text-[10px] font-bold text-[#847374] uppercase block mb-1">
                    Tarif Layanan (%)
                  </label>
                  <input
                    id="service-rate-input"
                    type="number"
                    min="0"
                    max="100"
                    disabled={!enableServiceInput}
                    value={serviceRateInput}
                    onChange={(e) => setServiceRateInput(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                    className="w-full px-3 py-1.5 bg-white border border-[#ebe8e3] rounded-lg text-xs font-bold text-[#1c1c19] outline-none focus:border-[#3d1018]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tombol Simpan Finansial */}
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 bg-[#3d1018] hover:bg-[#58252c] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              <span>Simpan Pengaturan Finansial</span>
            </button>
          </div>
        </form>
      </div>

      {/* ================= BARIS 3: MODUL FITUR OUTLET ================= */}
      <div className="space-y-4">
        <div className="pb-2 border-b border-[#ebe8e3]">
          <h2 className="font-bold text-sm text-[#1c1c19] flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-[#994703]">toggle_on</span>
            <span>Kendali Saklar Modul Fitur Restoran</span>
          </h2>
          <p className="text-[11px] text-[#524344]">Hidupkan atau matikan modul sistem sesuai alur operasional cabang</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
          {/* Modul 1: Self-Ordering Meja */}
          <div className="bg-white p-5 rounded-2xl border border-[#ebe8e3] shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2.5 pb-2 border-b border-[#ebe8e3]">
                <div className="w-8 h-8 rounded-lg bg-[#3d1018] text-white flex items-center justify-center shadow-xs shrink-0">
                  <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
                </div>
                <div className="min-w-0">
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
                className={`w-12 h-6 shrink-0 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
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
                <div className="w-8 h-8 rounded-lg bg-[#3d1018] text-white flex items-center justify-center shadow-xs shrink-0">
                  <span className="material-symbols-outlined text-[18px]">soup_kitchen</span>
                </div>
                <div className="min-w-0">
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
                className={`w-12 h-6 shrink-0 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
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
        </div>

        {/* Modul 3: WiFi Tamu Restoran */}
        <div className="bg-white p-5 rounded-2xl border border-[#ebe8e3] shadow-xs">
          <form onSubmit={handleSaveWifi} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#3d1018] text-white flex items-center justify-center shadow-xs shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[20px]">wifi</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-[#1c1c19]">WiFi Tamu Restoran (QR &amp; Meja)</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    enableWifiInput ? 'bg-amber-100 text-[#3d1018] border border-amber-200' : 'bg-stone-100 text-[#847374]'
                  }`}>
                    {enableWifiInput ? 'Modul Aktif' : 'Modul Nonaktif'}
                  </span>
                </div>
                <p className="text-xs text-[#524344] mt-0.5 max-w-xl">
                  Koneksi WiFi untuk pelanggan yang bersantap. Ditampilkan pada halaman status pemesanan mandiri tamu meja jika modul aktif.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full lg:w-auto">
              {/* Toggle Saklar Modular */}
              <div className="flex items-center gap-2 justify-between sm:justify-start">
                <span className="text-xs font-bold text-[#1c1c19] sm:hidden">Aktifkan WiFi Tamu</span>
                <button
                  type="button"
                  onClick={() => {
                    const next = !enableWifiInput;
                    setEnableWifiInput(next);
                    updateStoreSettings({ enableGuestWifi: next });
                    showToast(`WiFi tamu restoran ${next ? 'diaktifkan' : 'dinonaktifkan (disembunyikan dari pelanggan)'}`, 'info');
                  }}
                  className={`w-12 h-6 shrink-0 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                    enableWifiInput ? 'bg-[#3d1018]' : 'bg-[#e0dcd8]'
                  }`}
                  title={enableWifiInput ? 'Klik untuk menonaktifkan WiFi tamu' : 'Klik untuk mengaktifkan WiFi tamu'}
                  aria-pressed={enableWifiInput}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                      enableWifiInput ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className={`flex flex-col sm:flex-row items-center gap-2 transition-opacity ${!enableWifiInput ? 'opacity-40 pointer-events-none' : ''}`}>
                <div className="w-full sm:w-44">
                  <input
                    type="text"
                    disabled={!enableWifiInput}
                    value={wifiSsidInput}
                    onChange={(e) => setWifiSsidInput(e.target.value)}
                    placeholder="Nama / SSID WiFi"
                    className="w-full h-9 px-3 text-xs font-medium rounded-lg border border-[#ebe8e3] bg-white focus:outline-none focus:border-[#3d1018]"
                  />
                </div>
                <div className="w-full sm:w-40">
                  <input
                    type="text"
                    disabled={!enableWifiInput}
                    value={wifiPasswordInput}
                    onChange={(e) => setWifiPasswordInput(e.target.value)}
                    placeholder="Kata Sandi WiFi"
                    className="w-full h-9 px-3 text-xs font-mono font-medium rounded-lg border border-[#ebe8e3] bg-white focus:outline-none focus:border-[#3d1018]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!enableWifiInput}
                  className="w-full sm:w-auto h-9 px-4 rounded-xl bg-[#3d1018] hover:bg-[#58252c] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[15px]">save</span>
                  <span>Simpan WiFi</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
