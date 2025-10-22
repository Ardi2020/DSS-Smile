import { apiFetch } from '$lib/server/api/http';
import { EP } from './endpoints';

export async function getTlhiInspektur(page=1, limit='50') {
  return apiFetch(`${EP.tlhiInspektur}?page=${page}&limit=${limit}`);
}
