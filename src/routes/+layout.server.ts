import type { LayoutServerLoad } from './$types';
import { getAuthHeader, refresh } from '$lib/server/api/token';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ url, cookies }) => {
  const isLogin = url.pathname === '/login';
  const authedCookie = cookies.get('dss_authed') === '1';
  let hasToken = !!getAuthHeader().Authorization;

  // Kalau cookie ada tapi token hilang (HMR/refresh), coba pulihkan
  if (authedCookie && !hasToken && !isLogin) {
    try { await refresh(); } catch {}
    hasToken = !!getAuthHeader().Authorization;
  }

  if (!isLogin && (!authedCookie || !hasToken)) {
    throw redirect(303, '/login');
  }

  return { authed: authedCookie && hasToken };
};
