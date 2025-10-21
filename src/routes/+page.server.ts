import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
  const res = await fetch('/api/dashboard');
  if (!res.ok) {
    return { dashboard: null };
  }
  const { dashboard } = await res.json();
  return { dashboard };
};
