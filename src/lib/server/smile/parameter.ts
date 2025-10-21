import { apiFetch } from '$lib/server/api/http';

export type ParamTrendPoint = {
  param_id: string | number;
  param_nama?: string;
  waktu: string;          // ISO time
  nilai: number;
  bko?: number;           // Batas Kendali Operasi (threshold)
};

export async function getTrendParamBKO(page = 1, limit = 200) {
  // SESUAIKAN PATH: contoh '/parameter/tren-bko'
  const qs = `?page=${page}&limit=${limit}`;
  const data = await apiFetch<{ items: ParamTrendPoint[]; total?: number }>(`/parameter/tren-bko${qs}`);
  const items = Array.isArray(data) ? (data as unknown as ParamTrendPoint[]) : (data.items ?? []);
  const total = (data as any).total ?? items.length;
  return { items, total };
}
