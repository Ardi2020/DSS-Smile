// src/routes/api/facility/[id]/overview/+server.ts
import type { RequestHandler } from '@sveltejs/kit';
import { getJson } from '$lib/server/api/http';
import { cacheGet, cacheSet, matchFacility } from '$lib/server/smile/util';

type DSList<T> = { status: number; keterangan: string; response: T[] };
type Row = Record<string, any>;

export const GET: RequestHandler = async ({ params, url }) => {
  if (!params.id) throw new Error('ID fasilitas tidak disediakan');
  const id = decodeURIComponent(params.id);
  const ttl = Number(url.searchParams.get('ttl') ?? 60_000);
  const ck = `facility_overview:${id}`;
  const cached = cacheGet(ck, ttl);
  if (cached) return new Response(JSON.stringify(cached), { headers: { 'Content-Type': 'application/json' } });

  // 1) Ambil daftar fasilitas dari BFF existing untuk dapatkan nama/tipe
  const fac = await fetch(url.origin + '/api/facilities').then(r => r.json());
  const profile = (fac.facilities ?? []).find((f: any) => String(f.id) === id) ?? { id, nama: id, tipe: null, lokasi: null };

  // 2) Ambil jadwal (basis kuat untuk filter)
  const jadwalRes = await getJson<DSList<Row>>('/inspektur-jadwal-inspeksi', { query: { page: 1, limit: 1000 } });
  const jadwal = (jadwalRes.response ?? []).filter(r => matchFacility(r, id, profile.nama));

  // 3) (Optional) TLHI — jika endpoint tersedia, ganti path di bawah; kalau belum, set []
  let tlhi: Row[] = [];
  try {
    const tlhiRes = await getJson<DSList<Row>>('/tlhi/inspektur', { query: { page: 1, limit: 1000 } });
    tlhi = (tlhiRes.response ?? []).filter(r => matchFacility(r, id, profile.nama));
  } catch {
    tlhi = [];
  }

  // 4) (Optional) Temuan/peraturan — reuse peraturan/temuan dan filter bila ada kolom fasilitas
  let topTemuan: Array<{ regulasi_kode: string; regulasi_judul: string; jumlah_temuan: number }> = [];
  try {
    const pr = await getJson<DSList<Row>>('/peraturan/temuan', { query: { page: 1, limit: 1000 } });
    const filtered = (pr.response ?? []).filter(r => matchFacility(r, id, profile.nama));
    const agg = new Map<string, { kode: string; judul: string; n: number }>();
    for (const r of filtered) {
      const kode = String(r.pasal ?? r.regulasi_kode ?? '-');
      const judul = String(r.nama_peraturan ?? r.regulasi_judul ?? 'Peraturan');
      const key = `${kode}|${judul}`;
      const cur = agg.get(key) ?? { kode, judul, n: 0 };
      cur.n += Number(r.jumlah_temuan ?? r.count ?? 1);
      agg.set(key, cur);
    }
    topTemuan = Array.from(agg.values())
      .map(x => ({ regulasi_kode: x.kode, regulasi_judul: x.judul, jumlah_temuan: x.n }))
      .sort((a, b) => b.jumlah_temuan - a.jumlah_temuan)
      .slice(0, 10);
  } catch {
    topTemuan = [];
  }

  const payload = {
    ok: true,
    id: profile.id,
    profile,
    counts: {
      jadwal: jadwal.length,
      tlhi: tlhi.length,
      topTemuan: topTemuan.length
    },
    samples: {
      jadwal: jadwal.slice(0, 5),
      tlhi: tlhi.slice(0, 5)
    },
    topTemuan
  };

  cacheSet(ck, payload);
  return new Response(JSON.stringify(payload), { headers: { 'Content-Type': 'application/json' } });
};
