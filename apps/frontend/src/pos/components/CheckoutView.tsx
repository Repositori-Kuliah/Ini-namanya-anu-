import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BillItem, SplitPaymentDetail } from '../types';
import { useLockBodyScroll } from '../../lib/useLockBodyScroll';

export const CheckoutView: React.FC = () => {
  const {
    bills,
    selectedBillId,
    setSelectedBillId,
    selectedBill,
    settlePayment,
    openReceiptModal,
    showToast,
    recentReceipts,
    refresh,
    playDingSound,
    confirmCustomerOrder,
    rejectCustomerOrder,
    pendingQrOrders,
  } = useApp();

  const [queueTab, setQueueTab] = useState<'unpaid' | 'history'>('unpaid');
  const [selectedHistoryBill, setSelectedHistoryBill] = useState<BillItem | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  // Kunci scroll halaman belakang saat modal detail checkout terbuka di mobile
  useLockBodyScroll(mobileDetailOpen);

  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'QRIS' | 'Kartu Debit'>('Tunai');
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showQrisCode, setShowQrisCode] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredBills = bills.filter(
    (b) =>
      b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.tableNumber.includes(searchQuery) ||
      b.billNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredHistory = recentReceipts.filter(
    (b) =>
      b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.tableNumber.includes(searchQuery) ||
      b.billNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const rawBill =
    queueTab === 'history'
      ? selectedHistoryBill || filteredHistory[0] || {
          id: 'empty-history',
          billNumber: '-',
          tableNumber: '--',
          customerName: 'Tidak ada riwayat',
          guestCount: 0,
          itemCount: 0,
          items: [],
          subtotal: 0,
          serviceFee: 0,
          tax: 0,
          total: 0,
          requestedAt: '-',
          elapsedMinutesAgo: 0,
          waiterName: '-',
          openedAtTime: '-',
          status: 'lunas' as const,
        }
      : selectedBill || filteredBills[0] || bills[0] || {
          id: 'empty-bill',
          billNumber: 'B-000',
          tableNumber: '--',
          customerName: 'Tamu',
          guestCount: 0,
          itemCount: 0,
          items: [],
          subtotal: 0,
          serviceFee: 0,
          tax: 0,
          total: 0,
          requestedAt: '12:00',
          elapsedMinutesAgo: 0,
          waiterName: '-',
          openedAtTime: '12.00 WIB',
          status: 'belum_dibayar' as const,
        };

  // Format Meja: Ubah Meja 00 atau kosong menjadi Meja --
  const formatTableLabel = (num: string) => {
    if (!num || num === '00' || num === '?' || num === '-') return '--';
    return num;
  };

  const currentBill: BillItem = {
    ...rawBill,
    tableNumber: formatTableLabel(rawBill.tableNumber),
  };

  const isUnpaidEmpty = queueTab === 'unpaid' && (bills.length === 0 || currentBill.id === 'empty-bill');
  const isHistoryEmpty = queueTab === 'history' && (recentReceipts.length === 0 || currentBill.id === 'empty-history');
  const showEmptyState = isUnpaidEmpty || isHistoryEmpty;

  // Hitung uang kembalian
  const change = cashTendered - currentBill.total;
  const isChangeNegative = change < 0;

  // Set uang tunai otomatis uang pas saat bill dipilih atau total tagihan berubah
  useEffect(() => {
    if (currentBill && currentBill.total > 0) {
      setCashTendered(currentBill.total);
    }
  }, [currentBill.id, currentBill.total]);

  const handleExecutePayment = () => {
    if (currentBill.isAllServed === false) {
      showToast('Tidak bisa bayar! Masih ada pesanan di dapur yang belum disajikan.', 'warning');
      return;
    }

    if (paymentMethod === 'Tunai' && isChangeNegative) {
      showToast('Nominal uang tunai kurang dari total tagihan!', 'warning');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setMobileDetailOpen(false);
      settlePayment(currentBill.id, paymentMethod, cashTendered);
    }, 250);
  };

  const handleManualRefresh = () => {
    refresh();
    showToast('Daftar tagihan kasir diperbarui', 'info');
  };

  return (
    <div className="flex flex-col w-full pb-4 md:pb-8 max-w-[1600px] mx-auto px-4 sm:px-6 pt-3">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-[#ebe8e3]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1c1c19] tracking-tight">
            Checkout &amp; Pembayaran
          </h1>
          <p className="text-xs text-[#524344] mt-0.5">
            Penyelesaian transaksi santap di tempat, pelunasan tagihan, dan cetak struk kasir.
          </p>
        </div>

        <button
          type="button"
          onClick={handleManualRefresh}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#ebe8e3] text-[#1c1c19] text-xs font-semibold hover:bg-[#f6f3ee] transition-colors cursor-pointer shadow-2xs self-start sm:self-auto"
          aria-label="Segarkan antrean tagihan"
        >
          <span className="material-symbols-outlined text-[16px] text-[#3d1018]">sync</span>
          <span>Segarkan Antrean</span>
        </button>
      </div>

      {/* ================= BANNER KONFIRMASI PESANAN QR (ANTI-ORDER FIKTIF) ================= */}
      {pendingQrOrders && pendingQrOrders.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50/90 border-2 border-amber-300 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-[18px]">notifications_active</span>
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#1c1c19]">
                  Konfirmasi Pesanan QR Meja (Anti-Order Fiktif)
                </h3>
                <p className="text-[11px] text-[#524344]">
                  Tamu memesan via HP. Periksa kehadiran tamu meja sebelum mengirim tiket ke Dapur &amp; Bar.
                </p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-200 text-amber-900 border border-amber-300">
              {pendingQrOrders.length} Pesanan Baru
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingQrOrders.map((ord) => (
              <div key={ord.orderId} className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-2xs flex flex-col justify-between space-y-2.5">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#3d1018] bg-[#fcf9f4] px-2 py-0.5 rounded border border-[#ebe8e3]">
                      Meja {ord.tableNumber}
                    </span>
                    <span className="font-mono font-bold text-xs text-[#1c1c19]">
                      Rp {ord.total.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="text-xs text-[#524344] mt-1.5">
                    <strong>{ord.customerName}</strong> <span className="text-[#847374] text-[10px]">({ord.orderNumber})</span>
                  </div>
                  <div className="text-[11px] text-[#847374] mt-1 line-clamp-2">
                    {ord.items.map((i: any) => `${i.quantity}x ${i.product_name}`).join(', ')}
                  </div>
                  {ord.note && (
                    <div className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded mt-1 italic">
                      *{ord.note}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-[#ebe8e3]">
                  <button
                    type="button"
                    onClick={() => confirmCustomerOrder(ord.orderId)}
                    className="flex-1 py-1.5 px-3 bg-[#3d1018] hover:bg-[#58252c] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                  >
                    <span className="material-symbols-outlined text-[14px]">check</span>
                    <span>Terima &amp; Masak</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => rejectCustomerOrder(ord.orderId)}
                    className="py-1.5 px-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    title="Tolak pesanan jika tamu fiktif/iseng"
                  >
                    <span>Tolak</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid Dua Kolom: KIRI (Antrean Tagihan) & KANAN (Detail Pembayaran) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* =========================================================================
            LEFT AREA: BILL QUEUE (5 Kolom pada Desktop)
           ========================================================================= */}
        <section
          aria-label="Daftar Antrean Tagihan"
          className="lg:col-span-5 flex flex-col gap-3"
        >
          {/* Tab Filter: Belum Dibayar vs Riwayat Transaksi */}
          <div className="flex items-center bg-[#f0ede9] p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setQueueTab('unpaid')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                queueTab === 'unpaid'
                  ? 'bg-white text-[#3d1018] shadow-xs'
                  : 'text-[#524344] hover:text-[#1c1c19]'
              }`}
            >
              <span>Belum Dibayar</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  queueTab === 'unpaid' ? 'bg-[#3d1018] text-white' : 'bg-[#e0dcd8] text-[#524344]'
                }`}
              >
                {bills.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setQueueTab('history')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                queueTab === 'history'
                  ? 'bg-white text-[#3d1018] shadow-xs'
                  : 'text-[#524344] hover:text-[#1c1c19]'
              }`}
            >
              <span>Riwayat Transaksi</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  queueTab === 'history' ? 'bg-[#3d1018] text-white' : 'bg-[#e0dcd8] text-[#524344]'
                }`}
              >
                {recentReceipts.length}
              </span>
            </button>
          </div>

          {/* Kotak Pencarian */}
          <div className="relative flex items-center bg-white px-3 py-2 rounded-xl border border-[#ebe8e3]">
            <span className="material-symbols-outlined text-[18px] text-[#847374] mr-2">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari meja, tamu, atau nomor bill..."
              className="bg-transparent w-full text-xs text-[#1c1c19] placeholder-[#847374] outline-none"
              aria-label="Cari tagihan"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-[#847374] hover:text-[#1c1c19] text-xs"
                aria-label="Hapus pencarian"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          {/* Daftar Tagihan Ringkas (Compact Horizontal List dengan Scroll Mandiri) */}
          <div className="flex flex-col gap-2 max-h-[calc(100vh-220px)] overflow-y-auto p-1 pb-6 custom-scrollbar">
            {queueTab === 'unpaid' ? (
              filteredBills.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center border border-[#ebe8e3]">
                  <span className="material-symbols-outlined text-3xl text-[#3d1018] mb-1">
                    check_circle
                  </span>
                  <p className="font-bold text-sm text-[#1c1c19]">Semua Tagihan Selesai</p>
                  <p className="text-xs text-[#524344] mt-0.5">
                    Tidak ada meja yang sedang menunggu pembayaran kasir.
                  </p>
                </div>
              ) : (
                filteredBills.map((bill) => {
                  const isSelected = bill.id === currentBill.id;
                  const isUnserved = bill.isAllServed === false;

                  return (
                    <button
                      key={bill.id}
                      type="button"
                      onClick={() => {
                        setSelectedBillId(bill.id);
                        setMobileDetailOpen(true);
                      }}
                      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-[#fcf9f4] border-[#3d1018] ring-1 ring-[#3d1018]'
                          : 'bg-white hover:bg-[#f6f3ee] border-[#ebe8e3]'
                      }`}
                      aria-pressed={isSelected}
                    >
                      {/* Badge Meja & Info Tamu */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-[50px] h-[40px] rounded-lg flex flex-col items-center justify-center shrink-0 font-bold ${
                            isSelected
                              ? 'bg-[#3d1018] text-white shadow-xs'
                              : 'bg-[#f0ede9] text-[#1c1c19] border border-[#ebe8e3]'
                          }`}
                        >
                          <span className="text-[8.5px] uppercase font-bold tracking-wider leading-none opacity-85">
                            {bill.isTakeaway ? 'BUNGKUS' : 'MEJA'}
                          </span>
                          <span className="text-xs font-extrabold tabular-nums leading-tight mt-0.5">
                            {bill.isTakeaway
                              ? (bill.takeawayQueue ? bill.takeawayQueue.replace(/[^0-9]/g, '').padStart(2, '0') : '01')
                              : formatTableLabel(bill.tableNumber)}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-xs sm:text-sm text-[#1c1c19] truncate">
                              {bill.customerName && bill.customerName !== 'Tamu' && bill.customerName !== 'Pelanggan Bungkus'
                                ? bill.customerName
                                : bill.billNumber}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#524344] mt-0.5 truncate">
                            <span className="font-mono text-[#847374]">ID: {bill.billNumber}</span> · {bill.itemCount} menu
                          </p>
                        </div>
                      </div>

                      {/* Total & Status */}
                      <div className="text-right shrink-0">
                        <span className="font-bold text-xs sm:text-sm text-[#1c1c19] tabular-nums block">
                          Rp {bill.total.toLocaleString('id-ID')}
                        </span>
                        <div className="flex items-center gap-1 justify-end mt-0.5">
                          <span className="lg:hidden text-[10px] text-[#3d1018] font-bold flex items-center">
                            Bayar <span className="material-symbols-outlined text-[13px]">chevron_right</span>
                          </span>
                          {bill.status === 'minta_checkout' && (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#ffdbc9] text-[#753400]">
                              Minta Bayar
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )
            ) : filteredHistory.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center border border-[#ebe8e3]">
                <span className="material-symbols-outlined text-3xl text-[#847374] mb-1">
                  history
                </span>
                <p className="font-bold text-sm text-[#1c1c19]">Belum Ada Riwayat</p>
                <p className="text-xs text-[#524344] mt-0.5">
                  Transaksi yang telah lunas akan tersimpan di sini.
                </p>
              </div>
            ) : (
              filteredHistory.map((bill) => {
                const isSelected = bill.id === currentBill.id;

                return (
                  <button
                    key={bill.id}
                    type="button"
                    onClick={() => {
                      setSelectedHistoryBill(bill);
                      setMobileDetailOpen(true);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#fcf9f4] border-[#3d1018] ring-1 ring-[#3d1018]'
                        : 'bg-white hover:bg-[#f6f3ee] border-[#ebe8e3]'
                    }`}
                    aria-pressed={isSelected}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-[50px] h-[40px] rounded-lg flex flex-col items-center justify-center shrink-0 font-bold ${
                          isSelected
                            ? 'bg-[#3d1018] text-white shadow-xs'
                            : 'bg-[#f0ede9] text-[#1c1c19] border border-[#ebe8e3]'
                        }`}
                      >
                        <span className="text-[8.5px] uppercase font-bold tracking-wider leading-none opacity-85">
                          {bill.isTakeaway ? 'BUNGKUS' : 'MEJA'}
                        </span>
                        <span className="text-xs font-extrabold tabular-nums leading-tight mt-0.5">
                          {bill.isTakeaway
                            ? (bill.takeawayQueue ? bill.takeawayQueue.replace(/[^0-9]/g, '').padStart(2, '0') : '01')
                            : formatTableLabel(bill.tableNumber)}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <span className="font-bold text-xs sm:text-sm text-[#3d1018] tracking-wide block truncate">
                          {((bill.paymentMethod as any) === 'split' || (bill.paymentMethod as any) === 'Split Payment'
                            ? 'Pecah Bayar'
                            : bill.paymentMethod || 'Tunai').toUpperCase()}
                        </span>
                        <p className="text-[11px] text-[#847374] mt-0.5 font-mono">
                          ID: {bill.billNumber}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-bold text-xs sm:text-sm text-[#1c1c19] tabular-nums block">
                        Rp {bill.total.toLocaleString('id-ID')}
                      </span>
                      <span className="text-[10px] text-[#847374] block mt-0.5">
                        {bill.paidAtTime || bill.requestedAt}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* =========================================================================
            RIGHT AREA: PAYMENT DETAIL (7 Kolom pada Desktop) & POP-UP (Mobile)
           ========================================================================= */}
        {!showEmptyState && (
          <section
            aria-label="Detail Pembayaran Tagihan Terpilih"
            className="hidden lg:flex lg:col-span-7 bg-white rounded-xl border border-[#ebe8e3] p-4 sm:p-5 flex-col gap-4 lg:sticky lg:top-20"
          >
            {/* Header Rincian Tagihan Terpilih */}
            <div className="pb-3 border-b border-[#ebe8e3] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-[#1c1c19]">
                  {currentBill.billNumber}
                </h2>
              </div>
            </div>

            {/* Rincian Menu Yang Dipesan (Tabel Ringkas) */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#524344] block mb-2">
                Daftar Pesanan ({currentBill.items.length} menu)
              </span>

              {currentBill.items.length === 0 ? (
                <p className="text-xs text-[#847374] italic py-2">Tidak ada item pesanan.</p>
              ) : (
                <div className="divide-y divide-[#ebe8e3] text-xs">
                  {currentBill.items.map((item, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 text-center font-bold text-[#3d1018] tabular-nums shrink-0">
                          {item.quantity}×
                        </span>
                        <div className="min-w-0">
                          <span className="font-semibold text-[#1c1c19] truncate block">
                            {item.name}
                          </span>
                          {item.notes && (
                            <span className="text-[11px] text-[#994703] block truncate">
                              Catatan: {item.notes}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="font-medium text-[#1c1c19] tabular-nums shrink-0">
                        Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Kalkulasi Finansial (Subtotal, PB1, Service, Total) */}
            <div className="pt-3 border-t border-[#ebe8e3] space-y-1.5 text-xs">
              <div className="flex justify-between text-[#524344]">
                <span>Subtotal Menu</span>
                <span className="font-medium text-[#1c1c19] tabular-nums">
                  Rp {currentBill.subtotal.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between text-[#524344]">
                <span>Biaya Layanan (5%)</span>
                <span className="font-medium text-[#1c1c19] tabular-nums">
                  Rp {currentBill.serviceFee.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between text-[#524344]">
                <span>Pajak Restoran PB1 (10%)</span>
                <span className="font-medium text-[#1c1c19] tabular-nums">
                  Rp {currentBill.tax.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#ebe8e3] items-baseline">
                <span className="text-sm font-bold text-[#1c1c19]">TOTAL PEMBAYARAN</span>
                <span className="text-2xl font-bold text-[#3d1018] tabular-nums">
                  Rp {currentBill.total.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Pilihan Metode Pembayaran & Penyelesaian */}
            {currentBill.status === 'lunas' ? (
              /* Mode Transaksi Lunas */
              <div className="pt-2 border-t border-[#ebe8e3] space-y-3">
                <div className="p-3 rounded-lg bg-[#fcf9f4] border border-[#ebe8e3] text-xs">
                  <span className="font-bold text-[#3d1018] block">
                    Transaksi Sudah Lunas
                  </span>
                  <span className="text-[11px] text-[#524344] mt-0.5 block">
                    Dibayar via {(currentBill.paymentMethod || 'Tunai').toUpperCase()} · {currentBill.paidAtTime || currentBill.requestedAt}
                  </span>
                </div>

                {currentBill.paymentMethod === 'tunai' && currentBill.cashTendered ? (
                  <div className="grid grid-cols-2 gap-2 text-xs bg-[#fcf9f4] p-3 rounded-lg border border-[#ebe8e3]">
                    <div>
                      <span className="text-[#847374] block">Diterima:</span>
                      <span className="font-bold text-[#1c1c19] tabular-nums">
                        Rp {currentBill.cashTendered.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#847374] block">Kembalian:</span>
                      <span className="font-bold text-[#994703] tabular-nums">
                        Rp {(currentBill.changeAmount || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => openReceiptModal(currentBill)}
                  className="w-full py-2.5 rounded-lg bg-[#3d1018] hover:bg-[#58252c] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">print</span>
                  <span>Cetak Ulang Struk</span>
                </button>
              </div>
            ) : (
              /* Mode Input Pembayaran Kasir */
              <div className="pt-2 border-t border-[#ebe8e3] space-y-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#524344] block mb-1.5">
                    Metode Pembayaran
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Tunai', 'QRIS', 'Kartu Debit'] as const).map((method) => {
                      const active = paymentMethod === method;
                      return (
                        <button
                          key={method}
                          type="button"
                          onClick={() => {
                            setPaymentMethod(method);
                            setShowQrisCode(method === 'QRIS');
                          }}
                          className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            active
                              ? 'bg-[#3d1018] text-white shadow-xs'
                              : 'bg-[#f0ede9] text-[#1c1c19] hover:bg-[#e0dcd8]'
                          }`}
                          aria-pressed={active}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {method === 'Tunai'
                              ? 'payments'
                              : method === 'QRIS'
                              ? 'qr_code_2'
                              : 'credit_card'}
                          </span>
                          <span className="truncate">{method}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tampilan QRIS */}
                {paymentMethod === 'QRIS' && (
                  <div className="p-4 rounded-xl bg-[#fcf9f4] border border-[#ebe8e3] flex flex-col items-center text-center gap-2">
                    <div className="w-40 h-40 bg-white p-2 rounded-lg border border-[#ebe8e3] flex items-center justify-center">
                      <svg className="w-full h-full text-[#3d1018]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm-2 10h8v8H2v-8zm2 2v4h4v-4H4zm10-14h8v8h-8V2zm2 2v4h4V4h-4zm3 8h3v2h-3v-2zm-3 2h2v3h-2v-3zm5 2h2v4h-4v-2h2v-2zm-2 2v2h-3v-2h3zm-3-4h2v2h-2v-2zm-2 2h2v2h-2v-2z" />
                      </svg>
                    </div>
                    <p className="text-xs font-bold text-[#1c1c19]">
                      NMID: ID1029384756 • RAWON GUSTI
                    </p>
                    <p className="text-[11px] text-[#524344]">
                      Pelanggan memindai QR dinamis di atas menggunakan aplikasi e-wallet / mobile banking.
                    </p>
                  </div>
                )}

                {/* Tampilan Tunai (Input, Preset, Kembalian) */}
                {paymentMethod === 'Tunai' && (
                  <div className="space-y-2.5 p-3 rounded-xl bg-[#fcf9f4] border border-[#ebe8e3]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label htmlFor="cash-input" className="text-xs font-bold text-[#1c1c19]">
                        Uang Tunai Diterima:
                      </label>
                      <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-[#ebe8e3] focus-within:border-[#3d1018]">
                        <span className="font-bold text-xs text-[#524344]">Rp</span>
                        <input
                          id="cash-input"
                          type="text"
                          inputMode="numeric"
                          value={cashTendered ? cashTendered.toLocaleString('id-ID') : '0'}
                          onChange={(e) => {
                            const raw = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10) || 0;
                            setCashTendered(raw);
                          }}
                          className="font-bold text-sm text-[#1c1c19] text-right outline-none w-32 tabular-nums"
                        />
                      </div>
                    </div>

                    {/* Baris Kembalian */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#ebe8e3] text-xs font-bold">
                      <span className="text-[#524344]">Uang Kembalian:</span>
                      <span
                        className={`text-base tabular-nums ${
                          isChangeNegative ? 'text-red-700' : 'text-[#994703]'
                        }`}
                      >
                        {isChangeNegative
                          ? `Kurang Rp ${Math.abs(change).toLocaleString('id-ID')}`
                          : `Rp ${change.toLocaleString('id-ID')}`}
                      </span>
                    </div>
                  </div>
                )}


                {/* Tombol Eksekusi Pembayaran */}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleExecutePayment}
                    disabled={
                      isProcessing ||
                      bills.length === 0 ||
                      currentBill.isAllServed === false ||
                      (paymentMethod === 'Tunai' && isChangeNegative)
                    }
                    className={`w-full py-3 px-4 rounded-xl text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer ${
                      currentBill.isAllServed === false || (paymentMethod === 'Tunai' && isChangeNegative)
                        ? 'bg-[#847374] opacity-60 cursor-not-allowed'
                        : 'bg-[#3d1018] hover:bg-[#58252c] active:scale-[0.99]'
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <span className="material-symbols-outlined text-[18px] animate-spin">
                          sync
                        </span>
                        <span>Memproses Pembayaran...</span>
                      </>
                    ) : currentBill.isAllServed === false ? (
                      <>
                        <span className="material-symbols-outlined text-[18px]">skillet</span>
                        <span>Tunggu Masakan Disajikan Dapur</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                        <span>
                          Konfirmasi Pembayaran (Rp {currentBill.total.toLocaleString('id-ID')})
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* =========================================================================
            MOBILE MODAL: POP-UP DETAIL PEMBAYARAN & RIWAYAT (Hanya Pada Mobile)
           ========================================================================= */}
        {mobileDetailOpen && !showEmptyState && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs lg:hidden animate-in fade-in duration-150"
          >
            <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-5 border border-[#ebe8e3] max-w-lg w-full max-h-[92vh] overflow-y-auto overscroll-contain flex flex-col gap-4 animate-in zoom-in-95 duration-150">
              {/* Header Rincian Tagihan Terpilih */}
              <div className="pb-3 border-b border-[#ebe8e3] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-[#1c1c19]">
                    {currentBill.billNumber}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileDetailOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#f0ede9] hover:bg-[#ebe8e3] flex items-center justify-center text-[#524344] cursor-pointer transition-colors"
                  aria-label="Tutup pembayaran"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {/* Rincian Menu Yang Dipesan (Tabel Ringkas) */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#524344] block mb-2">
                  Daftar Pesanan ({currentBill.items.length} menu)
                </span>

                {currentBill.items.length === 0 ? (
                  <p className="text-xs text-[#847374] italic py-2">Tidak ada item pesanan.</p>
                ) : (
                  <div className="divide-y divide-[#ebe8e3] text-xs">
                    {currentBill.items.map((item, idx) => (
                      <div key={idx} className="py-2 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 text-center font-bold text-[#3d1018] tabular-nums shrink-0">
                            {item.quantity}×
                          </span>
                          <div className="min-w-0">
                            <span className="font-semibold text-[#1c1c19] truncate block">
                              {item.name}
                            </span>
                            {item.notes && (
                              <span className="text-[11px] text-[#994703] block truncate">
                                Catatan: {item.notes}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="font-medium text-[#1c1c19] tabular-nums shrink-0">
                          Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Kalkulasi Finansial (Subtotal, PB1, Service, Total) */}
              <div className="pt-3 border-t border-[#ebe8e3] space-y-1.5 text-xs">
                <div className="flex justify-between text-[#524344]">
                  <span>Subtotal Menu</span>
                  <span className="font-medium text-[#1c1c19] tabular-nums">
                    Rp {currentBill.subtotal.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between text-[#524344]">
                  <span>Biaya Layanan (5%)</span>
                  <span className="font-medium text-[#1c1c19] tabular-nums">
                    Rp {currentBill.serviceFee.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between text-[#524344]">
                  <span>Pajak Restoran PB1 (10%)</span>
                  <span className="font-medium text-[#1c1c19] tabular-nums">
                    Rp {currentBill.tax.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#ebe8e3] items-baseline">
                  <span className="text-sm font-bold text-[#1c1c19]">TOTAL PEMBAYARAN</span>
                  <span className="text-2xl font-bold text-[#3d1018] tabular-nums">
                    Rp {currentBill.total.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Pilihan Metode Pembayaran & Penyelesaian */}
              {currentBill.status === 'lunas' ? (
                /* Mode Transaksi Lunas */
                <div className="pt-2 border-t border-[#ebe8e3] space-y-3">
                  <div className="p-3 rounded-lg bg-[#fcf9f4] border border-[#ebe8e3] text-xs">
                    <span className="font-bold text-[#3d1018] block">
                      Transaksi Sudah Lunas
                    </span>
                    <span className="text-[11px] text-[#524344] mt-0.5 block">
                      Dibayar via {(currentBill.paymentMethod || 'Tunai').toUpperCase()} · {currentBill.paidAtTime || currentBill.requestedAt}
                    </span>
                  </div>

                  {currentBill.paymentMethod === 'tunai' && currentBill.cashTendered ? (
                    <div className="grid grid-cols-2 gap-2 text-xs bg-[#fcf9f4] p-3 rounded-lg border border-[#ebe8e3]">
                      <div>
                        <span className="text-[#847374] block">Diterima:</span>
                        <span className="font-bold text-[#1c1c19] tabular-nums">
                          Rp {currentBill.cashTendered.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#847374] block">Kembalian:</span>
                        <span className="font-bold text-[#994703] tabular-nums">
                          Rp {(currentBill.changeAmount || 0).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => openReceiptModal(currentBill)}
                    className="w-full py-2.5 rounded-xl bg-[#3d1018] hover:bg-[#58252c] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">print</span>
                    <span>Cetak Ulang Struk</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMobileDetailOpen(false)}
                    className="w-full py-2.5 rounded-xl bg-[#f0ede9] hover:bg-[#ebe8e3] text-[#1c1c19] text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Kembali ke Daftar Riwayat
                  </button>
                </div>
              ) : (
                /* Mode Input Pembayaran Kasir */
                <div className="pt-2 border-t border-[#ebe8e3] space-y-3">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#524344] block mb-1.5">
                      Metode Pembayaran
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Tunai', 'QRIS', 'Kartu Debit'] as const).map((method) => {
                        const active = paymentMethod === method;
                        return (
                          <button
                            key={method}
                            type="button"
                            onClick={() => {
                              setPaymentMethod(method);
                              setShowQrisCode(method === 'QRIS');
                            }}
                            className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                              active
                                ? 'bg-[#3d1018] text-white shadow-xs'
                                : 'bg-[#f0ede9] text-[#1c1c19] hover:bg-[#e0dcd8]'
                            }`}
                            aria-pressed={active}
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {method === 'Tunai'
                                ? 'payments'
                                : method === 'QRIS'
                                ? 'qr_code_2'
                                : 'credit_card'}
                            </span>
                            <span className="truncate">{method}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tampilan QRIS */}
                  {paymentMethod === 'QRIS' && (
                    <div className="p-4 rounded-xl bg-[#fcf9f4] border border-[#ebe8e3] flex flex-col items-center text-center gap-2">
                      <div className="w-40 h-40 bg-white p-2 rounded-lg border border-[#ebe8e3] flex items-center justify-center">
                        <svg className="w-full h-full text-[#3d1018]" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm-2 10h8v8H2v-8zm2 2v4h4v-4H4zm10-14h8v8h-8V2zm2 2v4h4V4h-4zm3 8h3v2h-3v-2zm-3 2h2v3h-2v-3zm5 2h2v4h-4v-2h2v-2zm-2 2v2h-3v-2h3zm-3-4h2v2h-2v-2zm-2 2h2v2h-2v-2z" />
                        </svg>
                      </div>
                      <p className="text-xs font-bold text-[#1c1c19]">
                        NMID: ID1029384756 • RAWON GUSTI
                      </p>
                      <p className="text-[11px] text-[#524344]">
                        Pelanggan memindai QR dinamis di atas menggunakan aplikasi e-wallet / mobile banking.
                      </p>
                    </div>
                  )}

                  {/* Tampilan Tunai (Input, Preset, Kembalian) */}
                  {paymentMethod === 'Tunai' && (
                    <div className="space-y-2.5 p-3 rounded-xl bg-[#fcf9f4] border border-[#ebe8e3]">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <label htmlFor="cash-input-mob" className="text-xs font-bold text-[#1c1c19]">
                          Uang Tunai Diterima:
                        </label>
                        <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-[#ebe8e3] focus-within:border-[#3d1018]">
                          <span className="font-bold text-xs text-[#524344]">Rp</span>
                          <input
                            id="cash-input-mob"
                            type="text"
                            inputMode="numeric"
                            value={cashTendered ? cashTendered.toLocaleString('id-ID') : '0'}
                            onChange={(e) => {
                              const raw = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10) || 0;
                              setCashTendered(raw);
                            }}
                            className="font-bold text-sm text-[#1c1c19] text-right outline-none w-32 tabular-nums"
                          />
                        </div>
                      </div>

                      {/* Baris Kembalian */}
                      <div className="flex items-center justify-between pt-2 border-t border-[#ebe8e3] text-xs font-bold">
                        <span className="text-[#524344]">Uang Kembalian:</span>
                        <span
                          className={`text-base tabular-nums ${
                            isChangeNegative ? 'text-red-700' : 'text-[#994703]'
                          }`}
                        >
                          {isChangeNegative
                            ? `Kurang Rp ${Math.abs(change).toLocaleString('id-ID')}`
                            : `Rp ${change.toLocaleString('id-ID')}`}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Tombol Eksekusi Pembayaran */}
                  <div className="flex flex-col gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleExecutePayment}
                      disabled={
                        isProcessing ||
                        bills.length === 0 ||
                        currentBill.isAllServed === false ||
                        (paymentMethod === 'Tunai' && isChangeNegative)
                      }
                      className={`w-full py-3 px-4 rounded-xl text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer ${
                        currentBill.isAllServed === false || (paymentMethod === 'Tunai' && isChangeNegative)
                          ? 'bg-[#847374] opacity-60 cursor-not-allowed'
                          : 'bg-[#3d1018] hover:bg-[#58252c] active:scale-[0.99]'
                      }`}
                    >
                      {isProcessing ? (
                        <>
                          <span className="material-symbols-outlined text-[18px] animate-spin">
                            sync
                          </span>
                          <span>Memproses Pembayaran...</span>
                        </>
                      ) : currentBill.isAllServed === false ? (
                        <>
                          <span className="material-symbols-outlined text-[18px]">skillet</span>
                          <span>Tunggu Masakan Disajikan Dapur</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[18px]">check_circle</span>
                          <span>
                            Konfirmasi Pembayaran (Rp {currentBill.total.toLocaleString('id-ID')})
                          </span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setMobileDetailOpen(false)}
                      className="w-full py-2 rounded-lg text-xs font-semibold text-[#847374] hover:bg-[#f6f3ee] cursor-pointer transition-colors"
                    >
                      Batal &amp; Kembali ke Antrean
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
