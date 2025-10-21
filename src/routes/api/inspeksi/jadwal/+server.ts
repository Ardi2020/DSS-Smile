// src/routes/api/inspeksi/jadwal/+server.ts
import { json } from '@sveltejs/kit';
import { apiFetch } from '$lib/server/api/http';

export async function GET({ url }) {
  const page = Number(url.searchParams.get('page') ?? 1);
  const limit = Number(url.searchParams.get('limit') ?? 50);
  const data = await apiFetch<any>(`/inspeksi-jadwal?page=${page}&limit=${limit}`);
  return json({ ok: true, data });
}
