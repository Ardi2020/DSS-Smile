import { apiFetch } from '$lib/server/api/http';

export type Jadwal = {
  id: string | number;
  tanggal: string;           // ISO date
  fasilitas?: string;
  lokasi?: string;
  inspektur?: string[];
  status?: string;           // planned/ongoing/done
};

export async function getJadwal(page = 1, limit = 50) {
  // SESUAIKAN PATH: contoh '/inspeksi/jadwal'
  const qs = `?page=${page}&limit=${limit}`;
  const data = await apiFetch<{ items: Jadwal[]; total?: number }>(`/inspeksi/jadwal${qs}`);
  // Normalisasi respons bila API mengembalikan array langsung:
  const items = Array.isArray(data) ? (data as unknown as Jadwal[]) : (data.items ?? []);
  const total = (data as any).total ?? items.length;
  return { items, total };
}

export async function getJadwalInspektur(page = 1, limit = 50) {
  // SESUAIKAN PATH: contoh '/inspeksi/jadwal-inspektur'
  const qs = `?page=${page}&limit=${limit}`;
  const data = await apiFetch<{ items: Jadwal[]; total?: number }>(`/inspeksi/jadwal-inspektur${qs}`);
  const items = Array.isArray(data) ? (data as unknown as Jadwal[]) : (data.items ?? []);
  const total = (data as any).total ?? items.length;
  return { items, total };
}
