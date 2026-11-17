import {createRoot} from 'react-dom/client';
import {DevVisualInspector} from './lib/DevVisualInspector';

// Satu proyek, dua aplikasi: /pesan = pelanggan (QR meja), selain itu = POS staf/admin/dapur.
// Di-import dinamis agar CSS tiap aplikasi tidak saling bentrok.
const appPath = window.location.pathname.replace(import.meta.env.BASE_URL, '/');
const isCustomer = appPath.startsWith('/pesan');
const load = isCustomer
  ? Promise.all([import('./customer/App'), import('./customer/index.css')])
  : Promise.all([import('./pos/App'), import('./pos/index.css')]);

load.then(([mod]) =>
  createRoot(document.getElementById('root')!).render(
    <>
      <mod.default />
      <DevVisualInspector />
    </>
  )
);
