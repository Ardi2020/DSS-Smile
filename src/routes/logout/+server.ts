import { clearToken } from '$lib/server/api/token';
import { redirect } from '@sveltejs/kit';

export async function POST({ cookies }) {
  clearToken();
  cookies.delete('dss_authed', { path: '/' });
  throw redirect(303, '/login');
}
