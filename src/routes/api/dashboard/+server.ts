import { json, error } from '@sveltejs/kit';
import { getJadwal, getJadwalInspektur } from '$lib/server/smile/jadwal';
import { getTrendParamBKO } from '$lib/server/smile/parameter';
import { getPeraturanTemuan } from '$lib/server/smile/regulasi';
import { getTlhiInspektur } from '$lib/server/smile/tlhi';

// Util: group by key
function groupBy<T, K extends string>(arr: T[], keyFn: (x: T) => K) {
  return arr.reduce((acc, cur) => {
    const k = keyFn(cur);
    (acc[k] ??= []).push(cur);
    return acc;
  }, {} as Record<K, T[]>);
}

export async function GET({ url }) {
  try {
    const page = Number(url.searchParams.get('page') ?? 1);
    const limit = Number(url.searchParams.get('limit') ?? 50);
    const paramLimit = Number(url.searchParams.get('param_limit') ?? 200);
    const topN = Number(url.searchParams.get('top') ?? 10);

    // Fetch paralel
    const [
      jadwalAll,
      jadwalInspector,
      trendParam,
      peraturanTemuan,
      tlhiInspector
    ] = await Promise.all([
      getJadwal(page, limit),
      getJadwalInspektur(page, limit),
      getTrendParamBKO(1, paramLimit),
      getPeraturanTemuan(page, limit),
      getTlhiInspektur(page, limit)
    ]);

    // 1) temuanByKategori — derived dari peraturan/temuan (menggunakan field 'kategori' bila tersedia)
    const temuanItems = peraturanTemuan.items ?? [];
    const temuanGrouped = groupBy(temuanItems, (x) => (x.kategori ?? 'Lainnya') as string);
    const temuanByKategori = Object.entries(temuanGrouped)
      .map(([kategori, arr]) => ({
        kategori,
        jumlah: arr.reduce((s, it) => s + (Number(it.jumlah_temuan) || 0), 0)
      }))
      .sort((a, b) => b.jumlah - a.jumlah);

    // 2) tlhiOpenOverdue — filter OPEN + due_date < today
    const today = Date.now();
    const tlhiItems = tlhiInspector.items ?? [];
    const tlhiOpenOverdue = tlhiItems
      .filter((x) => String(x.status).toUpperCase() === 'OPEN')
      .map((x) => ({
        ...x,
        is_overdue: x.due_date ? new Date(x.due_date).getTime() < today : false
      }))
      .filter((x) => x.is_overdue);

    // 3) peraturanTopN — top regulasi dilanggar
    const peraturanTopN = [...temuanItems]
      .sort((a, b) => (b.jumlah_temuan || 0) - (a.jumlah_temuan || 0))
      .slice(0, topN)
      .map((x) => ({
        regulasi_id: x.regulasi_id,
        regulasi_kode: x.regulasi_kode,
        regulasi_judul: x.regulasi_judul,
        jumlah_temuan: x.jumlah_temuan
      }));

    // 4) trenParamSample — ambil sampel wajar (mis. 20 terakhir)
    const trenParamSource = trendParam.items ?? [];
    const trenParamSample = trenParamSource
      .slice(Math.max(0, trenParamSource.length - 20), trenParamSource.length);

    // 5) ikk? — placeholder (isi saat endpoint IKK siap)
    const ikk = null as unknown as Record<string, unknown> | null;

    return json({
      ok: true,
      dashboard: {
        ikk, // opsional
        temuanByKategori,
        tlhiOpenOverdue,
        peraturanTopN,
        trenParamSample
      },
      meta: {
        jadwal: { total: jadwalAll.total, count: jadwalAll.items.length },
        jadwal_inspektur: { total: jadwalInspector.total, count: jadwalInspector.items.length },
        trend_param_total: trendParam.total ?? trenParamSource.length
      }
    });
  } catch (e: any) {
    // apiFetch sudah melempar error(status, body) jika non-OK
    throw error(500, e?.message ?? 'Dashboard aggregation failed');
  }
}
