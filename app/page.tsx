'use client';

import dynamic from 'next/dynamic';

const POSApp = dynamic(() => import('../src/pos/App'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#fcf9f4] flex items-center justify-center font-sans">
      <div className="flex flex-col items-center gap-3">
        <div className="w-9 h-9 border-3 border-[#3d1018] border-t-transparent rounded-full animate-spin" />
        <span className="font-serif text-[#3d1018] font-bold text-sm tracking-wide">
          Memuat Rawon Gusti POS...
        </span>
      </div>
    </div>
  ),
});

export default function Page() {
  return <POSApp />;
}
