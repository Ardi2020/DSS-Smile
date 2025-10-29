import { apiFetch } from '$lib/server/api/http';
import { EP } from './endpoints';

export type TrendBkoRow = {
  kode_instalasi: string;
  nama_instalasi: string;
  lingkup: string | null;
  aspek: string | null;
  tgl_jam_mulai: string | null;   // ISO 8601 or null
  tgl_jam_selesai: string | null; // ISO 8601 or null
  parameter: string;
  nilai_parameter: number | null;
  nilai_bko: number | null;
  status_bko: 'NOT_SET' | 'OK' | 'OUT_OF_RANGE';
  nama_formulir: string | null;
};

function pickTime(r: TrendBkoRow): string | null {
  return r.tgl_jam_mulai ?? r.tgl_jam_selesai ?? null;
}

export async function fetchTrendBKO(opts: {
  facilityId: string;
  from: string;     // ISO
  to: string;       // ISO
  parameter?: string;
  limit?: number;   // default 500
  signal?: AbortSignal;
}): Promise<TrendBkoRow[]> {
  const { facilityId, from, to, parameter, signal } = opts;
  const limit = opts.limit ?? 500;

  const params = {
    kode_instalasi: facilityId,
    from_date: from,
    to_date: to,
    limit: String(limit),
    page: '1',
    ...(parameter && { parameter })
  };

  // Try primary endpoint first
  try {
    const res = await apiFetch(EP.trendParamBKO, params);

    if (res.status !== 200) {
      throw new Error(`[HTTP ${res.status}] trend-bko fetch failed: ${res.keterangan}`);
    }

    const rows: TrendBkoRow[] = Array.isArray(res.response) ? res.response : [];

    // If we have data, return it
    if (rows.length > 0) {
      // sort by time asc (robust bila sebagian null)
      return rows.sort((a, b) => {
        const ta = pickTime(a), tb = pickTime(b);
        if (!ta && !tb) return 0;
        if (!ta) return -1;
        if (!tb) return 1;
        return new Date(ta).getTime() - new Date(tb).getTime();
      });
    }
  } catch (e) {
    console.warn('Primary BKO endpoint failed, trying fallback:', e);
  }

  // Fallback to TLHM data
  try {
    const fallbackParams = {
      page: '1',
      limit: String(limit)
    };
    const res = await apiFetch(EP.tlhmMelebihiBKO, fallbackParams);

    if (res.status !== 200) {
      throw new Error(`[HTTP ${res.status}] fallback fetch failed: ${res.keterangan}`);
    }

    const fallbackRows: TrendBkoRow[] = Array.isArray(res.response) ? res.response : [];
    
    // Convert TLHM data to TrendBkoRow format
    const convertedRows: TrendBkoRow[] = fallbackRows.map((item: any) => ({
      kode_instalasi: item.kode_instalasi || facilityId,
      nama_instalasi: item.nama_instalasi || 'Unknown',
      lingkup: item.lingkup || null,
      aspek: item.aspek || null,
      tgl_jam_mulai: item.tgl_jam_mulai || item.tanggal || null,
      tgl_jam_selesai: item.tgl_jam_selesai || null,
      parameter: item.parameter || 'BKO Violation',
      nilai_parameter: item.nilai_parameter || item.nilai || 1,
      nilai_bko: item.nilai_bko || item.batas || 0,
      status_bko: 'OUT_OF_RANGE' as const,
      nama_formulir: item.nama_formulir || null
    }));

    // sort by time asc
    return convertedRows.sort((a, b) => {
      const ta = pickTime(a), tb = pickTime(b);
      if (!ta && !tb) return 0;
      if (!ta) return -1;
      if (!tb) return 1;
      return new Date(ta).getTime() - new Date(tb).getTime();
    });
  } catch (fallbackError) {
    // If both endpoints fail, return empty array
    console.warn('All BKO endpoints failed, returning empty data:', fallbackError);
    return [];
  }
}

// Normalizer: ubah berbagai bentuk record → { waktu, nilai, bko }
function normalizeTrend(records: any[]): Array<{ waktu: string; nilai: number; bko?: number }> {
  return (records ?? []).map((r: any) => {
    const waktu =
      r.waktu ?? r.tanggal ?? r.tgl ?? r.created_at ?? r.time ?? r.ts ?? null;
    const nilai = Number(r.nilai ?? r.value ?? r.hasil ?? r.y ?? r.val ?? NaN);
    const bko = r.bko ?? r.threshold ?? r.limit_bko ?? r.batas ?? undefined;
    return waktu && Number.isFinite(nilai) ? { waktu: String(waktu), nilai, bko } : null;
  }).filter(Boolean) as Array<{ waktu: string; nilai: number; bko?: number }>;
}

export async function getTrendParamBKO() {
  // Try 1: tanpa query param (paling aman untuk endpoint analitik)
  try {
    const res1 = await apiFetch(`${EP.trendParamBKO}`);
    const arr1 = Array.isArray(res1.response) ? res1.response
      : res1?.response?.response ?? res1?.response?.items ?? res1?.response?.data ?? [];
    const norm1 = normalizeTrend(arr1);
    if (norm1.length) return { items: norm1, tried: 'no-query' };
  } catch {/* lanjut Try 2 */}

  // Try 2: hanya limit (tanpa page)
  try {
    const res2 = await apiFetch(`${EP.trendParamBKO}?limit=200`);
    const arr2 = Array.isArray(res2.response) ? res2.response
      : res2?.response?.response ?? res2?.response?.items ?? res2?.response?.data ?? [];
    const norm2 = normalizeTrend(arr2);
    if (norm2.length) return { items: norm2, tried: 'limit-only' };
  } catch {/* lanjut Try 3 */}

  // Try 3: page+limit (kalau backend ternyata mendukung)
  try {
    const res3 = await apiFetch(`${EP.trendParamBKO}?page=1&limit=200`);
    const arr3 = Array.isArray(res3.response) ? res3.response
      : res3?.response?.response ?? res3?.response?.items ?? res3?.response?.data ?? [];
    const norm3 = normalizeTrend(arr3);
    if (norm3.length) return { items: norm3, tried: 'page+limit' };
  } catch {/* give up */}

  // Semua gagal → kembalikan kosong agar tidak meledak
  return { items: [], tried: 'failed' };
}
