// src/routes/api/facility/[id]/jadwal/+server.ts
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
  const ck = `facility_jadwal:${id}`;

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

  const res = await getJson<DSList<Row>>('/inspektur-jadwal-inspeksi', { query: { page: 1, limit: 1000 } });
  const all = res.response ?? [];
  const items = all
    .filter((r) => matchFacility(r, id, profile.nama))
    .map((j) => ({
      tgl_mulai: j.tgl_mulai ?? j.tanggal_mulai ?? j.tanggal ?? null,
      tgl_selesai: j.tgl_selesai ?? j.tanggal_selesai ?? null,
      kegiatan: j.kegiatan ?? j.lingkup_inspeksi ?? j.objek_inspeksi ?? j.sifat_inspeksi ?? '-',
      kode_jadwal: j.kode_jadwal ?? null,
      raw: j
    }));

  const payload = { ok: true, id, count: items.length, items, updated_at: new Date().toISOString() };
  cacheSet(ck, payload);
  return new Response(JSON.stringify(payload), { headers: { 'Content-Type': 'application/json' } });
};
