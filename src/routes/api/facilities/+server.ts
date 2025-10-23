// src/routes/api/facilities/+server.ts
import type { RequestHandler } from '@sveltejs/kit';
import { listFacilitiesOfficial, listFacilitiesDerived } from '$lib/server/smile/fasilitas';

const cache = new Map<string, { at: number; data: any }>();
const TTL = 60_000;

function getCache(key: string) {
  const c = cache.get(key);
  if (!c) return null;
  if (Date.now() - c.at > TTL) return null;
  return c.data;
}
function setCache(key: string, data: any) {
  // JANGAN cache payload kosong
  if (Array.isArray(data?.facilities) && data.facilities.length === 0) return;
  cache.set(key, { at: Date.now(), data });
}

export const GET: RequestHandler = async ({ url }) => {
  const limit = Number(url.searchParams.get('limit') ?? 1000);
  const noCache = url.searchParams.get('noCache') === '1';
  const key = `facilities:${limit}`;

  if (!noCache) {
    const cached = getCache(key);
    if (cached) return new Response(JSON.stringify(cached), { headers: { 'Content-Type': 'application/json' } });
  }

  const payload: any = { ok: true, facilities: [], source: 'official', errors: [] as any[] };

  try {
    const official = await listFacilitiesOfficial(limit);
    if (official.length > 0) {
      payload.facilities = official;
      payload.source = 'official';
    } else {
      payload.errors.push('official-empty');
      const derived = await listFacilitiesDerived(limit);
      payload.facilities = derived;
      payload.source = 'derived';
    }
  } catch (e: any) {
    payload.errors.push(String(e?.message ?? e));
    try {
      const derived = await listFacilitiesDerived(limit);
      payload.facilities = derived;
      payload.source = 'derived';
    } catch (e2: any) {
      payload.ok = false;
      payload.errors.push(String(e2?.message ?? e2));
    }
  }

  // Facets & meta dihitung dari hasil final
  const byTipe = new Map<string, number>();
  for (const f of payload.facilities) {
    const k = f.tipe ?? 'Tidak Terspesifikasi';
    byTipe.set(k, (byTipe.get(k) ?? 0) + 1);
  }
  payload.meta = {
    counts: { total: payload.facilities.length },
    facets: { tipe: Array.from(byTipe.entries()).map(([label, count]) => ({ label, count })) },
    updated_at: new Date().toISOString()
  };

  // Cache hanya jika ada isi
  if (payload.ok && payload.facilities.length > 0 && !noCache) setCache(key, payload);

  return new Response(JSON.stringify(payload), { headers: { 'Content-Type': 'application/json' } });
};
