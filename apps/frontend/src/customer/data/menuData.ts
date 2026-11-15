import { publicAsset } from '../../lib/publicAsset';

// Info statis restoran (menu, harga, dan meja kini berasal dari Supabase).
export const RESTAURANT_INFO = {
  name: 'Rawon Gusti',
  tagline: 'Surabaya • Est. 1982',
  branch: 'Surabaya',
  tableDefault: '08',
  tableAreaDefault: 'Area Pendopo',
  tableAreaAlt: 'Area Ruang Utama (Non-Smoking)',
  wifiSsid: 'RawonGusti_VIP',
  wifiPass: 'rawonenak08',
  logoUrl: publicAsset('logo-rawon.png'),
  profileAvatarUrl: publicAsset('logo-rawon.png'),
};
