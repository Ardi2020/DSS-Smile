import { apiFetch } from '$lib/server/api/http';
import { EP } from './endpoints';

export async function getPeraturanTemuan(page=1, limit='50') {
  return apiFetch(`${EP.peraturanTemuan}?page=${page}&limit=${limit}`);
}
