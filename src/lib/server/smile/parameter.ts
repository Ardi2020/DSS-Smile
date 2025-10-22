import { apiFetch } from '$lib/server/api/http';
import { EP } from './endpoints';

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
