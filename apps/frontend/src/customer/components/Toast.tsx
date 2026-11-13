import React from 'react';
import { useApp } from '../context/AppContext';

export const Toast: React.FC = () => {
  const { toast } = useApp();

  if (!toast.show) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-20 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:max-w-md z-50 pointer-events-none"
    >
      <div className="bg-[#3d1018] text-white px-4 py-3 rounded-2xl shadow-xl font-sans text-xs font-semibold flex items-center justify-center gap-2.5 border border-[#58252c]">
        <span
          className="material-symbols-outlined text-[#fc934f] text-[18px] shrink-0"
          style={{ fontVariationSettings: "'FILL' 1" }}
          aria-hidden="true"
        >
          {toast.icon || 'check_circle'}
        </span>
        <span className="truncate">{toast.message}</span>
      </div>
    </div>
  );
};
