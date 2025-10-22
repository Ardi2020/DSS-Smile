// src/lib/server/api/http.ts
import { getAuthHeader } from './token';
import { env } from '$env/dynamic/private';

const BASE = env.DSS_API_BASE;

// Wrapper untuk safe fetching dengan structured errors
export async function apiFetchSafe(
  path: string,
  init?: RequestInit
): Promise<{ ok: true; data: any } | { ok: false; status: number; message: string; path?: string }> {
  try {
    const res = await apiFetch(path, init as any);
    return { ok: true, data: res };
  } catch (e: any) {
    // Jika yang dilempar adalah Response dari SvelteKit
    if (e instanceof Response) {
      let msg = '';
      try { msg = await e.text(); } catch { /* ignore */ }
      return { ok: false, status: e.status, message: msg?.slice(0, 400), path: path };
    }
    const status = typeof e?.status === 'number' ? e.status : 500;
    const message = (e?.body ?? e?.message ?? 'Unknown').toString().slice(0, 400);
    return { ok: false, status, message, path };
  }
}

// Untuk kompatibilitas dengan spesifikasi dashboard
export const apiFetch = httpGet;

export async function httpGet(path: string, params?: Record<string, any>) {
  const url = new URL(path.startsWith('http') ? path : `${BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      // limit harus string, lainnya biarkan
      url.searchParams.set(k, typeof v === 'number' && k === 'limit' ? String(v) : String(v));
    });
  }

  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      ...getAuthHeader()
    }
  });

  const text = await res.text(); // untuk logging aman
  let data: any;
  try { data = text ? JSON.parse(text) : null; } catch { /* biarkan data undefined */ }

  if (!res.ok) {
    // lempar detail upstream agar mudah didiagnosis di server log
    const message = data?.keterangan || data?.message || `HTTP ${res.status}`;
    console.error('[HTTP ERROR]', { url: url.toString(), status: res.status, body: data ?? text });
    throw new Response(JSON.stringify({ status: res.status, message }), { status: res.status });
  }
  return data;
}
