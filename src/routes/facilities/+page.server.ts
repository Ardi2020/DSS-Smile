export const load = async ({ fetch }) => {
  const r = await fetch('/api/facilities');
  const j = await r.json();
  return { facilities: j.facilities ?? [], meta: j.meta ?? {}, source: j.source ?? 'official' };
};
