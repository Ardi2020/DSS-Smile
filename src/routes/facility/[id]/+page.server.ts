export const load = async ({ fetch, params }) => {
  const id = params.id;
  const [overview, jadwal, tlhi] = await Promise.all([
    fetch(`/api/facility/${encodeURIComponent(id)}/overview`).then((r) => r.json()),
    fetch(`/api/facility/${encodeURIComponent(id)}/jadwal`).then((r) => r.json()),
    fetch(`/api/facility/${encodeURIComponent(id)}/tlhi`).then((r) => r.json())
  ]);
  return { overview, jadwal, tlhi };
};
