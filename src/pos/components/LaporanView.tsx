import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { today } from '../../lib/domain';
import { fetchPaid } from '../../lib/report';
import { TransactionRecord } from '../types';
import { CustomDatePicker } from './CustomDatePicker';

const formatIDDate = (isoStr: string) => {
  if (!isoStr) return '';
  const parts = isoStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoStr;
};

export const LaporanView: React.FC = () => {
  const { transactions, showToast, openReceiptModal, storeSettings } = useApp();
  const todayStr = today();

  const drawerModal = storeSettings.drawerInitialCash ?? 200000;

  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [methodFilter, setMethodFilter] = useState('Semua metode');
  const [typeFilter, setTypeFilter] = useState('Dine in & Take away');
  const [customRangeTrx, setCustomRangeTrx] = useState<TransactionRecord[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getDaysAgo = (days: number): string => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
  };

  const handlePreset = (preset: 'today' | '7days' | '30days' | '1year') => {
    if (preset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === '7days') {
      setStartDate(getDaysAgo(6));
      setEndDate(todayStr);
    } else if (preset === '30days') {
      setStartDate(getDaysAgo(29));
      setEndDate(todayStr);
    } else if (preset === '1year') {
      setStartDate(getDaysAgo(364));
      setEndDate(todayStr);
    }
  };

  const activeTransactions = customRangeTrx !== null ? customRangeTrx : transactions;

  const filteredTransactions = activeTransactions.filter((t) => {
    if (methodFilter !== 'Semua metode' && t.method !== methodFilter) return false;
    if (typeFilter === 'Dine in saja' && t.typeMeja.toLowerCase().includes('take away')) return false;
    if (typeFilter === 'Take away saja' && !t.typeMeja.toLowerCase().includes('take away')) return false;
    return true;
  });

  const totalPenjualan = filteredTransactions.reduce((acc, t) => acc + t.total, 0);
  const totalSubtotal = filteredTransactions.reduce((acc, t) => acc + t.subtotal, 0);
  const totalPajak = filteredTransactions.reduce((acc, t) => acc + t.tax, 0);
  const avgTransaksi = Math.round(totalPenjualan / (filteredTransactions.length || 1));

  const tunaiTrx = filteredTransactions.filter((t) => t.method === 'Tunai');
  const qrisTrx = filteredTransactions.filter((t) => t.method === 'QRIS');
  const debitTrx = filteredTransactions.filter((t) => t.method === 'Kartu Debit');
  const tunaiTotal = tunaiTrx.reduce((acc, t) => acc + t.total, 0);
  const qrisTotal = qrisTrx.reduce((acc, t) => acc + t.total, 0);
  const debitTotal = debitTrx.reduce((acc, t) => acc + t.total, 0);

  const tunaiPct = totalPenjualan ? Math.round((tunaiTotal / totalPenjualan) * 1000) / 10 : 0;
  const qrisPct = totalPenjualan ? Math.round((qrisTotal / totalPenjualan) * 1000) / 10 : 0;
  const debitPct = totalPenjualan ? Math.round((debitTotal / totalPenjualan) * 1000) / 10 : 0;

  const handleApplyFilter = async () => {
    setIsLoading(true);
    try {
      const dbMethod =
        methodFilter === 'Tunai'
          ? 'cash'
          : methodFilter === 'QRIS'
          ? 'qris'
          : methodFilter === 'Kartu Debit'
          ? 'debit'
          : 'all';
      const rows = await fetchPaid(startDate, endDate, dbMethod);
      if (rows && rows.length > 0) {
        const mapped: TransactionRecord[] = rows.map((r, idx) => {
          const hhmm = new Date(r.at)
            .toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })
            .replace('.', ':');
          return {
            id: `rep-${idx}-${r.no}`,
            code: `#${r.no}`,
            time: hhmm,
            at: r.at,
            typeMeja: r.table ? `Meja ${String(r.table).padStart(2, '0')}` : 'Bawa Pulang',
            source: r.src === 'qr' ? 'QR meja' : 'Manual',
            method: r.method === 'cash' ? 'Tunai' : r.method === 'qris' ? 'QRIS' : 'Kartu Debit',
            subtotal: r.subtotal,
            tax: r.total - r.subtotal,
            total: r.total,
            status: 'Lunas',
          };
        });
        setCustomRangeTrx(mapped);
      } else {
        setCustomRangeTrx([]);
      }
      showToast(`Filter laporan diterapkan (${startDate} s/d ${endDate})`, 'success');
    } catch (e) {
      console.warn('Laporan fetchPaid error:', e);
      showToast('Memuat laporan lokal aktif', 'info');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Kode', 'Waktu', 'Tipe/Meja', 'Sumber', 'Metode', 'Subtotal', 'Pajak', 'Total', 'Status'];
    const rows = filteredTransactions.map((t) => [
      t.code,
      t.time,
      `"${t.typeMeja}"`,
      t.source,
      t.method,
      t.subtotal,
      t.tax,
      t.total,
      t.status,
    ]);

    const summaryRows = [
      [''],
      ['=== RINGKASAN LAPORAN ===', '', '', '', '', '', '', '', ''],
      ['Total Penjualan Lunas', '', '', '', '', '', '', totalPenjualan, ''],
      ['Jumlah Transaksi', '', '', '', '', '', '', `${filteredTransactions.length} struk`, ''],
      ['Rata-rata Transaksi', '', '', '', '', '', '', avgTransaksi, ''],
      [`Total ${storeSettings.taxName || 'PB1 (Pajak Restoran)'}`, '', '', '', '', '', '', storeSettings.enableTax === false ? 0 : totalPajak, ''],
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(',')), ...summaryRows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Rawon_Gusti_${startDate}_sd_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Laporan transaksi berhasil diunduh dalam format CSV', 'success');
  };

  // Dynamic Trend Buckets:
  // - Hari ini (startDate === endDate): Sesuai jam operasional outlet
  // - Minggu ini (diffDays <= 7): 7 Hari
  // - Bulan ini (diffDays <= 31): Mingguan (Mg 1 s/d Mg 5)
  // - Tahun ini (diffDays > 31): Bulanan (Januari s/d Desember)
  const trendBuckets = useMemo(() => {
    const diffDays = Math.max(
      1,
      Math.round(
        (new Date(endDate).getTime() - new Date(startDate).getTime()) /
          (1000 * 60 * 60 * 24)
      ) + 1
    );

    const isDayMode = startDate === endDate;
    const isWeekMode = !isDayMode && diffDays <= 7;
    const isMonthMode = !isDayMode && diffDays > 7 && diffDays <= 31;

    if (isDayMode) {
      // 1. Sesuai jam operasional
      const openH =
        parseInt((storeSettings?.openHour || '08:00').split(':')[0], 10) || 8;
      const closeH =
        parseInt((storeSettings?.closeHour || '22:00').split(':')[0], 10) || 22;
      const startH = Math.min(openH, 20);
      const endH = Math.max(closeH, startH + 4);

      const step = 2;
      const buckets: { label: string; start: number; end: number; amount: number }[] = [];
      for (let h = startH; h < endH; h += step) {
        const nextH = Math.min(h + step, endH);
        buckets.push({
          label: `${String(h).padStart(2, '0')}:00–${String(nextH).padStart(2, '0')}:00`,
          start: h,
          end: nextH,
          amount: 0,
        });
      }

      filteredTransactions.forEach((t) => {
        const dt = t.at ? new Date(t.at) : null;
        if (dt) {
          const hour = Number(
            dt.toLocaleTimeString('id-ID', {
              hour: '2-digit',
              hour12: false,
              timeZone: 'Asia/Jakarta',
            })
          );
          const match = buckets.find((b) => hour >= b.start && hour < b.end);
          if (match) {
            match.amount += t.total;
          } else if (hour < startH && buckets.length > 0) {
            buckets[0].amount += t.total;
          } else if (hour >= endH && buckets.length > 0) {
            buckets[buckets.length - 1].amount += t.total;
          }
        }
      });
      return buckets;
    }

    if (isWeekMode) {
      // 2. 7 Hari
      const buckets: { label: string; dateStr: string; amount: number }[] = [];
      const cur = new Date(startDate);
      const end = new Date(endDate);
      while (cur <= end && buckets.length < 7) {
        const yyyy = cur.getFullYear();
        const mm = String(cur.getMonth() + 1).padStart(2, '0');
        const dd = String(cur.getDate()).padStart(2, '0');
        const dStr = `${yyyy}-${mm}-${dd}`;
        const dayName = cur.toLocaleDateString('id-ID', { weekday: 'short' });
        buckets.push({
          label: `${dayName} ${dd}`,
          dateStr: dStr,
          amount: 0,
        });
        cur.setDate(cur.getDate() + 1);
      }

      filteredTransactions.forEach((t) => {
        const dStr = t.at
          ? new Date(t.at).toLocaleDateString('sv-SE', {
              timeZone: 'Asia/Jakarta',
            })
          : '';
        const match = buckets.find((b) => b.dateStr === dStr);
        if (match) {
          match.amount += t.total;
        }
      });
      return buckets;
    }

    if (isMonthMode) {
      // 3. Cukup minggu saja (Minggu 1 s/d Minggu 5)
      const buckets = [
        { label: 'Mg 1 (1–7)', shortLabel: 'Mg 1', startDay: 1, endDay: 7, amount: 0 },
        { label: 'Mg 2 (8–14)', shortLabel: 'Mg 2', startDay: 8, endDay: 14, amount: 0 },
        { label: 'Mg 3 (15–21)', shortLabel: 'Mg 3', startDay: 15, endDay: 21, amount: 0 },
        { label: 'Mg 4 (22–28)', shortLabel: 'Mg 4', startDay: 22, endDay: 28, amount: 0 },
        { label: 'Mg 5 (29–31)', shortLabel: 'Mg 5', startDay: 29, endDay: 31, amount: 0 },
      ];

      filteredTransactions.forEach((t) => {
        const dt = t.at ? new Date(t.at) : null;
        if (dt) {
          const day = dt.getDate();
          const match = buckets.find(
            (b) => day >= b.startDay && day <= b.endDay
          );
          if (match) {
            match.amount += t.total;
          }
        }
      });
      return buckets;
    }

    // 4. Per Bulan (Januari s/d Desember)
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'Mei',
      'Jun',
      'Jul',
      'Ags',
      'Sep',
      'Okt',
      'Nov',
      'Des',
    ];
    const buckets = monthNames.map((name) => ({
      label: name,
      amount: 0,
    }));

    filteredTransactions.forEach((t) => {
      const dt = t.at ? new Date(t.at) : null;
      if (dt) {
        const m = dt.getMonth();
        if (buckets[m]) {
          buckets[m].amount += t.total;
        }
      }
    });
    return buckets;
  }, [
    filteredTransactions,
    startDate,
    endDate,
    storeSettings?.openHour,
    storeSettings?.closeHour,
  ]);

  const maxBucket = Math.max(...trendBuckets.map((b) => b.amount), 0);

  return (
    <div className="flex flex-col w-full p-4 sm:p-6 lg:p-8 space-y-5 max-w-[1540px] mx-auto pb-4 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-end gap-4 pb-1 border-b border-[#ebe8e3]">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Ekspor CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center px-3.5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#3d1018] hover:bg-[#58252c] transition-colors cursor-pointer shadow-xs"
          >
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-[#ebe8e3] space-y-3">
        {/* Presets */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[11px] font-semibold text-[#847374] uppercase tracking-wider mr-1">
            Pilihan Periode:
          </span>
          <div className="inline-flex items-center bg-[#f6f3ee] p-0.5 rounded-xl border border-[#ebe8e3]">
            {[
              { id: 'today', label: '1 Hari' },
              { id: '7days', label: '1 Minggu' },
              { id: '30days', label: '1 Bulan' },
              { id: '1year', label: '1 Tahun' },
            ].map((p) => {
              const active =
                (p.id === 'today' && startDate === todayStr && endDate === todayStr) ||
                (p.id === '7days' && startDate === getDaysAgo(6) && endDate === todayStr) ||
                (p.id === '30days' && startDate === getDaysAgo(29) && endDate === todayStr) ||
                (p.id === '1year' && startDate === getDaysAgo(364) && endDate === todayStr);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePreset(p.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? 'bg-[#3d1018] text-white shadow-xs'
                      : 'text-[#524344] hover:text-[#1c1c19] hover:bg-white/60'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 items-end text-xs pt-1 border-t border-[#ebe8e3]">
          <div>
            <label className="block text-[11px] font-semibold text-[#524344] mb-1">Tanggal Mulai</label>
            <CustomDatePicker
              id="laporan-date-start"
              value={startDate}
              max={endDate}
              onChange={(iso) => setStartDate(iso)}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#524344] mb-1">Tanggal Akhir</label>
            <CustomDatePicker
              id="laporan-date-end"
              value={endDate}
              min={startDate}
              max={todayStr}
              onChange={(iso) => setEndDate(iso)}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#524344] mb-1">Metode Pembayaran</label>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-[#ebe8e3] bg-[#f6f3ee] text-[#1c1c19] outline-none focus:border-[#3d1018] cursor-pointer"
            >
              <option value="Semua metode">Semua Metode</option>
              <option value="Tunai">Tunai</option>
              <option value="QRIS">QRIS</option>
              <option value="Kartu Debit">Kartu Debit</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#524344] mb-1">Tipe Pesanan</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-[#ebe8e3] bg-[#f6f3ee] text-[#1c1c19] outline-none focus:border-[#3d1018] cursor-pointer"
            >
              <option value="Dine in & Take away">Dine in &amp; Take away</option>
              <option value="Dine in saja">Dine in Saja</option>
              <option value="Take away saja">Take away Saja</option>
            </select>
          </div>

          <div>
            <button
              type="button"
              disabled={isLoading}
              onClick={handleApplyFilter}
              className="w-full h-[34px] px-3 bg-[#3d1018] hover:bg-[#58252c] text-white font-bold rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-center disabled:opacity-60"
            >
              <span>{isLoading ? 'Memuat...' : 'Terapkan Filter'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Compact Summary Metrics (Vertikal di Mobile, Horizontal di Desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#ebe8e3] bg-white p-3 sm:p-3.5 rounded-xl border border-[#ebe8e3]">
        <div className="flex items-center justify-between sm:flex-col sm:items-start py-2.5 sm:py-0 sm:px-2 first:pt-0 sm:first:pt-0 last:pb-0 sm:last:pb-0">
          <span className="text-[11px] font-semibold text-[#847374] uppercase tracking-wider">Total Penjualan Lunas</span>
          <div className="text-base sm:text-xl font-bold font-serif text-[#1c1c19] sm:mt-0.5 tabular-nums">
            Rp {totalPenjualan.toLocaleString('id-ID')}
          </div>
        </div>

        <div className="flex items-center justify-between sm:flex-col sm:items-start py-2.5 sm:py-0 sm:px-2 first:pt-0 sm:first:pt-0 last:pb-0 sm:last:pb-0">
          <span className="text-[11px] font-semibold text-[#847374] uppercase tracking-wider">Jumlah Transaksi</span>
          <div className="text-base sm:text-xl font-bold font-serif text-[#1c1c19] sm:mt-0.5 tabular-nums">
            {filteredTransactions.length} <span className="text-xs font-normal text-[#847374]">struk</span>
          </div>
        </div>

        <div className="flex items-center justify-between sm:flex-col sm:items-start py-2.5 sm:py-0 sm:px-2 first:pt-0 sm:first:pt-0 last:pb-0 sm:last:pb-0">
          <span className="text-[11px] font-semibold text-[#847374] uppercase tracking-wider">Rata-rata</span>
          <div className="text-base sm:text-xl font-bold font-serif text-[#1c1c19] sm:mt-0.5 tabular-nums">
            Rp {avgTransaksi.toLocaleString('id-ID')}
          </div>
        </div>

        <div className="flex items-center justify-between sm:flex-col sm:items-start py-2.5 sm:py-0 sm:px-2 first:pt-0 sm:first:pt-0 last:pb-0 sm:last:pb-0">
          <span className="text-[11px] font-semibold text-[#847374] uppercase tracking-wider">
            {storeSettings.taxName || 'Pajak Restoran (PB1)'} {storeSettings.enableTax === false ? '(Nonaktif)' : ''}
          </span>
          <div className="text-base sm:text-xl font-bold font-serif text-[#3d1018] sm:mt-0.5 tabular-nums">
            {storeSettings.enableTax === false ? 'Rp 0' : `Rp ${totalPajak.toLocaleString('id-ID')}`}
          </div>
        </div>
      </div>

      {/* Analytics: Tren & Breakdown Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trend Section */}
        <div className="lg:col-span-2 bg-white p-4 rounded-xl border border-[#ebe8e3] flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-[#ebe8e3]">
            <div>
              <h3 className="text-xs font-bold text-[#1c1c19] uppercase tracking-wider">Tren Penjualan</h3>
              <p className="text-[11px] text-[#847374] mt-0.5">
                Periode: {startDate === endDate ? formatIDDate(startDate) : `${formatIDDate(startDate)} s/d ${formatIDDate(endDate)}`}
              </p>
            </div>
            <span className="text-[11px] font-semibold text-[#3d1018] tabular-nums">
              Total Rp {totalPenjualan.toLocaleString('id-ID')}
            </span>
          </div>

          <div className="pt-6 pb-2">
            <div className="w-full">
              {/* Area Batang Grafik: Seluruh batang memiliki dasar baseline horizontal rata */}
              <div className="h-32 w-full flex items-end justify-between gap-1 sm:gap-2 px-1 sm:px-2 border-b border-[#ebe8e3] pb-1">
                {trendBuckets.map((bucket, i) => {
                  const heightPx = maxBucket > 0 ? Math.max(6, Math.round((bucket.amount / maxBucket) * 90)) : 4;
                  const hasSales = bucket.amount > 0;
                  return (
                    <div key={i} className="flex-1 min-w-0 flex flex-col items-center gap-1 group">
                      <div className="h-4 flex items-center justify-center">
                        {hasSales ? (
                          <span className="text-[9px] sm:text-[10px] font-bold text-[#3d1018] tabular-nums whitespace-nowrap">
                            <span className="sm:hidden">
                              {bucket.amount >= 1_000_000 ? `${(bucket.amount / 1_000_000).toFixed(1)}jt` : bucket.amount >= 1_000 ? `${Math.round(bucket.amount / 1_000)}rb` : bucket.amount}
                            </span>
                            <span className="hidden sm:inline">Rp{bucket.amount.toLocaleString('id-ID')}</span>
                          </span>
                        ) : trendBuckets.length <= 7 ? (
                          <span className="text-[9px] sm:text-[10px] text-[#847374] tabular-nums whitespace-nowrap">
                            Rp0
                          </span>
                        ) : null}
                      </div>
                      <div
                        style={{ height: `${heightPx}px` }}
                        className={`w-full ${trendBuckets.length > 7 ? 'max-w-[18px] sm:max-w-[32px]' : 'max-w-[36px] sm:max-w-[44px]'} rounded-t transition-all ${
                          hasSales ? 'bg-[#58252c] group-hover:bg-[#3d1018]' : 'bg-[#f0ede9]'
                        }`}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Area Label Tanggal / Periode: Rata sempurna dengan tinggi tetap */}
              <div className="w-full flex justify-between gap-1 px-1 sm:px-2 pt-2.5">
                {trendBuckets.map((bucket, i) => (
                  <div key={i} className="flex-1 text-center min-w-0 h-5 flex items-center justify-center">
                    <span
                      className="text-[9px] sm:text-[11px] text-[#524344] font-medium whitespace-nowrap truncate block"
                      title={bucket.label}
                    >
                      <span className="hidden sm:inline">{bucket.label}</span>
                      <span className="sm:hidden">{(bucket as any).shortLabel || bucket.label}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="bg-white p-4 rounded-xl border border-[#ebe8e3] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#ebe8e3]">
              <h3 className="text-xs font-bold text-[#1c1c19] uppercase tracking-wider">Komposisi Pembayaran</h3>
              <span className="text-[11px] text-[#847374]">{filteredTransactions.length} struk</span>
            </div>

            {/* Proportion Bar */}
            <div className="w-full h-2.5 flex rounded-full overflow-hidden mt-3 bg-[#f0ede9]">
              <div className="bg-[#58252c] h-full" style={{ width: `${tunaiPct}%` }} />
              <div className="bg-[#fc934f] h-full" style={{ width: `${qrisPct}%` }} />
              <div className="bg-[#0284c7] h-full" style={{ width: `${debitPct}%` }} />
            </div>

            <div className="mt-3.5 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#58252c] shrink-0" />
                  <span className="text-[#524344]">
                    Tunai ({tunaiTrx.length} struk - {tunaiPct}%)
                  </span>
                </div>
                <span className="font-semibold text-[#1c1c19] tabular-nums">
                  Rp {tunaiTotal.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#fc934f] shrink-0" />
                  <span className="text-[#524344]">
                    QRIS ({qrisTrx.length} struk - {qrisPct}%)
                  </span>
                </div>
                <span className="font-semibold text-[#1c1c19] tabular-nums">
                  Rp {qrisTotal.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#994703] shrink-0" />
                  <span className="text-[#524344]">
                    Kartu Debit ({debitTrx.length} struk - {debitPct}%)
                  </span>
                </div>
                <span className="font-semibold text-[#1c1c19] tabular-nums">
                  Rp {debitTotal.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-white rounded-xl border border-[#ebe8e3] overflow-hidden shadow-2xs">
        <div className="p-3.5 border-b border-[#ebe8e3] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold text-[#1c1c19] uppercase tracking-wider">Rincian Transaksi Selesai</h3>
            <span className="text-[11px] text-[#847374]">
              {startDate === endDate ? formatIDDate(startDate) : `${formatIDDate(startDate)} s/d ${formatIDDate(endDate)}`}
            </span>
          </div>

          {/* Saldo Kas di Drawer Laci (Modular: disembunyikan jika enableDrawerCash false) */}
          {storeSettings.enableDrawerCash !== false && (
            <div className="flex items-center gap-3 bg-[#fcf9f4] px-3 py-1.5 rounded-xl border border-[#ebe8e3] text-xs">
              <div className="flex items-center gap-1.5 text-[#524344]">
                <span className="material-symbols-outlined text-[17px] text-[#994703]">point_of_sale</span>
                <span className="font-semibold">Laci Kasir (Drawer):</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#847374]">Modal: <strong className="text-[#1c1c19]">Rp {drawerModal.toLocaleString('id-ID')}</strong></span>
                <span className="text-[#c5bcb5]">•</span>
                <span className="text-[#847374]">Tunai: <strong className="text-[#994703]">+Rp {tunaiTotal.toLocaleString('id-ID')}</strong></span>
                <span className="text-[#c5bcb5]">•</span>
                <span className="bg-white px-2 py-0.5 rounded-md border border-[#ebe8e3] font-bold text-[#3d1018] tabular-nums">
                  Total Drawer: Rp {(drawerModal + tunaiTotal).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Table View (Tampil pada layar >= md) */}
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f6f3ee] border-b border-[#ebe8e3] text-[11px] font-bold text-[#847374] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3.5">No. Struk</th>
                <th className="py-2.5 px-3">Waktu</th>
                <th className="py-2.5 px-3.5">Meja</th>
                <th className="py-2.5 px-3">Sumber</th>
                <th className="py-2.5 px-3">Metode</th>
                <th className="py-2.5 px-3.5 text-right">Subtotal</th>
                <th className="py-2.5 px-3.5 text-right">
                  {storeSettings.taxName || 'PB1'} ({storeSettings.enableTax === false ? '0%' : `${storeSettings.taxRate ?? 10}%`})
                </th>
                <th className="py-2.5 px-3.5 text-right">Total Bayar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebe8e3]">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-[#847374]">
                    Tidak ada data transaksi yang sesuai dengan filter tanggal atau metode ini.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((trx) => (
                  <tr key={trx.id} className="hover:bg-[#fcfaf7] transition-colors">
                    <td className="py-2.5 px-3.5 font-semibold text-[#1c1c19]">{trx.code}</td>
                    <td className="py-2.5 px-3 text-[#524344] font-mono text-[11px]">{trx.time}</td>
                    <td className="py-2.5 px-3.5 font-medium text-[#1c1c19]">{trx.typeMeja}</td>
                    <td className="py-2.5 px-3 text-[#847374] text-[11px]">{trx.source}</td>
                    <td className="py-2.5 px-3">
                      <span className="text-xs font-medium text-[#524344]">
                        {trx.method}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-right text-[#524344] tabular-nums">
                      Rp {trx.subtotal.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2.5 px-3.5 text-right text-[#847374] tabular-nums text-[11px]">
                      Rp {trx.tax.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-bold text-[#1c1c19] tabular-nums">
                      Rp {trx.total.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List View (Tampil pada layar < md, tanpa scroll samping) */}
        <div className="md:hidden divide-y divide-[#ebe8e3]">
          {filteredTransactions.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#847374] px-4">
              Tidak ada data transaksi yang sesuai dengan filter tanggal atau metode ini.
            </div>
          ) : (
            filteredTransactions.map((trx) => {
              const bill = trx.billData || {
                id: trx.id,
                billNumber: trx.code.replace('#', ''),
                tableNumber: trx.typeMeja.replace('Meja ', ''),
                customerName: 'Pelanggan',
                guestCount: 1,
                itemCount: 1,
                items: [{ name: 'Pesanan Meja Restoran', quantity: 1, price: trx.subtotal }],
                subtotal: trx.subtotal,
                serviceFee: trx.billData?.serviceFee ?? (trx.total > trx.subtotal + trx.tax ? (trx.total - trx.subtotal - trx.tax) : 0),
                tax: trx.tax,
                total: trx.total,
                requestedAt: trx.time,
                elapsedMinutesAgo: 0,
                waiterName: trx.source,
                openedAtTime: `${trx.time} WIB`,
                status: 'lunas',
                paymentMethod: trx.method.toLowerCase() as any,
                paidAtTime: `${trx.at ? new Date(trx.at).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''} ${trx.time} WIB`,
              };

              return (
                <div key={trx.id} className="p-3.5 space-y-2 hover:bg-[#fcfaf7] transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-[#1c1c19]">{trx.code}</span>
                      <span className="text-[#847374] text-[11px] font-mono">• {trx.time} WIB</span>
                    </div>
                    <span className="text-xs font-medium text-[#524344]">
                      {trx.method}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-0.5">
                    <div>
                      <span className="font-medium text-xs text-[#1c1c19] block">{trx.typeMeja}</span>
                      <span className="text-[11px] text-[#847374]">
                        Subtotal Rp {trx.subtotal.toLocaleString('id-ID')}
                        {storeSettings.enableTax !== false && ` • PB1 Rp ${trx.tax.toLocaleString('id-ID')}`}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-sm text-[#1c1c19] tabular-nums">
                        Rp {trx.total.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
