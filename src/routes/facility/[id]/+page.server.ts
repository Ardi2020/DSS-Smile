export const load = async ({ fetch, params, url }) => {
  const id = decodeURIComponent(params.id);
  const noCache = url.searchParams.get('noCache') === '1';
  const apiParams = noCache ? '?noCache=1' : '';

  try {
    const [overview, jadwal, tlhi] = await Promise.all([
      fetch(`/api/facility/${encodeURIComponent(id)}/overview${apiParams}`).then((r) => r.json()),
      fetch(`/api/facility/${encodeURIComponent(id)}/jadwal${apiParams}`).then((r) => r.json()),
      fetch(`/api/facility/${encodeURIComponent(id)}/tlhi${apiParams}`).then((r) => r.json())
    ]);
    return { overview, jadwal, tlhi };
  } catch (error) {
    return {
      overview: { ok: false, error: 'Gagal memuat data fasilitas' },
      jadwal: { ok: false, items: [], count: 0 },
      tlhi: { ok: false, items: [], count: 0 }
    };
  }
};
