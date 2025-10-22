import { apiFetch } from '$lib/server/api/http';
import { EP } from './endpoints';

export async function getTrendParamBKO(page=1, limit='200') {
  return apiFetch(`${EP.trendParamBKO}?page=${page}&limit=${limit}`);
}
