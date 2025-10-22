import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
  const res = await fetch('/api/dashboard');
  if (!res.ok) {
    // Jangan lempar error biar UI bisa tampil dengan pesan
    return { dashboard: null, error: `Gagal memuat dashboard: ${res.status}` };
  }
  const { dashboard } = await res.json();
  return { dashboard };
};
