import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const PengaturanView: React.FC = () => {
  const {
    storeSettings,
    updateStoreSettings,
    showToast,
  } = useApp();

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

  return (
    <div className="flex flex-col w-full pb-4 md:pb-8 max-w-[1540px] mx-auto px-4 sm:px-6 lg:px-8 pt-3 space-y-6">

      {/* ================= MODUL 1: TUTUP RESTORAN ================= */}
      <div className="bg-white p-5 rounded-2xl border border-[#ebe8e3] shadow-xs">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-sm text-[#1c1c19]">Tutup Restoran</h2>
            <p className="text-[11px] text-[#524344] mt-0.5">
              {storeSettings.forceClose
                ? 'Restoran sedang ditutup sementara (pesanan baru dinonaktifkan)'
                : 'Restoran buka normal dan menerima pesanan'}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className={`text-xs font-bold ${storeSettings.forceClose ? 'text-[#ba1a1a]' : 'text-[#1c602a]'}`}>
              {storeSettings.forceClose ? 'Tutup' : 'Buka'}
            </span>
            <button
              type="button"
              onClick={() => {
                const next = !storeSettings.forceClose;
                updateStoreSettings({ forceClose: next });
                showToast(`Status outlet: ${next ? 'Tutup Sementara' : 'Buka Normal'}`, next ? 'warning' : 'success');
              }}
              className={`w-12 h-6 shrink-0 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                storeSettings.forceClose ? 'bg-[#ba1a1a]' : 'bg-[#e0dcd8]'
              }`}
              aria-pressed={storeSettings.forceClose}
              title={storeSettings.forceClose ? 'Buka kembali outlet' : 'Tutup sementara outlet'}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                  storeSettings.forceClose ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
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
              className="w-full sm:w-auto px-6 py-2.5 bg-[#3d1018] hover:bg-[#58252c] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center"
            >
              <span>Simpan Pengaturan Finansial</span>
            </button>
          </div>
        </form>
      </div>

      {/* ================= BARIS 3: MODUL FITUR OUTLET ================= */}
      <div className="space-y-4">
        <div className="pb-2 border-b border-[#ebe8e3]">
          <h2 className="font-bold text-sm text-[#1c1c19]">
            Layanan &amp; Fitur Restoran
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* Modul: Pemesanan Mandiri Tamu */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#ebe8e3] shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-xl bg-[#3d1018] text-white flex items-center justify-center shadow-xs shrink-0">
                <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-[#1c1c19] leading-snug">
                  Pemesanan Mandiri Tamu (QR Meja)
                </h3>
                <p className="text-[11px] sm:text-xs text-[#524344] mt-0.5">
                  Akses menu dan order mandiri dari meja tamu
                </p>
              </div>
            </div>

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
              aria-label="Toggle Pemesanan Mandiri Tamu"
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                  storeSettings.selfOrderEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Modul 3: WiFi Tamu Restoran */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#ebe8e3] shadow-xs">
          <form onSubmit={handleSaveWifi} className="space-y-3 lg:space-y-0 lg:flex lg:items-center lg:justify-between lg:gap-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#3d1018] text-white flex items-center justify-center shadow-xs shrink-0">
                  <span className="material-symbols-outlined text-[20px]">wifi</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1c1c19]">WiFi Tamu Restoran</h3>
                  <p className="text-[11px] text-[#524344]">Koneksi internet untuk pelanggan di meja</p>
                </div>
              </div>

              {/* Toggle di mobile (berdampingan di sebelah kanan header) */}
              <div className="lg:hidden">
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
                  aria-pressed={enableWifiInput}
                  aria-label="Toggle WiFi Tamu"
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                      enableWifiInput ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full lg:w-auto">
              {/* Toggle di Desktop */}
              <div className="hidden lg:flex items-center">
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
                  aria-label="Toggle WiFi Tamu"
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
                  className="w-full sm:w-auto h-9 px-4 rounded-xl bg-[#3d1018] hover:bg-[#58252c] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center"
                >
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
