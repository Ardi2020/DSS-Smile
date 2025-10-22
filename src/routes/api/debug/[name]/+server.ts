import { json } from '@sveltejs/kit';
import { httpGet } from '$lib/server/api/http';

const map: Record<string, string> = {
  jadwal: '/inspeksi-jadwal',
  jadwalInspektur: '/inspektur-jadwal-inspeksi',
  tren: '/parameter/trend-parameter-bko',
  peraturan: '/peraturan/temuan',
  tlhi: '/tlhi/inspektur'
};

export const GET = async ({ params, url }) => {
  const path = map[params.name];
  if (!path) return new Response('unknown', { status: 404 });
  // teruskan page & limit dari query untuk eksplorasi
  const page = url.searchParams.get('page') ?? '1';
  const limit = url.searchParams.get('limit') ?? '50';
  const data = await httpGet(path, { page, limit });
  return json(data);
};
