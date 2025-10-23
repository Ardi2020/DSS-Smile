export function matchFacility(row: Record<string, any>, id: string, name?: string) {
  const keys = [
    'fasilitas_id', 'id_fasilitas', 'instalasi_id', 'kode_instalasi', 'id',
    'nama_fasilitas', 'fasilitas', 'instalasi', 'nama_instalasi'
  ];
  const v = (k: string) => String(row?.[k] ?? '');
  const idStr = String(id);
  const nameStr = String(name ?? '');

  // cocokkan id dulu
  if (keys.some(k => v(k) === idStr)) return true;
  // fallback: cocokkan nama bila disediakan
  if (name && keys.some(k => v(k) === nameStr)) return true;

  return false;
}

// cache in-memory sederhana
const _cache = new Map<string, { at: number; data: any }>();
export function cacheGet(key: string, ttlMs = 60_000) {
  const c = _cache.get(key);
  if (!c) return null;
  if (Date.now() - c.at > ttlMs) return null;
  return c.data;
}
export function cacheSet(key: string, data: any) {
  _cache.set(key, { at: Date.now(), data });
}
