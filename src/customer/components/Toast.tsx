import React from 'react';
import { useApp } from '../context/AppContext';

export const Toast: React.FC = () => {
  const { toast } = useApp();

  if (!toast.show) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-5 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
    >
      <div
        className={`text-white px-5 py-2.5 rounded-2xl shadow-2xl flex items-center justify-center border max-w-[90vw] animate-in fade-in slide-in-from-top-4 duration-200 text-center font-sans ${
          toast.type === 'warning'
            ? 'bg-[#ba1a1a] border-[#ffdadc]/30 shadow-[#ba1a1a]/25'
            : toast.type === 'success'
            ? 'bg-[#1b3b22] border-emerald-500/25 shadow-[#1b3b22]/25'
            : 'bg-[#3d1018] border-[#ffdadc]/20 shadow-[#3d1018]/25'
        }`}
      >
        <span className="text-xs font-bold tracking-wide">{toast.message}</span>
      </div>
    </div>
  );
};
