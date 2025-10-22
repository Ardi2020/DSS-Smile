import { json } from '@sveltejs/kit';
import { apiFetchSafe } from '$lib/server/api/http';
import { EP } from '$lib/server/smile/endpoints';

// helper baca array dari respons
function takeArr(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.response)) return data.response;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.data)) return data.data;
  return [];
}

export async function GET({ url }) {
  const page = url.searchParams.get('page') ?? '1';
  const limit = url.searchParams.get('limit') ?? '50';
  const paramLimit = url.searchParams.get('param_limit') ?? '200';
  const topN = Number(url.searchParams.get('top') ?? 10);

  const calls = [
    ['jadwal',          `${EP.jadwal}?page=${page}&limit=${limit}`],
    ['jadwal_ins',      `${EP.jadwalInspektur}?page=${page}&limit=${limit}`],
    ['trend',           `${EP.trendParamBKO}?page=1&limit=${paramLimit}`],
    ['peraturan',       `${EP.peraturanTemuan}?page=${page}&limit=${limit}`],
    ['tlhi',            `${EP.tlhiInspektur}?page=${page}&limit=${limit}`]
  ] as const;

  const results = await Promise.all(
    calls.map(([tag, path]) => apiFetchSafe(path))
  );

  const bag: Record<string, any[]> = {};
  const errors: Array<{tag:string; status:number; message:string; path?:string}> = [];

  results.forEach((res, i) => {
    const tag = calls[i][0];
    const path = calls[i][1];
    if (res.ok) {
      bag[tag] = takeArr(res.data);
    } else {
      errors.push({ tag, status: res.status, message: res.message, path });
      console.error(`[DASH] ${tag} FAIL ${res.status} @ ${path} :: ${res.message}`);
      bag[tag] = [];
    }
  });

  // --- KPI derivation ---
  // Peraturan (map berbagai kemungkinan nama field)
  const peraturanTopN = [...bag.peraturan]
    .map((x:any)=>({
      regulasi_id: x.regulasi_id ?? x.id ?? x.peraturan_id ?? x.id_peraturan ?? null,
      regulasi_kode: x.regulasi_kode ?? x.kode_peraturan ?? x.kode ?? x.no ?? null,
      regulasi_judul: x.regulasi_judul ?? x.judul_peraturan ?? x.judul ?? null,
      jumlah_temuan: Number(x.jumlah_temuan ?? x.total ?? x.jumlah ?? 0)
    }))
    .sort((a,b)=> b.jumlah_temuan - a.jumlah_temuan)
    .slice(0, topN);

  const temuanByKategori = Object.entries(
    bag.peraturan.reduce((acc:any, it:any)=>{
      const k = it.kategori ?? 'Lainnya';
      const n = Number(it.jumlah_temuan ?? it.total ?? it.jumlah ?? 0);
      acc[k] = (acc[k] ?? 0) + n;
      return acc;
    }, {})
  ).map(([kategori, jumlah])=>({ kategori, jumlah: jumlah as number }))
   .sort((a,b)=> (b as any).jumlah - (a as any).jumlah);

  const now = Date.now();
  const tlhiOpenOverdue = bag.tlhi
    .filter((it:any)=> String(it.status ?? '').toUpperCase()==='OPEN')
    .map((it:any)=> ({...it, is_overdue: it.due_date ? new Date(it.due_date).getTime() < now : false}))
    .filter((it:any)=> it.is_overdue);

  const trenParamSample = bag.trend.slice(Math.max(0, bag.trend.length - 20));

  return json({
    ok: errors.length === 0,
    dashboard: { ikk: null, temuanByKategori, tlhiOpenOverdue, peraturanTopN, trenParamSample },
    meta: { counts: {
      jadwal: bag.jadwal.length,
      jadwal_inspektur: bag.jadwal_ins.length,
      trend_param: bag.trend.length,
      peraturan_temuan: bag.peraturan.length,
      tlhi_inspektur: bag.tlhi.length
    }},
    errors // biarkan terlihat sementara — mudah untuk menghapus nanti
  });
}
