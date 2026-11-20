import type { Metadata } from 'next';
import './globals.css';
import { DevInspectorWrapper } from './DevInspectorWrapper';

export const metadata: Metadata = {
  title: 'Rawon Gusti Surabaya — POS & Self-Ordering',
  description: 'Sistem POS, manajemen meja, Kitchen Display, dan pemesanan mandiri QR meja untuk Rawon Gusti Surabaya.',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap"
        />
      </head>
      <body className="bg-[#fcf9f4] text-[#1c1c19] antialiased">
        {children}
        <DevInspectorWrapper />
      </body>
    </html>
  );
}
