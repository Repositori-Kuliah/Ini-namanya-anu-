import React, { useState, useEffect, useRef } from 'react';

interface DashboardDatePickerProps {
  dateFrom: string;
  dateTo: string;
  maxDate: string;
  onSelectDate: (dateIso: string) => void;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const isoToDisplay = (iso: string): string => {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  const [y, m, d] = parts;
  return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
};

export const DashboardDatePicker: React.FC<DashboardDatePickerProps> = ({
  dateFrom,
  dateTo,
  maxDate,
  onSelectDate,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const [viewYear, setViewYear] = useState(() => {
    const parts = (dateTo || '').split('-');
    return parseInt(parts[0], 10) || new Date().getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    const parts = (dateTo || '').split('-');
    return (parseInt(parts[1], 10) || (new Date().getMonth() + 1)) - 1;
  });

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const parts = (dateTo || '').split('-');
    if (parts.length === 3) {
      setViewYear(parseInt(parts[0], 10));
      setViewMonth(parseInt(parts[1], 10) - 1);
    }
  }, [dateTo, dateFrom]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const monthStr = String(viewMonth + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const iso = `${viewYear}-${monthStr}-${dayStr}`;

    if (maxDate && iso > maxDate) return;

    onSelectDate(iso);
    setIsOpen(false);
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();

  return (
    <div ref={containerRef} className="relative inline-block">
      {/* Tombol Kalender Kapsul Bersih (DD/MM/YYYY) */}
      <button
        id="dash-unified-date"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#ebe8e3] hover:border-[#3d1018] rounded-xl text-xs font-bold text-[#1c1c19] transition-all cursor-pointer shadow-2xs focus-visible:outline-none focus:border-[#3d1018]"
        aria-label="Pilih tanggal dashboard"
      >
        <span className="material-symbols-outlined text-[17px] text-[#994703]">
          calendar_month
        </span>
        <span className="font-mono tracking-wider tabular-nums">
          {isoToDisplay(dateTo)}
        </span>
        <span className="material-symbols-outlined text-[15px] text-[#847374]">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {/* Popover Kalender Visual */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Pemilih Tanggal Kalender"
          className="absolute right-0 top-full mt-2 z-50 bg-white rounded-2xl p-4 shadow-xl border border-[#ebe8e3] w-72 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header Kalender */}
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#f0ede9]">
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Bulan sebelumnya"
              className="w-7 h-7 rounded-lg bg-[#f6f3ee] hover:bg-[#3d1018] hover:text-white text-[#1c1c19] flex items-center justify-center transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            </button>

            <span className="font-serif font-bold text-xs text-[#3d1018]">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Bulan berikutnya"
              className="w-7 h-7 rounded-lg bg-[#f6f3ee] hover:bg-[#3d1018] hover:text-white text-[#1c1c19] flex items-center justify-center transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>

          {/* Nama Hari */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
            {DAY_NAMES.map((d) => (
              <span key={d} className="text-[10px] font-bold text-[#847374] uppercase tracking-wider">
                {d}
              </span>
            ))}
          </div>

          {/* Grid Tanggal */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="w-8 h-8" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const monthStr = String(viewMonth + 1).padStart(2, '0');
              const dayStr = String(day).padStart(2, '0');
              const cellIso = `${viewYear}-${monthStr}-${dayStr}`;

              const isSelected = cellIso === dateTo;
              const isToday = cellIso === maxDate;
              const isDisabled = cellIso > maxDate;

              return (
                <button
                  key={day}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleSelectDay(day)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#3d1018] text-white font-bold shadow-xs'
                      : isToday
                      ? 'bg-[#ffdbc9] text-[#753400] font-bold border border-[#fc934f]'
                      : isDisabled
                      ? 'text-[#c5bcb5] cursor-not-allowed opacity-40'
                      : 'hover:bg-[#f6f3ee] text-[#1c1c19]'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Quick Footer */}
          <div className="mt-3 pt-2.5 border-t border-[#f0ede9] flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                onSelectDate(maxDate);
                setIsOpen(false);
              }}
              className="text-[#994703] font-bold hover:underline cursor-pointer"
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[#524344] hover:text-[#1c1c19] font-medium cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
