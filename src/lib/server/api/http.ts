// src/lib/server/api/http.ts
import { tokenManager, getAuthHeader, refresh, login } from './token';
import { error as svelteError } from '@sveltejs/kit';

const BASE_URL = process.env.DSS_BASE_URL ?? 'https://spl.bapeten.go.id/dss-smile/public/api';

type ApiInit = RequestInit & { skipAuth?: boolean };

async function doFetch(path: string, init?: ApiInit) {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(init?.headers as Record<string, string> | undefined)
  };

  if (!init?.skipAuth) {
    Object.assign(headers, getAuthHeader());
  }

  const res = await fetch(url, { ...init, headers });
  return res;
}

export async function apiFetch<T = unknown>(path: string, init?: ApiInit): Promise<T> {
  // Pastikan token aktif (opsional): refresh kalau mau habis
  if (!init?.skipAuth && tokenManager.isExpiringSoon()) {
    try { await refresh(); } catch { /* biarkan 401 fallback */ }
  }

  let res = await doFetch(path, init);

  // Fallback on-401 → coba refresh → retry sekali
  if (res.status === 401 && !init?.skipAuth) {
    try {
      await refresh();
    } catch {
      // Refresh gagal → coba login ulang dengan env server
      await login();
    }
    res = await doFetch(path, init);
  }

  // Tangani error standar API
  if (!res.ok) {
    const bodyText = await res.text();
    // Seragamkan error SvelteKit (akan tertangkap handle errors)
    throw svelteError(res.status, bodyText || `HTTP ${res.status}`);
  }

  // API kadang membungkus payload di {status,keterangan,response,meta}
  const data = await res.json();
  return (data?.response ?? data) as T;
}
