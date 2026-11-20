import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';

export const SelfOrderVerificationModal: React.FC = () => {
  const {
    isVerificationModalOpen,
    closeVerificationModal,
    pendingQrOrders,
    confirmCustomerOrder,
    rejectCustomerOrder,
  } = useApp();

  // Escape key handler to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVerificationModalOpen) {
        closeVerificationModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVerificationModalOpen, closeVerificationModal]);

  if (!isVerificationModalOpen) return null;

  const count = pendingQrOrders.length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="verification-modal-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && typeof window !== 'undefined' && window.innerWidth >= 1024) {
          closeVerificationModal();
        }
      }}
    >
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl relative flex flex-col max-h-[90vh] border border-[#ebe8e3] animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#ebe8e3] shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 id="verification-modal-title" className="font-bold text-base sm:text-lg text-[#1c1c19] leading-tight">
              Verifikasi Pesanan Self-Order
            </h3>
            {count > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-amber-100 text-amber-900 border-amber-300">
                {count} Menunggu Konfirmasi
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={closeVerificationModal}
            aria-label="Tutup Dialog Verifikasi"
            className="w-8 h-8 rounded-full bg-[#f0ede9] hover:bg-[#ebe8e3] flex items-center justify-center text-[#524344] hover:text-[#1c1c19] transition-colors cursor-pointer shrink-0 ml-2"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto custom-scrollbar flex-1 py-4 space-y-3.5 pr-1">
          {count === 0 ? (
            /* Empty State */
            <div className="py-10 flex flex-col items-center justify-center text-center space-y-1.5">
              <h4 className="font-bold text-sm sm:text-base text-[#1c1c19]">Tidak Ada Pesanan Menunggu</h4>
              <p className="text-xs text-[#847374] max-w-sm">
                Saat ini belum ada pesanan QR mandiri baru yang perlu diverifikasi.
              </p>
            </div>
          ) : (
            /* List of Pending Orders */
            <>
              <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-amber-700 shrink-0">info</span>
                <span>
                  <strong>Tips Kasir:</strong> Pastikan meja fisik terisi dan nomor meja cocok dengan tamu sebelum menekan <em>"Terima & Masak"</em>.
                </span>
              </div>

              {pendingQrOrders.map((ord) => (
                <div
                  key={ord.orderId}
                  className="bg-[#fcf9f4] p-4 rounded-2xl border-2 border-amber-300 shadow-2xs space-y-3 transition-all hover:shadow-xs"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 border-b border-[#ebe8e3] pb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-[#3d1018] text-white font-bold text-xs tracking-wider">
                          Meja {ord.tableNumber}
                        </span>
                        <span className="font-bold text-sm text-[#1c1c19]">
                          {ord.customerName}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#847374] mt-0.5 block">
                        Tiket #{ord.orderNumber} · Sumber: QR Mandiri
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-[#847374] block uppercase tracking-wider font-semibold">Total Tagihan</span>
                      <span className="font-serif font-bold text-base sm:text-lg text-[#3d1018]">
                        Rp {ord.total.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-1.5 bg-white p-3 rounded-xl border border-[#ebe8e3]">
                    <span className="text-[10px] font-bold text-[#847374] uppercase tracking-wider block mb-1">
                      Daftar Hidangan Diminta ({ord.items.length} Menu):
                    </span>
                    {ord.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-start text-xs gap-2">
                        <div className="flex items-start gap-1.5 min-w-0">
                          <span className="font-bold text-[#3d1018] shrink-0">{item.quantity}×</span>
                          <span className="text-[#1c1c19] truncate">{item.product_name}</span>
                          {item.note && (
                            <span className="text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 shrink-0 italic">
                              {item.note}
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-[11px] text-[#524344] shrink-0">
                          Rp {(Number(item.unit_price) * item.quantity).toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* General Table Note */}
                  {ord.note && (
                    <div className="p-2.5 rounded-xl bg-amber-100/60 border border-amber-300 text-xs text-amber-950 flex items-start gap-2">
                      <span className="material-symbols-outlined text-[16px] text-amber-800 shrink-0 mt-0.5">sticky_note_2</span>
                      <div className="min-w-0">
                        <span className="font-bold">Catatan Pelanggan: </span>
                        <span>{ord.note}</span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons: Tolak (Fiktif) vs Terima & Masak */}
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => rejectCustomerOrder(ord.orderId)}
                      className="h-10 rounded-xl bg-[#ffdadc]/40 hover:bg-[#ffdadc]/80 text-[#ba1a1a] border border-[#ba1a1a]/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[16px]">cancel</span>
                      <span>Tolak (Fiktif / Batal)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => confirmCustomerOrder(ord.orderId)}
                      className="h-10 rounded-xl bg-[#15803d] hover:bg-[#166534] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      <span>Terima &amp; Masak</span>
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

      </div>
    </div>
  );
};
