import { apiFetch } from '$lib/server/api/http';
import { EP } from './endpoints';

export async function getJadwal(page=1, limit='50') {
  return apiFetch(`${EP.jadwal}?page=${page}&limit=${limit}`);
}
export async function getJadwalInspektur(page=1, limit='50') {
  return apiFetch(`${EP.jadwalInspektur}?page=${page}&limit=${limit}`);
}
