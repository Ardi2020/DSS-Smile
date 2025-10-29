export const load = async ({ fetch, url }) => {
  const noCache = url.searchParams.get('noCache') === '1';
  const apiUrl = noCache ? '/api/facilities?noCache=1' : '/api/facilities';
  const r = await fetch(apiUrl);
  const j = await r.json();
  return {
    facilities: j.facilities ?? [],
    meta: j.meta ?? {},
    source: j.source ?? 'official',
    ok: j.ok ?? true,
    error: j.error || (!j.ok ? 'Gagal memuat data fasilitas' : null)
  };
};
