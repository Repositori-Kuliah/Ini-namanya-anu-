import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { today } from '../../lib/domain';
import { fetchPaid } from '../../lib/report';
import { TransactionRecord } from '../types';
import { CustomDatePicker } from './CustomDatePicker';

const toWIBDate = (iso: string) =>
  new Date(iso).toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });

export const DashboardView: React.FC = () => {
  const { transactions, setActiveView, menuItems, storeSettings } = useApp();
  const todayStr = today();
  const [dateFrom, setDateFrom] = useState(todayStr);
  const [dateTo, setDateTo] = useState(todayStr);
  const [customRangeTrx, setCustomRangeTrx] = useState<TransactionRecord[] | null>(null);
  const [isLoadingRange, setIsLoadingRange] = useState(false);

  // Period presets
  type Period = '1hari' | '1minggu' | '1bulan' | '1tahun' | 'custom';
  const [period, setPeriod] = useState<Period>('1hari');

  const getDaysAgo = (days: number): string => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
  };

  const getYearStart = (): string => {
    const d = new Date();
    const wib = d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
    return `${wib.slice(0, 4)}-01-01`;
  };

  const handlePeriodChange = (p: Period) => {
    setPeriod(p);
    if (p === '1hari') {
      setDateFrom(todayStr);
      setDateTo(todayStr);
    } else if (p === '1minggu') {
      setDateFrom(getDaysAgo(6));
      setDateTo(todayStr);
    } else if (p === '1bulan') {
      setDateFrom(getDaysAgo(29));
      setDateTo(todayStr);
    } else if (p === '1tahun') {
      setDateFrom(getYearStart());
      setDateTo(todayStr);
    }
  };

  // If viewing past date range, query Supabase for historical records
  useEffect(() => {
    if (dateFrom === todayStr && dateTo === todayStr) {
      setCustomRangeTrx(null);
      return;
    }
    let isCurrent = true;
    setIsLoadingRange(true);
    fetchPaid(dateFrom, dateTo)
      .then((rows) => {
        if (!isCurrent) return;
        const mapped: TransactionRecord[] = rows.map((r, idx) => {
          const hhmm = new Date(r.at)
            .toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })
            .replace('.', ':');
          return {
            id: `paid-range-${idx}-${r.no}`,
            code: `#${r.no}`,
            time: hhmm,
            at: r.at,
            typeMeja: r.table ? `Meja ${String(r.table).padStart(2, '0')}` : 'Bawa Pulang',
            source: r.src === 'qr' ? 'QR meja' : 'Manual',
            method: r.method === 'cash' ? 'Tunai' : r.method === 'qris' ? 'QRIS' : 'Kartu Debit',
            subtotal: r.subtotal,
            tax: r.total - r.subtotal,
            total: r.total,
            status: 'Lunas'
          };
        });
        setCustomRangeTrx(mapped);
      })
      .catch((err) => {
        console.warn('Dashboard fetchPaid error:', err);
      })
      .finally(() => {
        if (isCurrent) setIsLoadingRange(false);
      });
    return () => {
      isCurrent = false;
    };
  }, [dateFrom, dateTo, todayStr]);

  const activeTransactions = customRangeTrx !== null ? customRangeTrx : transactions;

  const filteredTrx = useMemo(() => {
    return activeTransactions.filter((t) => {
      const d = toWIBDate(t.at ?? new Date().toISOString());
      return d >= dateFrom && d <= dateTo;
    });
  }, [activeTransactions, dateFrom, dateTo]);

  const totalPenjualan = filteredTrx.reduce((acc, t) => acc + t.total, 0);
  const totalSubtotal = filteredTrx.reduce((acc, t) => acc + t.subtotal, 0);
  const totalPajak = filteredTrx.reduce((acc, t) => acc + t.tax, 0);
  const avgTransaksi = Math.round(totalPenjualan / (filteredTrx.length || 1));

  const tunaiTrx = filteredTrx.filter((t) => t.method === 'Tunai');
  const qrisTrx = filteredTrx.filter((t) => t.method === 'QRIS');
  const debitTrx = filteredTrx.filter((t) => t.method === 'Kartu Debit');

  const tunaiTotal = tunaiTrx.reduce((acc, t) => acc + t.total, 0);
  const qrisTotal = qrisTrx.reduce((acc, t) => acc + t.total, 0);
  const debitTotal = debitTrx.reduce((acc, t) => acc + t.total, 0);

  const tunaiPct = totalPenjualan ? Math.round((tunaiTotal / totalPenjualan) * 1000) / 10 : 0;
  const qrisPct = totalPenjualan ? Math.round((qrisTotal / totalPenjualan) * 1000) / 10 : 0;
  const debitPct = totalPenjualan ? Math.round((debitTotal / totalPenjualan) * 1000) / 10 : 0;

  const isToday = dateFrom === todayStr && dateTo === todayStr;
  const dateLabel = isToday
    ? 'Hari ini'
    : dateFrom === dateTo
    ? new Date(dateFrom).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    : `${new Date(dateFrom).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} – ${new Date(dateTo).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  // Dynamic Sales Trend:
  // - 1 Hari / Hari ini: Sesuai jam operasional outlet
  // - 1 Minggu / <= 7 Hari: 7 Hari
  // - 1 Bulan / <= 31 Hari: Mingguan (Minggu 1, Minggu 2, dst.)
  // - 1 Tahun / > 31 Hari: Bulanan (Januari s/d Desember)
  const trendBuckets = useMemo(() => {
    const diffDays = Math.max(
      1,
      Math.round(
        (new Date(dateTo).getTime() - new Date(dateFrom).getTime()) /
          (1000 * 60 * 60 * 24)
      ) + 1
    );

    const isDayMode =
      period === '1hari' || (period === 'custom' && dateFrom === dateTo);
    const isWeekMode =
      period === '1minggu' ||
      (period === 'custom' && diffDays > 1 && diffDays <= 7);
    const isMonthMode =
      period === '1bulan' ||
      (period === 'custom' && diffDays > 7 && diffDays <= 31);

    if (isDayMode) {
      // 1. Sesuai jam operasional (contoh 08:00 - 22:00)
      const openH =
        parseInt((storeSettings?.openHour || '08:00').split(':')[0], 10) || 8;
      const closeH =
        parseInt((storeSettings?.closeHour || '22:00').split(':')[0], 10) || 22;
      const startH = Math.min(openH, 20);
      const endH = Math.max(closeH, startH + 4);

      // Interval 2 jam
      const step = 2;
      const buckets: { label: string; start: number; end: number; amount: number }[] = [];
      for (let h = startH; h < endH; h += step) {
        const nextH = Math.min(h + step, endH);
        buckets.push({
          label: `${String(h).padStart(2, '0')}–${String(nextH).padStart(2, '0')}`,
          start: h,
          end: nextH,
          amount: 0,
        });
      }

      filteredTrx.forEach((t) => {
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
      const cur = new Date(dateFrom);
      const end = new Date(dateTo);
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

      filteredTrx.forEach((t) => {
        const dStr = t.at ? toWIBDate(t.at) : '';
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

      filteredTrx.forEach((t) => {
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

    filteredTrx.forEach((t) => {
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
    filteredTrx,
    period,
    dateFrom,
    dateTo,
    storeSettings?.openHour,
    storeSettings?.closeHour,
  ]);

  const maxBucketAmount = Math.max(...trendBuckets.map((b) => b.amount), 0);

  // Dynamic Best Selling Menu Items from real transactions
  const bestSellers = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number; image?: string }>();
    filteredTrx.forEach((t) => {
      if (t.billData?.items) {
        t.billData.items.forEach((item) => {
          const existing = map.get(item.name) || {
            name: item.name,
            qty: 0,
            revenue: 0,
            image: menuItems.find((m) => m.name.toLowerCase() === item.name.toLowerCase())?.image,
          };
          existing.qty += item.quantity || 1;
          existing.revenue += (item.price || 0) * (item.quantity || 1);
          map.set(item.name, existing);
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [filteredTrx, menuItems]);

  const totalItemsSold = bestSellers.reduce((acc, curr) => acc + curr.qty, 0);

  return (
    <div className="flex flex-col w-full p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1540px] mx-auto pb-4 md:pb-8">
      {/* Top Action Bar & Period Selector */}
      <div className="flex flex-wrap items-center justify-end gap-2">

        {/* Unified Date & Period Selector (1 Hari, 1 Minggu, 1 Bulan, 1 Tahun + 1 Unified Date Picker) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Presets */}
          <div className="inline-flex items-center bg-white p-1 rounded-xl border border-[#ebe8e3] shadow-xs">
            {(
              [
                { id: '1hari', label: '1 Hari' },
                { id: '1minggu', label: '1 Minggu' },
                { id: '1bulan', label: '1 Bulan' },
                { id: '1tahun', label: '1 Tahun' },
              ] as const
            ).map((p) => {
              const active = period === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handlePeriodChange(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? 'bg-[#3d1018] text-white shadow-xs'
                      : 'text-[#524344] hover:text-[#1c1c19] hover:bg-[#f6f3ee]'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Single Date Picker Box (Kiri ke Kanan & Kalender Popover) */}
          <CustomDatePicker
            value={dateFrom}
            max={todayStr}
            align="right"
            onChange={(iso) => {
              setDateFrom(iso);
              setDateTo(iso);
              setPeriod('custom');
            }}
          />
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
            {transactions.length} <span className="text-xs font-normal text-[#847374]">struk</span>
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
            {storeSettings?.taxName || 'Pajak Restoran (PB1)'} {storeSettings?.enableTax === false ? '(Nonaktif)' : ''}
          </span>
          <div className="text-base sm:text-xl font-bold font-serif text-[#3d1018] sm:mt-0.5 tabular-nums">
            {storeSettings?.enableTax === false ? 'Rp 0' : `Rp ${totalPajak.toLocaleString('id-ID')}`}
          </div>
        </div>
      </div>

      {/* Middle Section: Chart Tren Penjualan & Metode Pembayaran */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Chart: Tren Penjualan (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-[#ebe8e3] flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-serif text-lg sm:text-xl font-bold text-[#1c1c19]">
                  Tren penjualan
                </h2>
                <p className="text-xs text-[#524344]">
                  {dateLabel} • total Rp {totalPenjualan.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            {/* Bar Chart Visualization */}
            <div className="mt-6 pt-4 pb-2">
              <div className="w-full">
                <div className="h-36 w-full flex items-end justify-between gap-1 sm:gap-3 px-1 sm:px-4 border-b border-[#ebe8e3] pb-1">
                  {trendBuckets.map((b) => {
                    const heightPx =
                      maxBucketAmount > 0
                        ? Math.max(6, Math.round((b.amount / maxBucketAmount) * 110))
                        : 4;
                    const hasSales = b.amount > 0;

                    return (
                      <div key={b.label} className="flex-1 min-w-0 flex flex-col items-center gap-1 group">
                        <div className="h-4 flex items-center justify-center">
                          {hasSales ? (
                            <span className="text-[9px] sm:text-[10px] font-bold text-[#3d1018] tabular-nums whitespace-nowrap">
                              <span className="sm:hidden">
                                {b.amount >= 1_000_000 ? `${(b.amount / 1_000_000).toFixed(1)}jt` : b.amount >= 1_000 ? `${Math.round(b.amount / 1_000)}rb` : b.amount}
                              </span>
                              <span className="hidden sm:inline">Rp{b.amount.toLocaleString('id-ID')}</span>
                            </span>
                          ) : trendBuckets.length <= 7 ? (
                            <span className="text-[9px] sm:text-[10px] text-[#847374] tabular-nums whitespace-nowrap">
                              Rp0
                            </span>
                          ) : null}
                        </div>
                        <div
                          style={{ height: `${heightPx}px` }}
                          className={`w-full ${trendBuckets.length > 7 ? 'max-w-[20px] sm:max-w-[36px]' : 'max-w-[36px] sm:max-w-[44px]'} rounded-t transition-all ${
                            hasSales
                              ? 'bg-[#58252c] group-hover:bg-[#3d1018]'
                              : 'bg-[#f0ede9]'
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Area Label Tanggal / Periode Rata Presisi (Satu Garis Lurus Tanpa Wrapping) */}
                <div className="w-full flex justify-between gap-1 sm:gap-3 px-1 sm:px-4 pt-2.5">
                  {trendBuckets.map((b) => (
                    <div key={b.label} className="flex-1 text-center min-w-0 h-5 flex items-center justify-center">
                      <span
                        className="text-[9px] sm:text-[11px] text-[#524344] font-medium whitespace-nowrap truncate block"
                        title={b.label}
                      >
                        <span className="hidden sm:inline">{b.label}</span>
                        <span className="sm:hidden">{(b as any).shortLabel || b.label}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method Card (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-[#ebe8e3] flex flex-col justify-between">
          <div>
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#1c1c19]">
              Metode pembayaran
            </h2>
            <div className="mt-3">
              <span className="text-[11px] font-bold text-[#524344] uppercase tracking-wider block">
                Total Penerimaan
              </span>
              <div className="font-serif text-2xl font-bold text-[#3d1018] tracking-tight mt-0.5 tabular-nums">
                Rp {totalPenjualan.toLocaleString('id-ID')}
              </div>
            </div>

            {/* Proportion Progress Bar (3 Metode Pembayaran) */}
            <div className="w-full h-3 rounded-full bg-[#f0ede9] overflow-hidden flex my-4">
              <div
                className="h-full bg-[#58252c] transition-all"
                style={{ width: `${tunaiPct}%` }}
                title={`Tunai ${tunaiPct}%`}
              ></div>
              <div
                className="h-full bg-[#994703] transition-all"
                style={{ width: `${qrisPct}%` }}
                title={`QRIS ${qrisPct}%`}
              ></div>
              <div
                className="h-full bg-[#fc934f] transition-all"
                style={{ width: `${debitPct}%` }}
                title={`Kartu Debit ${debitPct}%`}
              ></div>
            </div>

            {/* Breakdown List */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#58252c] shrink-0"></span>
                  <span className="text-[#1c1c19] font-medium">
                    Tunai ({tunaiTrx.length} transaksi - {tunaiPct}%)
                  </span>
                </div>
                <span className="font-bold text-[#1c1c19] tabular-nums">
                  Rp {tunaiTotal.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#994703] shrink-0"></span>
                  <span className="text-[#1c1c19] font-medium">
                    QRIS ({qrisTrx.length} transaksi - {qrisPct}%)
                  </span>
                </div>
                <span className="font-bold text-[#1c1c19] tabular-nums">
                  Rp {qrisTotal.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#fc934f] shrink-0"></span>
                  <span className="text-[#1c1c19] font-medium">
                    Kartu Debit ({debitTrx.length} transaksi - {debitPct}%)
                  </span>
                </div>
                <span className="font-bold text-[#1c1c19] tabular-nums">
                  Rp {debitTotal.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Menu Terlaris & Transaksi Terbaru */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Menu Terlaris (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-[#ebe8e3] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-serif text-lg font-bold text-[#1c1c19]">Menu terlaris</h2>
              </div>
            </div>

            {bestSellers.length === 0 ? (
              <div className="py-10 text-center flex flex-col items-center justify-center gap-2">
                <p className="text-xs font-semibold text-[#524344]">Belum ada menu terjual pada periode ini</p>
                <p className="text-[11px] text-[#847374] max-w-xs">Data menu terlaris otomatis terisi saat transaksi lunas diselesaikan.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#ebe8e3] space-y-3 mt-3">
                {bestSellers.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between pt-2.5 first:pt-0">
                    <div className="flex items-center gap-3">
                      {item.image ? (
                        <img
                          className="w-11 h-11 rounded-xl object-cover shadow-xs border border-[#ebe8e3]"
                          src={item.image}
                          alt={item.name}
                          width={44}
                          height={44}
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-[#f0ede9] flex items-center justify-center text-[#994703] font-serif font-bold text-sm">
                          {item.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-sm text-[#1c1c19]">{item.name}</h3>
                        <span className="text-xs text-[#524344]">{item.qty} porsi terjual</span>
                      </div>
                    </div>
                    <span className="font-bold text-sm text-[#3d1018] tabular-nums">
                      Rp {item.revenue.toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 space-y-2 border-t border-[#ebe8e3]">
            <button
              type="button"
              onClick={() => setActiveView('kelola-menu')}
              className="w-full py-2.5 px-4 rounded-xl bg-[#f0ede9] hover:bg-[#ebe8e3] text-[#1c1c19] text-xs font-semibold transition-colors flex items-center justify-center gap-1 active:scale-95"
            >
              <span>Lihat kelola menu</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Transaksi Terbaru (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-[#ebe8e3] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg font-bold text-[#1c1c19]">Transaksi terbaru</h2>
              <button
                onClick={() => setActiveView('laporan')}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#3d1018] hover:underline"
              >
                <span>Lihat laporan</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>

            {/* Transaction Table */}
            <div>
              {/* Desktop View (Tampil pada layar >= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-[#524344] uppercase tracking-wider bg-[#f6f3ee] text-[10px] font-bold">
                      <th scope="col" className="py-2.5 px-3 rounded-l-xl">Pesanan</th>
                      <th scope="col" className="py-2.5 px-3">Meja</th>
                      <th scope="col" className="py-2.5 px-3">Metode</th>
                      <th scope="col" className="py-2.5 px-3">Total</th>
                      <th scope="col" className="py-2.5 px-3 rounded-r-xl text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ebe8e3]">
                    {filteredTrx.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-xs text-[#524344]">
                          Belum ada transaksi pada periode ini
                        </td>
                      </tr>
                    ) : (
                      filteredTrx.slice(0, 6).map((trx) => (
                        <tr
                          key={trx.id}
                          className="hover:bg-[#f6f3ee] transition-colors"
                        >
                          <td className="py-3 px-3 font-semibold text-[#1c1c19]">{trx.code}</td>
                          <td className="py-3 px-3 text-[#1c1c19]">{trx.typeMeja}</td>
                          <td className="py-3 px-3">
                            <span className="text-xs font-medium text-[#524344]">
                              {trx.method}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-bold text-[#1c1c19] tabular-nums">
                            Rp {trx.total.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span className="text-xs font-semibold text-emerald-700">
                              {trx.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile View (Tampil pada layar < md) */}
              <div className="md:hidden divide-y divide-[#ebe8e3]">
                {filteredTrx.length === 0 ? (
                  <div className="py-6 text-center text-xs text-[#524344]">
                    Belum ada transaksi pada periode ini
                  </div>
                ) : (
                  filteredTrx.slice(0, 6).map((trx) => (
                    <div
                      key={trx.id}
                      className="py-3 space-y-1 hover:bg-[#fcfaf7] transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-[#1c1c19]">{trx.code}</span>
                          <span className="text-[#847374] text-[11px]">• {trx.typeMeja}</span>
                        </div>
                        <span className="font-bold text-xs text-[#1c1c19] tabular-nums">
                          Rp {trx.total.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#524344] font-medium">{trx.method}</span>
                        <span className="font-semibold text-emerald-700">{trx.status}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
