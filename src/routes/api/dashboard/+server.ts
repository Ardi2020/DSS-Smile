import type { RequestHandler } from './$types';
import { apiGet, getTokenFromGlobals } from '$lib/server/api/http';

export const GET: RequestHandler = async ({ fetch }) => {
  // ambil token dari globals (sesuaikan dengan tempat kamu menyimpan)
  const token = getTokenFromGlobals();

  const [jadwal, jadwalInspektur, tlhi, peraturan, trend] = await Promise.all([
    apiGet(fetch, '/inspeksi-jadwal', token, { page: 1, limit: 50 }),
    apiGet(fetch, '/inspektur-jadwal-inspeksi', token, { page: 1, limit: 50 }),
    apiGet(fetch, '/tlhi/inspektur', token, { page: 1, limit: 50 }),
    apiGet(fetch, '/peraturan/temuan', token, { page: 1, limit: 50 }),
    apiGet(fetch, '/parameter/trend-parameter-bko', token, { page: 1, limit: 200 }),
  ]);

  // JANGAN iterasi kalau bukan array
  const dataPeraturan = Array.isArray(peraturan.data) ? peraturan.data : [];
  const peraturanTopN = dataPeraturan
    .slice(0, 10)
    .map((x: any) => ({
      regulasi_id: x?.no_peraturan ?? null,
      regulasi_kode: x?.pasal ?? null,
      regulasi_judul: x?.nama_peraturan ?? null,
      jumlah_temuan: Number(x?.jumlah_temuan ?? 0),
    }));

  const trenParamSample = Array.isArray(trend.data) ? trend.data : []; // kalau endpoint balas 500/401, ini []

  const errors: Array<{ tag: string; status: number; message: string; path: string }> = [];
  for (const [tag, r, path] of [
    ['jadwal', jadwal, '/inspeksi-jadwal'],
    ['jadwal_inspektur', jadwalInspektur, '/inspektur-jadwal-inspeksi'],
    ['tlhi', tlhi, '/tlhi/inspektur'],
    ['peraturan', peraturan, '/peraturan/temuan'],
    ['trend', trend, '/parameter/trend-parameter-bko'],
  ] as const) {
    if (!r.ok) errors.push({ tag, status: r.status, message: JSON.stringify(r.raw), path });
  }

  return new Response(
    JSON.stringify({
      ok: errors.length === 0,
      dashboard: {
        ikk: null,
        temuanByKategori: dataPeraturan.length
          ? [{ kategori: 'Lainnya', jumlah: dataPeraturan.reduce((s: number, i: any) => s + Number(i?.jumlah_temuan ?? 0), 0) }]
          : [],
        tlhiOpenOverdue: [],
        peraturanTopN,
        trenParamSample,
      },
      meta: {
        counts: {
          jadwal: (jadwal.raw?.meta?.total ?? 0),
          jadwal_inspektur: (jadwalInspektur.raw?.meta?.total ?? 0),
          trend_param: trenParamSample.length,
          peraturan_temuan: dataPeraturan.length,
          tlhi_inspektur: (tlhi.raw?.meta?.total ?? 0),
        },
      },
      errors,
    }),
    { headers: { 'content-type': 'application/json' } }
  );
};
