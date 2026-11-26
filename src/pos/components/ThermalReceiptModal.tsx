import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useLockBodyScroll } from '../../lib/useLockBodyScroll';
import { publicAsset } from '../../lib/publicAsset';
import {
  buildReceiptLines,
  formatReceiptDate,
  loadMonoImage,
  printReceiptWithFallback,
  RECEIPT_DOTS_58MM,
  RECEIPT_DOTS_80MM,
  RECEIPT_WIDTH_58MM,
  RECEIPT_WIDTH_80MM,
  type MonoImage,
  type ReceiptCharge,
  type ReceiptData,
  type ReceiptRow,
} from '../../lib/escpos';

// Lebar logo dalam titik printer (~25% lebar kertas, sebanding dengan contoh struk).
const LOGO_DOTS_58MM = 96;
const LOGO_DOTS_80MM = 144;

const STORE_NAME = 'RAWON GUSTI';
const STORE_ADDRESS = [
  'Ruko Sentra',
  'Jl. Taman Internasional No. A5',
  'Sambikerep, Surabaya',
  'Telp: +62 812-4890-7556',
];
const PAYMENT_LABEL: Record<string, string> = {
  tunai: 'TUNAI',
  qris: 'QRIS',
  debit: 'DEBIT',
  split: 'SPLIT',
};

export const ThermalReceiptModal: React.FC = () => {
  const { receiptModalData, closeReceiptModal, storeSettings } = useApp();
  const [isPrinting, setIsPrinting] = useState(false);
  const [logo, setLogo] = useState<MonoImage | null>(null);
  const [logoWidthDots, setLogoWidthDots] = useState<number>(0);

  const is80mm = storeSettings?.receiptPaperSize === '80mm';
  const receiptWidth = is80mm ? RECEIPT_WIDTH_80MM : RECEIPT_WIDTH_58MM;
  const receiptDots = is80mm ? RECEIPT_DOTS_80MM : RECEIPT_DOTS_58MM;
  const targetLogoDots = is80mm ? LOGO_DOTS_80MM : LOGO_DOTS_58MM;

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

  // Logo diubah ke 1-bit (grayscale + dithering) sesuai lebar kertas aktif;
  // hasil yang sama dipakai untuk pratinjau dan cetak raster.
  useEffect(() => {
    if (!receiptModalData || (logo && logoWidthDots === targetLogoDots)) return;
    let cancelled = false;
    // logo-rawon-struk.png: monogram "g" hitam tanpa latar (transparan), dari logo_big.jpeg.
    // Nama "RAWON GUSTI" sudah dicetak sebagai teks tepat di bawahnya.
    loadMonoImage(publicAsset('/logo-rawon-struk.png'), { targetWidth: targetLogoDots })
      .then((img) => {
        if (!cancelled) {
          setLogo(img);
          setLogoWidthDots(targetLogoDots);
        }
      })
      .catch(() => {
        /* Tanpa logo pun struk tetap bisa dicetak. */
      });
    return () => {
      cancelled = true;
    };
  }, [receiptModalData, logo, logoWidthDots, targetLogoDots]);

  const receiptData = useMemo<ReceiptData | null>(() => {
    const bill = receiptModalData;
    if (!bill) return null;

    const tableDigits = String(bill.tableNumber).replace(/[^0-9]/g, '');
    const infoRows: ReceiptRow[] = [
      { label: 'Waktu', value: bill.paidAtTime || formatReceiptDate(new Date()) },
      { label: 'No. Bill', value: bill.billNumber },
    ];
    if (bill.isTakeaway) {
      infoRows.push(
        { label: 'Layanan', value: 'BAWA PULANG' },
        { label: 'No. Antrean', value: String(bill.takeawayQueue || bill.tableNumber) },
      );
    } else {
      infoRows.push({ label: 'Meja', value: tableDigits ? tableDigits.padStart(2, '0') : String(bill.tableNumber) });
    }
    infoRows.push({ label: 'Pelanggan', value: bill.customerName || 'Tamu' });

    const charges: ReceiptCharge[] = [];
    if (bill.serviceFee > 0) {
      charges.push({
        label: `${storeSettings?.serviceChargeName || 'Layanan'} ${storeSettings?.serviceChargeRate ?? 5}%`,
        amount: bill.serviceFee,
      });
    }
    if (bill.tax > 0) {
      charges.push({
        label: `${storeSettings?.taxName || 'PB1'} ${storeSettings?.taxRate ?? 10}%`,
        amount: bill.tax,
      });
    }

    return {
      storeName: STORE_NAME,
      addressLines: STORE_ADDRESS,
      infoRows,
      items: bill.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        subtotal: item.price * item.quantity,
        notes: item.notes || undefined,
      })),
      subtotal: bill.subtotal,
      charges,
      total: bill.total,
      paymentLabel: PAYMENT_LABEL[bill.paymentMethod || 'tunai'] || 'TUNAI',
      amountPaid: bill.cashTendered || bill.total,
      changeAmount: bill.changeAmount || 0,
      footerLines: ['Terima kasih!', 'Atas kunjungan Anda'],
    };
  }, [receiptModalData, storeSettings]);

  const lines = useMemo(
    () => (receiptData ? buildReceiptLines(receiptData, receiptWidth) : []),
    [receiptData, receiptWidth],
  );

  if (!receiptModalData || !receiptData) return null;

  const handlePrint = async () => {
    if (isPrinting) return;
    setIsPrinting(true);
    try {
      const outcome = await printReceiptWithFallback(receiptData, {
        printerUrl: process.env.NEXT_PUBLIC_ESCPOS_PRINTER_URL,
        width: receiptWidth,
        logo: logo ?? undefined,
      });
      // Printer belum diset / gagal: cetak pratinjau yang sama lewat browser.
      if (!outcome.delivered) window.print();
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-modal-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in lg:cursor-pointer"
      onClick={(e) => {
        // Hanya tutup via klik void di PC desktop (>= 1024px)
        if (e.target === e.currentTarget && typeof window !== 'undefined' && window.innerWidth >= 1024) {
          closeReceiptModal();
        }
      }}
    >
      <div className={`bg-white rounded-2xl ${is80mm ? 'max-w-md' : 'max-w-sm'} w-full max-h-[88vh] p-4 sm:p-5 shadow-2xl border border-[#ebe8e3] flex flex-col my-auto animate-in zoom-in-95 duration-150 cursor-default`}>
        {/* Header Modal Ringkas */}
        <div className="flex items-center justify-between pb-3 border-b border-[#ebe8e3] shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#3d1018] text-[20px]">receipt_long</span>
            <div>
              <h3 id="receipt-modal-title" className="font-serif font-bold text-sm sm:text-base text-[#1c1c19] leading-tight">
                Pratinjau Struk Kasir
              </h3>
              <p className="text-[10px] text-[#847374]">
                Tampilan sesuai hasil cetak printer termal {is80mm ? '80mm' : '58mm'}
              </p>
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

        {/* Meja abu-abu + kertas termal putih (hanya kertas yang ikut tercetak) */}
        <div className="flex-1 overflow-y-auto overscroll-contain my-3 rounded-xl bg-neutral-200 p-3 sm:p-4">
          <div className="printable-receipt-area mx-auto w-fit bg-white text-black px-4 pt-5 pb-6 shadow-md font-mono text-[12px] leading-[1.35]">
            <div className="mx-auto" style={{ width: `${receiptWidth}ch` }}>
              {/* Logo 1-bit: lebarnya proporsional terhadap lebar titik kertas */}
              <div className="flex justify-center mb-1.5">
                {logo ? (
                  <img
                    src={logo.previewUrl}
                    alt="Logo Rawon Gusti"
                    style={{ width: `${(logo.width / receiptDots) * 100}%` }}
                    className="block"
                  />
                ) : (
                  // Tempat kosong seukuran logo supaya struk tidak "melompat" saat logo selesai dimuat.
                  <div style={{ width: `${(targetLogoDots / receiptDots) * 100}%`, aspectRatio: '400 / 491' }} />
                )}
              </div>

              {/* Baris struk: sama persis dengan yang dikirim ke printer */}
              {lines.map((line, idx) => (
                <div key={idx} className={`whitespace-pre ${line.bold ? 'font-bold' : ''}`}>
                  {line.text || '\u00A0'}
                </div>
              ))}
            </div>
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
            disabled={isPrinting}
            className="flex-1 py-2.5 rounded-xl bg-[#3d1018] hover:bg-[#58252c] disabled:opacity-60 disabled:cursor-wait text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">print</span>
            <span>{isPrinting ? 'Mencetak...' : 'Cetak Struk'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
