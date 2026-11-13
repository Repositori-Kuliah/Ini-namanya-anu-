import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useApp } from '../context/AppContext';

export const QrCodeModal: React.FC = () => {
  const { qrModalTable, closeQrModal } = useApp();
  const [qrSrc, setQrSrc] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeQrModal();
    };
    if (qrModalTable) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [qrModalTable, closeQrModal]);

  useEffect(() => {
    if (qrModalTable) QRCode.toDataURL(qrModalTable.qrUrl, { margin: 1, width: 320, color: { dark: '#3d1018', light: '#0000' } }).then(setQrSrc);
    else setQrSrc('');
  }, [qrModalTable]);

  if (!qrModalTable) return null;

  const table = qrModalTable;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
    >
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative flex flex-col items-center">
        <button
          type="button"
          onClick={closeQrModal}
          aria-label="Tutup Dialog QR"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#f0ede9] hover:bg-[#ebe8e3] flex items-center justify-center text-[#524344] focus-visible:ring-2 focus-visible:ring-[#3d1018] focus-visible:outline-none cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">close</span>
        </button>

        {/* Printable Stand Card Preview */}
        <div className="w-full bg-[#fffdfa] border-2 border-[#3d1018] rounded-2xl p-6 flex flex-col items-center text-center shadow-md my-2">
          <div className="w-12 h-12 rounded-xl bg-[#3d1018] flex items-center justify-center p-1 mb-2 shadow-xs">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC4jDTg2zGsW66D3mPi0LCCgkEKAz6A3C_LyMjRjF33cCX-hxn-FMKJ-VmnANEDzHK36CnYdj065-0rxRIyAzaBK6gX8QPIzL_SZbagw1SD7hPd2ZxzJIZ6yhPlB0wT0wYg5V1QYZIndg6LMBj-RspFW4GjCZKuvGWpMCQZZXFIpvETPHdcZZBqLKJziB4JXaXmcwodTl3uHGVnuzTEmOl9Fam2CBCupu5HozhgUINKbYrxNyF4ccQ9FOYEpUIXWooGFlE"
              alt="Logo"
              className="w-full h-full object-cover rounded-lg"
            />
          </div>

          <h3 id="qr-modal-title" className="font-serif text-xl font-bold text-[#3d1018] tracking-tight">
            Rawon Gusti
          </h3>
          <p className="text-xs text-[#847374] font-serif italic mb-4">
            Rasa asli, sepenuh hati.
          </p>

          <div className="w-48 h-48 bg-[#f6f3ee] border border-[#d7c2c2] rounded-2xl p-4 flex items-center justify-center shadow-inner">
            {qrSrc && <img src={qrSrc} alt={`Kode QR Meja ${table.number}`} className="w-full h-full" />}
          </div>

          <div className="mt-4">
            <span className="text-xs uppercase font-extrabold tracking-widest text-[#994703]">
              Pindai &amp; Pesan Mandiri
            </span>
            <h4 className="font-serif text-3xl font-extrabold text-[#1c1c19] mt-0.5">
              MEJA {table.number}
            </h4>
            <p className="text-[11px] text-[#847374] mt-2 max-w-xs leading-relaxed">
              Buka kamera ponsel Anda, arahkan ke QR untuk melihat katalog menu, memilih varian, dan memesan langsung dari meja.
            </p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex gap-2 w-full mt-3">
          <button
            type="button"
            onClick={closeQrModal}
            className="flex-1 py-2.5 rounded-xl bg-[#f0ede9] hover:bg-[#ebe8e3] text-[#1c1c19] text-xs font-semibold focus-visible:ring-2 focus-visible:ring-[#3d1018] focus-visible:outline-none cursor-pointer"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-2.5 rounded-xl bg-[#3d1018] hover:bg-[#58252c] text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#3d1018] focus-visible:outline-none cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">print</span>
            <span>Cetak Stand Meja</span>
          </button>
        </div>
      </div>
    </div>
  );
};
