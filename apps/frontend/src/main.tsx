import {createRoot} from 'react-dom/client';

// Satu proyek, dua aplikasi: /pesan = pelanggan (QR meja), selain itu = POS staf/admin/dapur.
// Di-import dinamis agar CSS tiap aplikasi tidak saling bentrok.
const isCustomer = window.location.pathname.startsWith('/pesan');
const load = isCustomer
  ? Promise.all([import('./customer/App'), import('./customer/index.css')])
  : Promise.all([import('./pos/App'), import('./pos/index.css')]);

load.then(([mod]) => createRoot(document.getElementById('root')!).render(<mod.default />));
