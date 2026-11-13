import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BillItem, SplitPaymentDetail } from '../types';

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
    cashierShift,
    openCashierShift,
    closeCashierShift,
    playDingSound,
  } = useApp();

  const [queueTab, setQueueTab] = useState<'unpaid' | 'history'>('unpaid');
  const [selectedHistoryBill, setSelectedHistoryBill] = useState<BillItem | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'QRIS' | 'Kartu Debit' | 'Split Payment'>('Tunai');
  const [cashTendered, setCashTendered] = useState<number>(200000);
  const [autoPrintReceipt, setAutoPrintReceipt] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showQrisCode, setShowQrisCode] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Split payment state
  const [splitMethod1, setSplitMethod1] = useState<'Tunai' | 'QRIS' | 'Kartu Debit'>('Tunai');
  const [splitAmount1, setSplitAmount1] = useState<number>(0);
  const [splitMethod2, setSplitMethod2] = useState<'Tunai' | 'QRIS' | 'Kartu Debit'>('QRIS');

  const handleSplitNumpad = (val: string) => {
    const cur = String(splitAmount1 || 0);
    const nextStr = cur === '0' ? val : cur + val;
    const nextNum = parseInt(nextStr, 10) || 0;
    setSplitAmount1(Math.min(currentBill.total, nextNum));
  };

  const handleSplitBackspace = () => {
    const cur = String(splitAmount1 || 0);
    if (cur.length <= 1) {
      setSplitAmount1(0);
    } else {
      setSplitAmount1(parseInt(cur.slice(0, -1), 10) || 0);
    }
  };

  // Modal Buka & Tutup Kasir State
  const [showBukaKasirModal, setShowBukaKasirModal] = useState<boolean>(false);
  const [modalAwalInput, setModalAwalInput] = useState<number>(200000);
  const [showTutupKasirModal, setShowTutupKasirModal] = useState<boolean>(false);
  const [showShiftSlipModal, setShowShiftSlipModal] = useState<boolean>(false);
  const [physicalCashInput, setPhysicalCashInput] = useState<number>(cashierShift.totalLaci);
  const [shiftClosedSummary, setShiftClosedSummary] = useState<{ difference: number } | null>(null);

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

  // Hitung uang kembalian
  const change = cashTendered - currentBill.total;
  const isChangeNegative = change < 0;

  // Split calculation
  const splitAmount2 = Math.max(0, currentBill.total - splitAmount1);

  const handleCashPreset = (amount: number) => {
    setCashTendered(amount);
  };

  const handleNumpad = (val: string) => {
    let str = cashTendered.toString();
    if (str === '0') str = '';
    str += val;
    setCashTendered(parseInt(str, 10) || 0);
  };

  const handleBackspace = () => {
    const str = cashTendered.toString();
    if (str.length > 1) {
      setCashTendered(parseInt(str.slice(0, -1), 10) || 0);
    } else {
      setCashTendered(0);
    }
  };

  const handleExecutePayment = () => {
    if (currentBill.isAllServed === false) {
      showToast('Tidak bisa bayar! Masih ada pesanan di dapur yang belum disajikan.', 'warning');
      return;
    }

    if (paymentMethod === 'Tunai' && isChangeNegative) {
      showToast('Nominal uang tunai kurang dari total tagihan!', 'warning');
      return;
    }

    if (paymentMethod === 'Split Payment' && splitAmount1 + splitAmount2 !== currentBill.total) {
      showToast('Total nominal pecah pembayaran harus sama dengan total tagihan!', 'warning');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      if (paymentMethod === 'Split Payment') {
        const splitDetail: SplitPaymentDetail = {
          method1: splitMethod1,
          amount1: splitAmount1,
          method2: splitMethod2,
          amount2: splitAmount2,
        };
        settlePayment(currentBill.id, 'Split Payment', currentBill.total, splitDetail);
      } else {
        settlePayment(currentBill.id, paymentMethod, cashTendered);
      }
    }, 250);
  };

  const handleManualRefresh = () => {
    refresh();
    showToast('Daftar tagihan kasir diperbarui', 'info');
  };

  // Preset pecahan uang tunai dinamis berbasis total tagihan
  const billTotal = currentBill.total;
  const next50k = Math.ceil(billTotal / 50000) * 50000;
  const next100k = Math.ceil(billTotal / 100000) * 100000;
  const dynamicPresets = Array.from(
    new Set([
      billTotal,
      next50k > billTotal ? next50k : billTotal + 50000,
      next100k > billTotal ? next100k : billTotal + 100000,
      next100k + 50000,
    ])
  ).filter((val) => val >= billTotal).slice(0, 4);

  return (
    <div className="flex flex-col w-full pb-20 md:pb-8 max-w-[1600px] mx-auto px-4 sm:px-6 pt-3">
      {/* Header Halaman & Bar Laci Kas Kompak Menyatu */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 mb-4 border-b border-[#ebe8e3]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1c1c19] tracking-tight">
            Checkout &amp; Pembayaran
          </h1>
          <p className="text-xs text-[#524344] mt-0.5">
            Penyelesaian transaksi santap di tempat, pelunasan tagihan, dan cetak struk kasir.
          </p>
        </div>

        {/* Status Laci Kas & Aksi Shift Kasir (Menyatu Kompak) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Kapsul Kompak Status Laci */}
          <div className="flex items-center gap-2 bg-[#3d1018] text-white px-3 py-1.5 rounded-xl border border-[#58252c] text-xs shadow-xs">
            <span className="material-symbols-outlined text-[16px] text-[#fc934f]">point_of_sale</span>
            <div className="flex items-center gap-2.5">
              <div>
                <span className="text-[10px] text-[#ffdadc]/70 block leading-none">Modal</span>
                <span className="font-bold text-white text-xs tabular-nums">
                  Rp {cashierShift.modalAwal.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="h-4 w-px bg-white/20"></div>
              <div>
                <span className="text-[10px] text-[#ffdadc]/70 block leading-none">Masuk</span>
                <span className="font-bold text-[#fc934f] text-xs tabular-nums">
                  +{cashierShift.kasMasuk.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="h-4 w-px bg-white/20"></div>
              <div>
                <span className="text-[10px] text-[#ffdadc]/70 block leading-none">Total Laci</span>
                <span className="font-bold text-white text-xs tabular-nums">
                  Rp {cashierShift.totalLaci.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (cashierShift.isOpen) {
                setPhysicalCashInput(cashierShift.totalLaci);
                setShowTutupKasirModal(true);
              } else {
                setModalAwalInput(200000);
                setShowBukaKasirModal(true);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#994703] text-white text-xs font-bold hover:bg-[#b05304] transition-colors cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">
              {cashierShift.isOpen ? 'lock_clock' : 'key'}
            </span>
            <span>{cashierShift.isOpen ? 'Tutup Kasir' : 'Buka Kasir'}</span>
          </button>

          <button
            type="button"
            onClick={handleManualRefresh}
            className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-white border border-[#ebe8e3] text-[#1c1c19] text-xs font-semibold hover:bg-[#f6f3ee] transition-colors cursor-pointer shadow-2xs"
            aria-label="Segarkan antrean tagihan"
          >
            <span className="material-symbols-outlined text-[16px] text-[#3d1018]">sync</span>
            <span>Segarkan</span>
          </button>
        </div>
      </div>

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

          {/* Daftar Tagihan Ringkas (Compact Horizontal List) */}
          <div className="flex flex-col gap-2">
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
                      onClick={() => setSelectedBillId(bill.id)}
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
                          className={`w-11 h-11 rounded-lg flex flex-col items-center justify-center shrink-0 font-bold ${
                            isSelected
                              ? 'bg-[#3d1018] text-white'
                              : 'bg-[#f0ede9] text-[#1c1c19]'
                          }`}
                        >
                          <span className="text-[9px] uppercase leading-none opacity-80">Meja</span>
                          <span className="text-base tabular-nums leading-tight">
                            {formatTableLabel(bill.tableNumber)}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs sm:text-sm text-[#1c1c19] truncate">
                              {bill.customerName}
                            </span>
                            {isUnserved && (
                              <span className="px-1.5 py-0.2 rounded bg-[#ffdadc] text-[#3d1018] text-[10px] font-semibold shrink-0">
                                Dapur
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#524344] mt-0.5 truncate">
                            {bill.billNumber} {bill.itemCount} menu {bill.guestCount} tamu
                          </p>
                        </div>
                      </div>

                      {/* Total & Status */}
                      <div className="text-right shrink-0">
                        <span className="font-bold text-xs sm:text-sm text-[#1c1c19] tabular-nums block">
                          Rp {bill.total.toLocaleString('id-ID')}
                        </span>
                        <span
                          className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-medium mt-0.5 ${
                            bill.status === 'minta_checkout'
                              ? 'bg-[#ffdbc9] text-[#753400]'
                              : 'bg-[#f0ede9] text-[#524344]'
                          }`}
                        >
                          {bill.status === 'minta_checkout' ? 'Minta Bayar' : 'Belum Bayar'}
                        </span>
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
                    onClick={() => setSelectedHistoryBill(bill)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#fcf9f4] border-[#3d1018] ring-1 ring-[#3d1018]'
                        : 'bg-white hover:bg-[#f6f3ee] border-[#ebe8e3]'
                    }`}
                    aria-pressed={isSelected}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-lg flex flex-col items-center justify-center shrink-0 font-bold ${
                          isSelected
                            ? 'bg-[#3d1018] text-white'
                            : 'bg-[#f0ede9] text-[#1c1c19]'
                        }`}
                      >
                        <span className="text-[9px] uppercase leading-none opacity-80">Meja</span>
                        <span className="text-base tabular-nums leading-tight">
                          {formatTableLabel(bill.tableNumber)}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs sm:text-sm text-[#1c1c19] truncate">
                            {bill.customerName}
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-[#f0ede9] text-[#3d1018] text-[10px] font-bold">
                            Lunas
                          </span>
                        </div>
                        <p className="text-[11px] text-[#524344] mt-0.5 truncate">
                          {bill.billNumber} {bill.paymentMethod?.toUpperCase() || 'TUNAI'}
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
            RIGHT AREA: PAYMENT DETAIL (7 Kolom pada Desktop)
           ========================================================================= */}
        <section
          aria-label="Detail Pembayaran Tagihan Terpilih"
          className="lg:col-span-7 bg-white rounded-xl border border-[#ebe8e3] p-4 sm:p-5 flex flex-col gap-4"
        >
          {/* Header Rincian Tagihan Terpilih */}
          <div className="flex items-start justify-between pb-3 border-b border-[#ebe8e3]">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-[#1c1c19]">
                  Meja {formatTableLabel(currentBill.tableNumber)}
                </h2>
                <span className="text-sm font-semibold text-[#524344]">
                  {currentBill.customerName}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    currentBill.status === 'lunas'
                      ? 'bg-[#f0ede9] text-[#3d1018]'
                      : currentBill.status === 'minta_checkout'
                      ? 'bg-[#ffdbc9] text-[#753400]'
                      : 'bg-[#f0ede9] text-[#524344]'
                  }`}
                >
                  {currentBill.status === 'lunas'
                    ? 'Lunas'
                    : currentBill.status === 'minta_checkout'
                    ? 'Minta Kasir'
                    : 'Belum Lunas'}
                </span>
              </div>
              <p className="text-xs text-[#847374] mt-0.5">
                ID: {currentBill.billNumber}  Pelayan: {currentBill.waiterName}  {currentBill.guestCount} Tamu
              </p>
            </div>

            <button
              type="button"
              onClick={() => openReceiptModal(currentBill)}
              className="px-2.5 py-1.5 rounded-lg border border-[#ebe8e3] bg-[#fcf9f4] hover:bg-[#f0ede9] text-[#1c1c19] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              aria-label="Pratinjau struk kasir"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              <span className="hidden sm:inline">Struk</span>
            </button>
          </div>

          {/* Alert Status Dapur Jika Masih Ada Pesanan Belum Disajikan */}
          {currentBill.isAllServed === false && currentBill.status !== 'lunas' && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-[#fcf9f4] border border-[#fc934f] text-xs text-[#3d1018] flex items-start gap-2"
            >
              <span className="material-symbols-outlined text-[18px] text-[#994703] shrink-0 mt-0.5">
                warning
              </span>
              <div>
                <strong className="block font-semibold">
                  Pesanan Belum Selesai Dimasak di Dapur
                </strong>
                <span className="text-[11px] text-[#524344]">
                  Tagihan hanya dapat dilunasi setelah seluruh menu disajikan melalui Kitchen Display.
                </span>
              </div>
            </div>
          )}

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
              <div className="p-3 rounded-lg bg-[#fcf9f4] border border-[#ebe8e3] text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#3d1018] block">
                    Transaksi Sudah Lunas
                  </span>
                  <span className="text-[11px] text-[#524344]">
                    Dibayar via {(currentBill.paymentMethod || 'Tunai').toUpperCase()}  {currentBill.paidAtTime || currentBill.requestedAt}
                  </span>
                </div>
                <span className="px-2 py-1 rounded bg-[#3d1018] text-white font-bold text-[10px]">
                  SELESAI
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['Tunai', 'QRIS', 'Kartu Debit', 'Split Payment'] as const).map((method) => {
                    const active = paymentMethod === method;
                    return (
                      <button
                        key={method}
                        type="button"
                        onClick={() => {
                          setPaymentMethod(method);
                          setShowQrisCode(method === 'QRIS');
                          if (method === 'Split Payment' && splitAmount1 === 0) {
                            setSplitAmount1(Math.round(currentBill.total / 2));
                          }
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
                            : method === 'Kartu Debit'
                            ? 'credit_card'
                            : 'call_split'}
                        </span>
                        <span className="truncate">
                          {method === 'Split Payment' ? 'Pecah Bayar' : method}
                        </span>
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
                    NMID: ID1029384756  RAWON GUSTI
                  </p>
                  <p className="text-[11px] text-[#524344]">
                    Pelanggan memindai QR dinamis di atas menggunakan aplikasi e-wallet / mobile banking.
                  </p>
                </div>
              )}

              {/* Tampilan Pecah Pembayaran (Split Payment) */}
              {paymentMethod === 'Split Payment' && (
                <div className="p-3.5 rounded-xl bg-[#fcf9f4] border border-[#ebe8e3] space-y-3">
                  <span className="text-xs font-bold text-[#3d1018] block">
                    Pecah Pembayaran (2 Metode Gabungan)
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Pembayaran 1 */}
                    <div className="p-2.5 bg-white rounded-lg border border-[#ebe8e3] space-y-1.5">
                      <label className="text-[10px] text-[#847374] font-bold uppercase block">
                        Metode 1:
                      </label>
                      <select
                        value={splitMethod1}
                        onChange={(e) => setSplitMethod1(e.target.value as any)}
                        className="w-full bg-[#fcf9f4] border border-[#ebe8e3] rounded px-2 py-1 text-xs font-bold"
                      >
                        <option value="Tunai">Tunai</option>
                        <option value="QRIS">QRIS</option>
                        <option value="Kartu Debit">Kartu Debit</option>
                      </select>
                      <label className="text-[10px] text-[#847374] font-bold uppercase block mt-1">
                        Nominal 1 (Rp):
                      </label>
                      <div className="flex items-center gap-1.5 bg-[#fcf9f4] border border-[#ebe8e3] rounded px-2 py-1">
                        <span className="text-xs font-bold text-[#847374]">Rp</span>
                        <input
                          type="number"
                          value={splitAmount1}
                          onChange={(e) => setSplitAmount1(Math.min(currentBill.total, parseInt(e.target.value, 10) || 0))}
                          className="w-full bg-transparent text-xs font-bold tabular-nums outline-none text-[#1c1c19]"
                        />
                      </div>

                      {/* Tombol Cepat Pecah / Sentuh untuk Mobile/Tablet */}
                      <div className="flex items-center gap-1 flex-wrap pt-1">
                        <button
                          type="button"
                          onClick={() => setSplitAmount1(Math.round(currentBill.total / 2))}
                          className="px-1.5 py-0.5 rounded bg-[#f6f3ee] hover:bg-[#ebe8e3] text-[10px] font-bold text-[#3d1018] cursor-pointer"
                        >
                          50%
                        </button>
                        <button
                          type="button"
                          onClick={() => setSplitAmount1((prev) => Math.min(currentBill.total, prev + 10000))}
                          className="px-1.5 py-0.5 rounded bg-[#f6f3ee] hover:bg-[#ebe8e3] text-[10px] font-bold text-[#1c1c19] cursor-pointer"
                        >
                          +10rb
                        </button>
                        <button
                          type="button"
                          onClick={() => setSplitAmount1((prev) => Math.min(currentBill.total, prev + 50000))}
                          className="px-1.5 py-0.5 rounded bg-[#f6f3ee] hover:bg-[#ebe8e3] text-[10px] font-bold text-[#1c1c19] cursor-pointer"
                        >
                          +50rb
                        </button>
                        <button
                          type="button"
                          onClick={() => setSplitAmount1(currentBill.total)}
                          className="px-1.5 py-0.5 rounded bg-[#f6f3ee] hover:bg-[#ebe8e3] text-[10px] font-bold text-[#994703] cursor-pointer"
                        >
                          Pas
                        </button>
                        <button
                          type="button"
                          onClick={() => setSplitAmount1(0)}
                          className="px-1.5 py-0.5 rounded bg-[#f6f3ee] hover:bg-red-50 text-[10px] font-bold text-red-700 cursor-pointer"
                        >
                          C
                        </button>
                      </div>

                      {/* Keypad Angka Sentuh Khusus Tablet / Layar Sentuh */}
                      <div className="grid grid-cols-4 gap-1 pt-1.5">
                        {['1', '2', '3', '000', '4', '5', '6', '00', '7', '8', '9'].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => handleSplitNumpad(val)}
                            className="h-7 rounded bg-[#f6f3ee] hover:bg-[#ebe8e3] font-bold text-[11px] text-[#1c1c19] border border-[#ebe8e3] cursor-pointer active:scale-95 transition-all"
                          >
                            {val}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={handleSplitBackspace}
                          className="h-7 rounded bg-[#f0ede9] text-[#3d1018] hover:bg-[#e0dcd8] font-bold border border-[#ebe8e3] flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                          aria-label="Hapus digit"
                        >
                          <span className="material-symbols-outlined text-[14px]">backspace</span>
                        </button>
                      </div>
                    </div>

                    {/* Pembayaran 2 */}
                    <div className="p-2.5 bg-white rounded-lg border border-[#ebe8e3] space-y-1.5">
                      <label className="text-[10px] text-[#847374] font-bold uppercase block">
                        Metode 2:
                      </label>
                      <select
                        value={splitMethod2}
                        onChange={(e) => setSplitMethod2(e.target.value as any)}
                        className="w-full bg-[#fcf9f4] border border-[#ebe8e3] rounded px-2 py-1 text-xs font-bold"
                      >
                        <option value="QRIS">QRIS</option>
                        <option value="Tunai">Tunai</option>
                        <option value="Kartu Debit">Kartu Debit</option>
                      </select>
                      <label className="text-[10px] text-[#847374] font-bold uppercase block mt-1">
                        Sisa Nominal 2 (Rp):
                      </label>
                      <div className="w-full bg-[#f0ede9] border border-[#ebe8e3] rounded px-2 py-1 text-xs font-bold tabular-nums text-[#3d1018]">
                        Rp {splitAmount2.toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#524344]">
                    Total bayar: Rp {(splitAmount1 + splitAmount2).toLocaleString('id-ID')} dari tagihan Rp {currentBill.total.toLocaleString('id-ID')}.
                  </p>
                </div>
              )}

              {/* Tampilan Tunai (Input, Preset, Numpad, Kembalian) */}
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
                        value={cashTendered.toLocaleString('id-ID')}
                        onChange={(e) => {
                          const raw = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10) || 0;
                          setCashTendered(raw);
                        }}
                        className="font-bold text-sm text-[#1c1c19] text-right outline-none w-32 tabular-nums"
                      />
                    </div>
                  </div>

                  {/* Tombol Preset Pecahan */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-[#847374] font-semibold uppercase">Pecahan:</span>
                    <button
                      type="button"
                      onClick={() => handleCashPreset(billTotal)}
                      className="px-2 py-1 rounded bg-white hover:bg-[#ebe8e3] text-xs font-semibold text-[#1c1c19] border border-[#ebe8e3] cursor-pointer"
                    >
                      Uang Pas
                    </button>
                    {dynamicPresets.slice(1).map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleCashPreset(amt)}
                        className="px-2 py-1 rounded bg-white hover:bg-[#ebe8e3] text-xs font-semibold text-[#1c1c19] border border-[#ebe8e3] cursor-pointer tabular-nums"
                      >
                        {amt.toLocaleString('id-ID')}
                      </button>
                    ))}
                  </div>

                  {/* Numpad Sentuh Cepat */}
                  <div className="grid grid-cols-4 gap-1 pt-1">
                    {['1', '2', '3', '000', '4', '5', '6', '00', '7', '8', '9'].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleNumpad(val)}
                        className="h-9 rounded-lg bg-white hover:bg-[#ebe8e3] font-bold text-xs text-[#1c1c19] border border-[#ebe8e3] cursor-pointer active:scale-95 transition-all"
                      >
                        {val}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handleBackspace}
                      className="h-9 rounded-lg bg-[#f0ede9] text-[#3d1018] hover:bg-[#e0dcd8] font-bold border border-[#ebe8e3] flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                      aria-label="Hapus digit"
                    >
                      <span className="material-symbols-outlined text-[16px]">backspace</span>
                    </button>
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

              {/* Opsi Cetak Struk */}
              <label className="flex items-center gap-2 cursor-pointer text-xs text-[#1c1c19]">
                <input
                  type="checkbox"
                  checked={autoPrintReceipt}
                  onChange={(e) => setAutoPrintReceipt(e.target.checked)}
                  className="w-4 h-4 rounded text-[#3d1018] accent-[#3d1018] cursor-pointer"
                />
                <span>Cetak struk kasir termal otomatis setelah pembayaran</span>
              </label>

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
      </div>

      {/* Modal Buka Kasir (Modal Awal Shift) */}
      {showBukaKasirModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-[#ebe8e3] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#ebe8e3]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#3d1018] text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">key</span>
                </div>
                <h3 className="font-bold text-base text-[#1c1c19]">Buka Kasir (Mulai Shift)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBukaKasirModal(false)}
                className="w-7 h-7 rounded-full bg-[#f0ede9] flex items-center justify-center text-[#524344]"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            <p className="text-xs text-[#524344] leading-relaxed">
              Masukkan nominal uang modal awal kasir di dalam laci uang sebelum memulai transaksi hari ini.
            </p>

            <div>
              <label className="text-xs font-bold text-[#1c1c19] block mb-1">
                Modal Awal Kasir:
              </label>
              <div className="flex items-center gap-2 bg-[#fcf9f4] border border-[#ebe8e3] rounded-xl px-3 py-2.5">
                <span className="font-bold text-sm text-[#524344]">Rp</span>
                <input
                  type="number"
                  value={modalAwalInput}
                  onChange={(e) => setModalAwalInput(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-transparent font-bold text-base text-[#3d1018] outline-none tabular-nums"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBukaKasirModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#f0ede9] text-[#1c1c19] text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  openCashierShift(modalAwalInput);
                  setShowBukaKasirModal(false);
                  showToast(`Shift kasir berhasil dibuka dengan modal Rp ${modalAwalInput.toLocaleString('id-ID')}`, 'success');
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#3d1018] hover:bg-[#58252c] text-white text-xs font-bold cursor-pointer shadow-xs"
              >
                Buka Kasir Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tutup Kasir / Rekonsiliasi Uang Fisik */}
      {showTutupKasirModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-[#ebe8e3] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#ebe8e3]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#3d1018] text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">lock_clock</span>
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#1c1c19]">Tutup Kasir &amp; Rekonsiliasi</h3>
                  <p className="text-[11px] text-[#524344]">Rekap Shift Kasir Hari Ini</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowTutupKasirModal(false);
                  setShiftClosedSummary(null);
                }}
                className="w-7 h-7 rounded-full bg-[#f0ede9] flex items-center justify-center text-[#524344]"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            {/* Rekap Saldo Sistem */}
            <div className="grid grid-cols-3 gap-2 text-center p-3 rounded-xl bg-[#fcf9f4] border border-[#ebe8e3] text-xs">
              <div>
                <span className="text-[10px] text-[#847374] block">Modal Awal</span>
                <span className="font-bold text-[#1c1c19] tabular-nums">
                  Rp {cashierShift.modalAwal.toLocaleString('id-ID')}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#847374] block">Kas Masuk</span>
                <span className="font-bold text-[#994703] tabular-nums">
                  +Rp {cashierShift.kasMasuk.toLocaleString('id-ID')}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#847374] block">Total di Laci</span>
                <span className="font-bold text-[#3d1018] tabular-nums">
                  Rp {cashierShift.totalLaci.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Input Hitung Uang Fisik Kasir */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1c1c19] block">
                Hitung Uang Fisik di Laci Kasir:
              </label>
              <div className="flex items-center gap-2 bg-[#fcf9f4] border border-[#ebe8e3] rounded-xl px-3 py-2.5">
                <span className="font-bold text-sm text-[#524344]">Rp</span>
                <input
                  type="number"
                  value={physicalCashInput}
                  onChange={(e) => setPhysicalCashInput(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-transparent font-bold text-base text-[#3d1018] outline-none tabular-nums"
                />
              </div>

              {/* Status Selisih */}
              <div className="flex justify-between items-center text-xs pt-1 px-1">
                <span className="text-[#524344]">Selisih Kas:</span>
                <span className={`font-bold tabular-nums ${
                  physicalCashInput - cashierShift.totalLaci === 0
                    ? 'text-[#3d1018]'
                    : physicalCashInput - cashierShift.totalLaci > 0
                    ? 'text-[#994703]'
                    : 'text-[#ba1a1a]'
                }`}>
                  {physicalCashInput - cashierShift.totalLaci === 0
                    ? 'PAS (Sesuai Sistem)'
                    : physicalCashInput - cashierShift.totalLaci > 0
                    ? `LEBIH +Rp ${(physicalCashInput - cashierShift.totalLaci).toLocaleString('id-ID')}`
                    : `KURANG -Rp ${Math.abs(physicalCashInput - cashierShift.totalLaci).toLocaleString('id-ID')}`}
                </span>
              </div>
            </div>

            {/* Rincian Transaksi Selesai Hari Ini Saja */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#524344] block">
                Transaksi Selesai Hari Ini ({recentReceipts.length} tagihan)
              </span>
              <div className="max-h-40 overflow-y-auto divide-y divide-[#ebe8e3] border border-[#ebe8e3] rounded-xl p-2 text-xs">
                {recentReceipts.length === 0 ? (
                  <p className="text-[#847374] italic text-center py-2">Belum ada transaksi selesai hari ini.</p>
                ) : (
                  recentReceipts.map((r, i) => (
                    <div key={i} className="py-1.5 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-[#1c1c19] block">{r.billNumber} (Meja {formatTableLabel(r.tableNumber)})</span>
                        <span className="text-[10px] text-[#847374]">{r.paidAtTime || r.requestedAt} • {(r.paymentMethod || 'Tunai').toUpperCase()}</span>
                      </div>
                      <span className="font-bold text-[#3d1018] tabular-nums">
                        Rp {r.total.toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Aksi Tutup Kasir & Cetak Rekap */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-[#ebe8e3]">
              <button
                type="button"
                onClick={() => {
                  setShowShiftSlipModal(true);
                }}
                className="flex-1 py-2.5 rounded-xl border border-[#ebe8e3] bg-[#fcf9f4] hover:bg-[#f0ede9] text-[#1c1c19] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                <span>Cetak Slip Rekap Shift</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const res = closeCashierShift(physicalCashInput);
                  setShiftClosedSummary(res);
                  playDingSound();
                  showToast('Shift kasir berhasil ditutup dan data rekonsiliasi tersimpan!', 'success');
                  setShowTutupKasirModal(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#3d1018] hover:bg-[#58252c] text-white text-xs font-bold cursor-pointer shadow-xs"
              >
                Tutup Shift &amp; Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cetak Slip Rekap Shift Kasir (Monokrom Hitam Putih Thermal) */}
      {showShiftSlipModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in"
        >
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative my-8 flex flex-col items-center">
            {/* Tombol Tutup */}
            <button
              type="button"
              onClick={() => setShowShiftSlipModal(false)}
              className="no-print absolute top-4 right-4 w-8 h-8 rounded-full bg-[#f0ede9] hover:bg-[#ebe8e3] flex items-center justify-center text-[#524344] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>

            {/* Slip Thermal Monokrom Hitam Putih */}
            <div className="printable-receipt-area w-full bg-white border-2 border-black p-5 rounded-lg shadow-xs font-mono text-xs text-black flex flex-col gap-3">
              {/* Header */}
              <div className="flex flex-col items-center text-center border-b-2 border-dashed border-black pb-3">
                <h3 className="font-bold text-base tracking-wider uppercase text-black">
                  RAWON GUSTI
                </h3>
                <p className="text-[10px] text-black">Surabaya, Jawa Timur</p>
                <p className="text-[9px] text-black">Jl. Pemuda No. 45 - Telp: (031) 567-8901</p>
                <span className="mt-1.5 px-3 py-0.5 border border-black text-black text-[10px] font-bold tracking-widest uppercase">
                  *** SLIP REKAP SHIFT KASIR ***
                </span>
              </div>

              {/* Informasi Shift */}
              <div className="flex flex-col gap-1 border-b-2 border-dashed border-black pb-3 text-[11px]">
                <div className="flex justify-between">
                  <span>Kasir Bertugas:</span>
                  <span className="font-bold">{currentUser?.name || cashierShift.openedBy || 'Kasir'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Buka Shift:</span>
                  <span>{new Date(cashierShift.openedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tutup Shift:</span>
                  <span>{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tanggal:</span>
                  <span>{new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                </div>
              </div>

              {/* Rekonsiliasi Kas Laci */}
              <div className="flex flex-col gap-1 border-b-2 border-dashed border-black pb-3 text-[11px]">
                <span className="font-bold uppercase tracking-wider mb-0.5">REKONSILIASI KAS LACI</span>
                <div className="flex justify-between">
                  <span>Modal Awal:</span>
                  <span>Rp {cashierShift.modalAwal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kas Masuk (Tunai):</span>
                  <span>+Rp {cashierShift.kasMasuk.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between font-bold border-t border-dotted border-black pt-1">
                  <span>Total Laci Sistem:</span>
                  <span>Rp {cashierShift.totalLaci.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Hitung Fisik Laci:</span>
                  <span>Rp {physicalCashInput.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Selisih Kas:</span>
                  <span>
                    {physicalCashInput - cashierShift.totalLaci === 0
                      ? 'PAS (Rp 0)'
                      : physicalCashInput - cashierShift.totalLaci > 0
                      ? `LEBIH (+Rp ${(physicalCashInput - cashierShift.totalLaci).toLocaleString('id-ID')})`
                      : `KURANG (-Rp ${Math.abs(physicalCashInput - cashierShift.totalLaci).toLocaleString('id-ID')})`}
                  </span>
                </div>
              </div>

              {/* RINCIAN TRANSAKSI SELESAI HARI INI */}
              <div className="flex flex-col gap-1.5 border-b-2 border-dashed border-black pb-3">
                <div className="flex justify-between font-bold text-[11px] uppercase tracking-wider">
                  <span>RINCIAN TRANSAKSI SELESAI HARI INI ({recentReceipts.length})</span>
                </div>
                {recentReceipts.length === 0 ? (
                  <p className="text-[10px] italic py-1 text-center">Belum ada transaksi selesai pada shift ini.</p>
                ) : (
                  <div className="flex flex-col gap-2 pt-1 text-[10px]">
                    {recentReceipts.map((r, i) => (
                      <div key={i} className="flex flex-col border-b border-dotted border-black pb-1">
                        <div className="flex justify-between font-bold">
                          <span>#{r.billNumber} • Meja {formatTableLabel(r.tableNumber)}</span>
                          <span>Rp {r.total.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between text-[9px]">
                          <span>{r.paidAtTime || r.requestedAt || '-'}</span>
                          <span className="uppercase font-semibold">[{r.paymentMethod || 'TUNAI'}]</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ringkasan Omset Shift */}
              <div className="flex flex-col gap-1 border-b-2 border-dashed border-black pb-3 text-[11px]">
                <div className="flex justify-between">
                  <span>Total Transaksi Selesai:</span>
                  <span className="font-bold">{recentReceipts.length} Bill</span>
                </div>
                <div className="flex justify-between font-bold text-sm pt-1 border-t border-black">
                  <span>TOTAL OMSET SHIFT:</span>
                  <span>Rp {recentReceipts.reduce((sum, r) => sum + r.total, 0).toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Tanda Tangan */}
              <div className="grid grid-cols-2 gap-4 text-center text-[10px] pt-2">
                <div>
                  <p>Kasir Bertugas</p>
                  <div className="h-8"></div>
                  <p className="border-t border-black font-bold uppercase">({currentUser?.name || cashierShift.openedBy || 'Kasir'})</p>
                </div>
                <div>
                  <p>Supervisor / Admin</p>
                  <div className="h-8"></div>
                  <p className="border-t border-black font-bold uppercase">( .................... )</p>
                </div>
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="no-print flex gap-2 w-full mt-4">
              <button
                type="button"
                onClick={() => setShowShiftSlipModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#f0ede9] hover:bg-[#ebe8e3] text-[#1c1c19] text-xs font-semibold cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl bg-[#3d1018] hover:bg-[#58252c] text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                <span>Cetak Slip Thermal</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
