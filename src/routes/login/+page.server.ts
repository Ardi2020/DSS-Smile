import type { Actions } from './$types';
import { login } from '$lib/server/api/token';
import { fail, redirect } from '@sveltejs/kit';

const cookieOpts = {
  path: '/',
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 60 * 60 // 1 jam sesi UI; token disegarkan terpisah oleh TokenManager
};

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const form = await request.formData();
    const username = String(form.get('username') ?? '');
    const password = String(form.get('password') ?? '');
    if (!username || !password) return fail(400, { error: 'Username/password wajib diisi' });

    try {
      await login(username, password);        // simpan token di server memory
      cookies.set('dss_authed', '1', cookieOpts); // sesi UI (tanpa token)
    } catch (e: any) {
      return fail(400, { error: e?.message ?? 'Gagal login' });
    }

    throw redirect(303, '/');               // ke dashboard — di luar try agar tidak tertangkap
  }
};
