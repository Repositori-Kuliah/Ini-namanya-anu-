import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';

export const ThermalReceiptModal: React.FC = () => {
  const { receiptModalData, closeReceiptModal, currentUser } = useApp();

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
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in"
    >
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative my-8 flex flex-col items-center">
        {/* Close Button */}
        <button
          type="button"
          onClick={closeReceiptModal}
          aria-label="Tutup Struk"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#f0ede9] hover:bg-[#ebe8e3] flex items-center justify-center text-[#524344] focus-visible:ring-2 focus-visible:ring-[#3d1018] focus-visible:outline-none cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">close</span>
        </button>

        {/* Thermal Paper Simulation Container */}
        <div className="w-full bg-[#fffdfa] border border-[#e5e0d8] p-5 rounded-xl shadow-xs font-mono text-xs text-[#221d1d] flex flex-col gap-3">
          {/* Header */}
          <div className="flex flex-col items-center text-center border-b border-dashed border-[#d8d1c7] pb-3">
            <div className="w-10 h-10 rounded-lg bg-[#3d1018] text-white flex items-center justify-center font-serif text-lg font-bold mb-1 shadow-xs">
              G
            </div>
            <h3 id="receipt-modal-title" className="font-serif font-bold text-base tracking-wider text-[#3d1018]">
              RAWON GUSTI
            </h3>
            <p className="text-[10px] text-[#736b63]">Surabaya, Jawa Timur</p>
            <p className="text-[9px] text-[#736b63]">Jl. Pemuda No. 45 • Telp: (031) 567-8901</p>
            {bill.status === 'lunas' && (
              <span className="mt-1.5 px-2.5 py-0.5 rounded border border-emerald-600 text-emerald-700 text-[10px] font-bold tracking-widest uppercase">
                *** LUNAS ***
              </span>
            )}
          </div>

          {/* Meta Info */}
          <div className="flex flex-col gap-1 border-b border-dashed border-[#d8d1c7] pb-3 text-[11px]">
            <div className="flex justify-between">
              <span className="font-bold">Bill: #{bill.billNumber}</span>
              <span className="font-bold">Meja: {bill.tableNumber}</span>
            </div>
            <div className="flex justify-between text-[#736b63]">
              <span>Tamu: {bill.customerName} ({bill.guestCount} org)</span>
              <span>Kasir: {currentUser?.name || bill.waiterName || 'Kasir'}</span>
            </div>
            <div className="flex justify-between text-[#736b63]">
              <span>Waktu: {bill.paidAtTime || `${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${bill.requestedAt || ''}`}</span>
              <span>Layanan: Dine-in</span>
            </div>
          </div>

          {/* Items */}
          <div className="flex flex-col gap-1.5 border-b border-dashed border-[#d8d1c7] pb-3">
            {bill.items.map((item, idx) => (
              <div key={idx} className="flex flex-col">
                <div className="flex justify-between">
                  <span className="font-semibold">{item.name}</span>
                </div>
                <div className="flex justify-between text-[#736b63] pl-2 text-[10px]">
                  <span>
                    {item.quantity} x Rp {item.price.toLocaleString('id-ID')}
                  </span>
                  <span className="text-[#221d1d] font-semibold">
                    Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                  </span>
                </div>
                {item.notes && (
                  <span className="text-[9px] text-[#994703] pl-2 italic">
                    *{item.notes}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Financial Totals */}
          <div className="flex flex-col gap-1 border-b border-dashed border-[#d8d1c7] pb-3 text-[11px]">
            <div className="flex justify-between text-[#736b63]">
              <span>Subtotal:</span>
              <span>Rp {bill.subtotal.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-[#736b63]">
              <span>Biaya Layanan (5%):</span>
              <span>Rp {bill.serviceFee.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-[#736b63]">
              <span>Pajak Daerah PB1 (10%):</span>
              <span>Rp {bill.tax.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between font-bold text-sm pt-1 border-t border-[#ebe8e3] text-[#3d1018]">
              <span>TOTAL:</span>
              <span>Rp {bill.total.toLocaleString('id-ID')}</span>
            </div>

            {bill.cashTendered && (
              <>
                <div className="flex justify-between text-[#736b63] pt-1">
                  <span>Bayar ({bill.paymentMethod || 'Tunai'}):</span>
                  <span>Rp {bill.cashTendered.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between font-semibold text-[#994703]">
                  <span>Kembalian:</span>
                  <span>Rp {(bill.changeAmount || 0).toLocaleString('id-ID')}</span>
                </div>
              </>
            )}
          </div>

          {/* Footer Note & Barcode */}
          <div className="flex flex-col items-center text-center pt-1 text-[10px] text-[#736b63] gap-1">
            <p className="font-serif italic text-xs text-[#3d1018] font-bold">
              Rasa asli, sepenuh hati.
            </p>
            <p>Terima kasih atas kunjungan Anda!</p>
            <p className="text-[9px]">Struk ini merupakan bukti pembayaran resmi yang sah.</p>
            <div className="h-7 w-48 bg-stone-800 my-1 flex items-center justify-around px-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((i) => (
                <div
                  key={i}
                  className={`h-full bg-white ${i % 3 === 0 ? 'w-1.5' : i % 2 === 0 ? 'w-0.5' : 'w-1'}`}
                />
              ))}
            </div>
            <span className="text-[9px] font-mono tracking-widest text-[#847374]">
              RG-POS-{bill.billNumber.replace(/[^a-zA-Z0-9]/g, '') || '0031'}
            </span>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex gap-2 w-full mt-4">
          <button
            type="button"
            onClick={closeReceiptModal}
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
            <span>Cetak Struk</span>
          </button>
        </div>
      </div>
    </div>
  );
};
