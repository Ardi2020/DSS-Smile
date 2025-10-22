import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
  const res = await fetch('/api/dashboard');
  if (!res.ok) {
    return { dashboard: null, error: `Gagal memuat dashboard: ${res.status}` };
  }
  const { dashboard, meta, errors } = await res.json();
  return { dashboard, meta, errors };
};
