import { json } from '@sveltejs/kit';
import { getAuthHeader } from '$lib/server/api/token';

export function GET() {
  return json({ hasToken: !!getAuthHeader().Authorization });
}
