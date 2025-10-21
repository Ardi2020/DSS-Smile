// src/routes/api/auth/refresh/+server.ts
import { json } from '@sveltejs/kit';
import { refresh } from '$lib/server/api/token';

export async function POST() {
  const token = await refresh();
  return json({ ok: true, refreshed: !!token });
}
