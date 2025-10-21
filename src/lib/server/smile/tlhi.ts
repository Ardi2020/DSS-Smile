import { apiFetch } from '$lib/server/api/http';

export type TLHI = {
  id: string | number;
  nomor?: string;
  inspektur?: string;
  status: 'OPEN' | 'CLOSED' | string;
  due_date?: string;     // ISO date for overdue calc
  kategori?: string;
};

export async function getTlhiInspektur(page = 1, limit = 50) {
  // SESUAIKAN PATH: contoh '/tlhi/inspektur'
  const qs = `?page=${page}&limit=${limit}`;
  const data = await apiFetch<{ items: TLHI[]; total?: number }>(`/tlhi/inspektur${qs}`);
  const items = Array.isArray(data) ? (data as unknown as TLHI[]) : (data.items ?? []);
  const total = (data as any).total ?? items.length;
  return { items, total };
}
