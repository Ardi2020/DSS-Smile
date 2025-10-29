// src/routes/api/facility/[id]/tlhi/+server.ts
import type { RequestHandler } from '@sveltejs/kit';
import { getJson } from '$lib/server/api/http';
import { cacheGet, cacheSet, matchFacility } from '$lib/server/smile/util';

type DSList<T> = { status: number; keterangan: string; response: T[] };
type Row = Record<string, any>;

export const GET: RequestHandler = async ({ params, url }) => {
  if (!params.id) throw new Error('ID fasilitas tidak disediakan');
  const id = decodeURIComponent(params.id);
  const ttl = Number(url.searchParams.get('ttl') ?? 60_000);
  const noCache = url.searchParams.get('noCache') === '1';
  const ck = `facility_tlhi:${id}`;

  // Clear cache jika noCache=1
  if (noCache) {
    const globalCache = (globalThis as any).__facility_cache__;
    if (globalCache && typeof globalCache.clear === 'function') {
      globalCache.clear();
    }
  }

  const cached = cacheGet(ck, ttl);
  if (cached && !noCache) return new Response(JSON.stringify(cached), { headers: { 'Content-Type': 'application/json' } });

  // Buat profil dasar dari ID
  const profile = { nama: id };

  let items: Row[] = [];
  try {
    const res = await getJson<DSList<Row>>('/tlhi/inspektur', { query: { page: 1, limit: 1000 } });
    items = (res.response ?? []).filter(r => matchFacility(r, id, profile.nama));
  } catch {
    items = [];
  }

  const payload = { ok: true, id, items };
  cacheSet(ck, payload);
  return new Response(JSON.stringify(payload), { headers: { 'Content-Type': 'application/json' } });
};
