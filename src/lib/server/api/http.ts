// src/lib/server/api/http.ts
import { getAuthHeader, refreshToken } from './token';
import { env } from '$env/dynamic/private';

const BASE = env.DSS_API_BASE ?? 'https://spl.bapeten.go.id/dss-smile/public/api';

type HttpOptions = { query?: Record<string, any>; signal?: AbortSignal };

function toQuery(q?: Record<string, any>) {
  if (!q) return '';
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) if (v !== undefined && v !== null) sp.set(k, String(v));
  const s = sp.toString();
  return s ? `?${s}` : '';
}

async function doFetch(path: string, opts: HttpOptions = {}, withAuth = true) {
  const res = await fetch(`${BASE}${path}${toQuery(opts.query)}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      ...(withAuth ? getAuthHeader() as Record<string, string> : {})
    } as Record<string, string>,
    signal: opts.signal
  });
  return res;
}

// Retry sekali bila 401 → refresh → ulangi
export async function fetchAuth(path: string, opts: HttpOptions = {}) {
  let res = await doFetch(path, opts, true);
  if (res.status === 401) {
    await refreshToken().catch(() => null);
    res = await doFetch(path, opts, true);
  }
  return res;
}

export async function getJson<T>(path: string, opts: HttpOptions = {}): Promise<T> {
  const res = await fetchAuth(path, opts);
  // Biarkan caller yang memutuskan kalau bukan 200
  const text = await res.text();
  try { return JSON.parse(text) as T; } catch { throw new Error(text); }
}

// Backward compatibility for other files
export async function httpGet(path: string, params?: Record<string, any>) {
  const res = await fetchAuth(path, { query: params });
  const text = await res.text();
  let data: any;
  try { data = text ? JSON.parse(text) : null; } catch { return { status: 500, keterangan: `JSON parse error: ${text.slice(0, 100)}` }; }
  return {
    status: res.status,
    keterangan: data?.keterangan ?? (res.ok ? 'OK' : `${res.status}`),
    response: data?.response ?? data?.data ?? null,
    meta: data?.meta ?? undefined
  };
}

export const apiFetch = httpGet;

export async function apiGet(fetch: typeof globalThis.fetch, path: string, token?: string, q: Record<string, string | number | undefined> = {}) {
  const data = await getJson(path, { query: q });
  return { ok: true, status: 200, data, raw: { response: data } };
}

export function getTokenFromGlobals(): string {
  const auth = getAuthHeader();
  return auth.Authorization ? auth.Authorization.slice(7) : ''; // remove 'Bearer '
}
