// Gambar pengganti (SVG data-URI) bila menu belum punya foto. Tidak butuh jaringan.
const PALETTE = ['#58252c', '#994703', '#753400', '#3c3335', '#6d363d', '#8a5a2b'];
export const placeholderImage = (name: string) => {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');
  const c = PALETTE[[...name].reduce((a, ch) => a + ch.charCodeAt(0), 0) % PALETTE.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c}"/><stop offset="1" stop-color="#fc934f" stop-opacity=".75"/></linearGradient></defs><rect width="400" height="300" fill="url(#g)"/><text x="200" y="170" font-family="Georgia,serif" font-size="96" fill="#fff" fill-opacity=".85" text-anchor="middle">${initials}</text></svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
};
export const isPlaceholder = (url: string) => url.startsWith('data:image/svg+xml');
