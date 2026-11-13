export const metadata = {
  title: 'Rawon Gusti API',
  description: 'Next.js Functional Programming Backend for Rawon Gusti Surabaya',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
