import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useLockBodyScroll } from '../../lib/useLockBodyScroll';

export const ThermalReceiptModal: React.FC = () => {
  const { receiptModalData, closeReceiptModal } = useApp();

  useLockBodyScroll(Boolean(receiptModalData));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeReceiptModal();
    };
    if (receiptModalData) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [receiptModalData, closeReceiptModal]);

  if (!receiptModalData) return null;

  const bill = receiptModalData;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-modal-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in touch-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeReceiptModal();
      }}
      onTouchMove={(e) => {
        if (e.target === e.currentTarget) e.preventDefault();
      }}
    >
      <div className="bg-white rounded-2xl max-w-sm w-full max-h-[88vh] p-4 sm:p-5 shadow-2xl border border-[#ebe8e3] flex flex-col my-auto animate-in zoom-in-95 duration-150">
        {/* Header Modal Ringkas */}
        <div className="flex items-center justify-between pb-3 border-b border-[#ebe8e3] shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#3d1018] text-[20px]">receipt_long</span>
            <div>
              <h3 id="receipt-modal-title" className="font-serif font-bold text-sm sm:text-base text-[#1c1c19] leading-tight">
                Pratinjau Struk Kasir
              </h3>
              <p className="text-[10px] text-[#847374]">Format cetak printer termal 58mm/80mm</p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeReceiptModal}
            aria-label="Tutup Struk"
            className="w-7 h-7 rounded-full bg-[#f0ede9] hover:bg-[#ebe8e3] flex items-center justify-center text-[#524344] cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">close</span>
          </button>
        </div>

        {/* Thermal Paper Simulation Container (Scrollable Preview dengan boundary overscroll-contain) */}
        <div className="printable-receipt-area w-full flex-1 overflow-y-auto overscroll-contain my-3 p-3.5 sm:p-4 bg-[#faf9f6] rounded-xl border border-dashed border-stone-300 font-mono text-[11px] text-black flex flex-col">
          {/* Header Toko & Logo */}
          <div className="flex flex-col items-center text-center pb-2">
            <img
              src="/logo-rawon.png"
              alt="Logo Gusti"
              className="w-11 h-11 object-contain mx-auto mb-1 filter grayscale contrast-125"
            />
            <h4 className="font-bold text-xs tracking-widest text-black uppercase">
              RAWON GUSTI
            </h4>
            <p className="text-[10px] leading-tight text-black mt-0.5">Ruko Sentra</p>
            <p className="text-[10px] leading-tight text-black">Jl. Taman Internasional No. A5</p>
            <p className="text-[10px] leading-tight text-black">Sambikerep, Surabaya</p>
            <p className="text-[10px] leading-tight text-black">Telp: +62 812-4890-7556</p>
          </div>

          {/* Garis Putus-Putus */}
          <div className="border-b border-dashed border-black my-1.5" />

          {/* Judul Struk */}
          <div className="text-center font-bold text-[11px] tracking-wider uppercase py-0.5">
            STRUK PEMBAYARAN
          </div>

          {/* Garis Putus-Putus */}
          <div className="border-b border-dashed border-black my-1.5" />

          {/* Meta Info Transaksi */}
          <div className="flex flex-col gap-0.5 text-[10px] py-1">
            <div className="flex justify-between">
              <span>Waktu</span>
              <span>{bill.paidAtTime || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/:/g, '.')}</span>
            </div>
            <div className="flex justify-between">
              <span>No. Bill</span>
              <span className="font-mono">{bill.billNumber.startsWith('ORD-') ? bill.billNumber : `ORD-${bill.billNumber}`}</span>
            </div>
            <div className="flex justify-between">
              <span>Meja</span>
              <span>{String(bill.tableNumber).replace(/[^0-9]/g, '').padStart(2, '0') || bill.tableNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Pelanggan</span>
              <span>{bill.customerName || 'Tamu'}</span>
            </div>
          </div>

          {/* Garis Putus-Putus */}
          <div className="border-b border-dashed border-black my-1.5" />

          {/* Rincian Item (Format 2 Baris Presisi) */}
          <div className="flex flex-col gap-1.5 py-1">
            {bill.items.map((item, idx) => (
              <div key={idx} className="flex flex-col text-[10px]">
                <div className="text-left font-normal">{item.name}</div>
                <div className="flex justify-between font-mono">
                  <span>{item.quantity} x {item.price.toLocaleString('id-ID')}</span>
                  <span>{(item.price * item.quantity).toLocaleString('id-ID')}</span>
                </div>
                {item.notes && (
                  <span className="text-[9px] text-stone-700 italic">
                    *{item.notes}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Garis Putus-Putus */}
          <div className="border-b border-dashed border-black my-1.5" />

          {/* Subtotal & Pajak */}
          <div className="flex flex-col gap-0.5 text-[10px] py-1">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-mono">{bill.subtotal.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between">
              <span>Layanan 5%</span>
              <span className="font-mono">{bill.serviceFee.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between">
              <span>PB1 10%</span>
              <span className="font-mono">{bill.tax.toLocaleString('id-ID')}</span>
            </div>
          </div>

          {/* Garis Putus-Putus */}
          <div className="border-b border-dashed border-black my-1.5" />

          {/* Total & Rincian Pembayaran */}
          <div className="flex flex-col gap-0.5 text-[10px] py-1">
            <div className="flex justify-between font-bold text-[11px] pt-0.5">
              <span>TOTAL</span>
              <span className="font-mono text-xs">{bill.total.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between">
              <span>{(bill.paymentMethod || 'TUNAI').toUpperCase()}</span>
              <span className="font-bold">LUNAS</span>
            </div>
            <div className="flex justify-between">
              <span>Dibayar</span>
              <span className="font-mono">{(bill.cashTendered || bill.total).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between">
              <span>Kembalian</span>
              <span className="font-mono">{(bill.changeAmount || 0).toLocaleString('id-ID')}</span>
            </div>
          </div>

          {/* Garis Putus-Putus */}
          <div className="border-b border-dashed border-black my-1.5" />

          {/* Footer Ucapan Terima Kasih */}
          <div className="flex flex-col items-center text-center pt-2 pb-1 text-[10px] text-black">
            <p className="font-normal">Terima kasih!</p>
            <p className="font-normal">Atas kunjungan Anda</p>
          </div>
        </div>

        {/* Modal Action Buttons (Sticky Footer) */}
        <div className="flex gap-2 w-full pt-2 border-t border-[#ebe8e3] shrink-0">
          <button
            type="button"
            onClick={closeReceiptModal}
            className="flex-1 py-2.5 rounded-xl bg-[#f0ede9] hover:bg-[#ebe8e3] text-[#1c1c19] text-xs font-semibold cursor-pointer transition-colors"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-2.5 rounded-xl bg-[#3d1018] hover:bg-[#58252c] text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">print</span>
            <span>Cetak Struk</span>
          </button>
        </div>
      </div>
    </div>
  );
};
