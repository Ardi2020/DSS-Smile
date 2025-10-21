import { apiFetch } from '$lib/server/api/http';

export type PeraturanTemuan = {
  regulasi_id: string | number;
  regulasi_kode?: string;          // e.g., "Perka-XX/201X"
  regulasi_judul?: string;
  kategori?: string;               // untuk temuanByKategori
  jumlah_temuan: number;
};

export async function getPeraturanTemuan(page = 1, limit = 50) {
  // SESUAIKAN PATH: contoh '/regulasi/temuan'
  const qs = `?page=${page}&limit=${limit}`;
  const data = await apiFetch<{ items: PeraturanTemuan[]; total?: number }>(`/regulasi/temuan${qs}`);
  const items = Array.isArray(data) ? (data as unknown as PeraturanTemuan[]) : (data.items ?? []);
  const total = (data as any).total ?? items.length;
  return { items, total };
}
