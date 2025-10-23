// src/routes/api/dashboard/+server.ts
import type { RequestHandler } from '@sveltejs/kit';
import { getJson } from '$lib/server/api/http';
import { shouldRefresh, refreshToken } from '$lib/server/api/token';
import { listFacilitiesOfficial } from '$lib/server/smile/fasilitas';

type DSRes<T> = { status: number; keterangan: string; response: T; meta?: any };

export const GET: RequestHandler = async () => {
  const errors: Array<{ tag: string; status: number; message: string; path: string }> = [];

  // Jaga-jaga refresh proaktif
  if (shouldRefresh()) {
    try { await refreshToken(); } catch (e) { /* biarkan 401 downstream */ }
  }

  // 1) Peraturan top-N
  let peraturanTopN: any[] = [];
  try {
    const resp = await getJson<DSRes<any[]>>('/peraturan/temuan', { query: { page: 1, limit: 100 } });
    peraturanTopN = (resp.response ?? [])
      .map(r => ({
        regulasi_id: `${r.no_peraturan ? 'PB/PP' : ''}` || r.nama_peraturan,
        regulasi_kode: r.pasal,
        regulasi_judul: r.nama_peraturan,
        jumlah_temuan: Number(r.jumlah_temuan ?? 0)
      }))
      .sort((a, b) => b.jumlah_temuan - a.jumlah_temuan)
      .slice(0, 10);
  } catch (e: any) {
    errors.push({ tag: 'peraturan', status: 500, message: String(e?.message ?? e), path: '/peraturan/temuan' });
  }

  // 2) Temuan by kategori (kita treat "kategori" sebagai nama_peraturan/pasal fallback)
  let temuanByKategori: Array<{ kategori: string; jumlah: number }> = [];
  try {
    const resp = await getJson<DSRes<any[]>>('/peraturan/temuan', { query: { page: 1, limit: 100 } });
    const bucket: Record<string, number> = {};
    for (const r of (resp.response ?? [])) {
      const k = r.nama_peraturan ?? 'Lainnya';
      bucket[k] = (bucket[k] ?? 0) + Number(r.jumlah_temuan ?? 0);
    }
    temuanByKategori = Object.entries(bucket).map(([kategori, jumlah]) => ({ kategori, jumlah }));
  } catch (e: any) {
    errors.push({ tag: 'temuan', status: 500, message: String(e?.message ?? e), path: '/peraturan/temuan' });
  }

  // 3) TLHI (open/overdue) — saat ini belum ada filter, tampilkan raw length
  let tlhiOpenOverdue: any[] = [];
  try {
    const resp = await getJson<DSRes<any[]>>('/tlhi/inspektur', { query: { page: 1, limit: 100 } });
    tlhiOpenOverdue = resp.response ?? [];
  } catch (e: any) {
    errors.push({ tag: 'tlhi', status: 500, message: String(e?.message ?? e), path: '/tlhi/inspektur' });
  }

  // 4) Tren Parameter (opsional; graceful on 500)
  let trenParamSample: any[] = [];
  try {
    const resp = await getJson<DSRes<any[]>>('/parameter/trend-parameter-bko', { query: { page: 1, limit: 50 } });
    trenParamSample = resp.response ?? [];
  } catch (e: any) {
    errors.push({ tag: 'trend', status: 500, message: String(e?.message ?? e), path: '/parameter/trend-parameter-bko' });
    trenParamSample = []; // biarkan kosong untuk chart placeholder
  }

  // 5) Fasilitas resmi (untuk hitung total fasilitas)
  let facilitiesCount: number = 0;
  try {
    const facilities = await listFacilitiesOfficial(1000); // limit tinggi untuk total
    facilitiesCount = facilities.length;
  } catch (e: any) {
    errors.push({ tag: 'facilities', status: 500, message: String(e?.message ?? e), path: '/instalasi' });
  }

  // Ringkasan untuk kartu
  const totalTemuan = temuanByKategori.reduce((s, it) => s + (Number(it.jumlah) || 0), 0);
  const dashboard = {
    ikk: null,
    temuanByKategori,
    tlhiOpenOverdue,
    peraturanTopN,
    trenParamSample
  };

  // Partial OK: true jika ada minimal satu modul berisi data
  const anyData =
    (peraturanTopN.length > 0) ||
    (temuanByKategori.length > 0 && totalTemuan > 0) ||
    (tlhiOpenOverdue.length > 0) ||
    (trenParamSample.length > 0) ||
    (facilitiesCount > 0);

  const meta = {
    counts: {
      peraturan_temuan: peraturanTopN.length,
      temuan_total: totalTemuan,
      tlhi_items: tlhiOpenOverdue.length,
      trend_param: trenParamSample.length,
      facilities_count: facilitiesCount
    }
  };

  return new Response(
    JSON.stringify({ ok: anyData, dashboard, meta, errors }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
