// src/lib/server/api/token.ts
import { setTimeout as delay } from 'node:timers/promises';

type LoginOk = {
  status: number;
  keterangan?: string;
  response: { access_token: string; token_type?: 'bearer'; expires_in: string | number };
};

const BASE_URL = process.env.DSS_BASE_URL ?? 'https://spl.bapeten.go.id/dss-smile/public/api';

class TokenManager {
  private token: string | null = null;
  private expiresAt = 0; // epoch ms
  private timer: NodeJS.Timeout | null = null;
  private refreshing = false;

  getAuthHeader(): Record<string, string> {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }

  private setToken(access_token: string, expires_in_secs: number) {
    this.token = access_token;
    // buffer 5 menit agar refresh lebih awal
    const bufferMs = 5 * 60 * 1000;
    this.expiresAt = Date.now() + expires_in_secs * 1000;
    // reschedule periodic refresh (55 menit default)
    this.scheduleRefresh(55);
  }

  async login(username?: string, password?: string) {
    const u = username ?? process.env.DSS_USERNAME;
    const p = password ?? process.env.DSS_PASSWORD;
    if (!u || !p) throw new Error('Creds missing: set DSS_USERNAME & DSS_PASSWORD');

    const res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u, password: p })
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Login failed: ${res.status} ${body}`);
    }

    const data = (await res.json()) as LoginOk;
    const token = data?.response?.access_token ?? (data as any)?.access_token;
    const expiresRaw = data?.response?.expires_in ?? (data as any)?.expires_in ?? 3600;
    const expiresIn = typeof expiresRaw === 'string' ? parseInt(expiresRaw, 10) : expiresRaw;

    if (!token) throw new Error('No access_token in response');
    this.setToken(token, Number.isFinite(expiresIn) ? expiresIn : 3600);
    return token;
  }

  async refresh() {
    if (this.refreshing) return; // de-dupe
    this.refreshing = true;
    try {
      if (!this.token) throw new Error('No token to refresh');
      const res = await fetch(`${BASE_URL}/refresh`, {
        method: 'POST',
        headers: { ...this.getAuthHeader() }
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(`Refresh failed: ${res.status} ${msg}`);
      }
      // API kadang mengembalikan {access_token,...} langsung
      const data = await res.json();
      const token = data?.response?.access_token ?? data?.access_token;
      const expiresRaw = data?.response?.expires_in ?? data?.expires_in ?? 3600;
      const expiresIn = typeof expiresRaw === 'string' ? parseInt(expiresRaw, 10) : expiresRaw;

      if (!token) throw new Error('No access_token on refresh');
      this.setToken(token, Number.isFinite(expiresIn) ? expiresIn : 3600);
      return token;
    } finally {
      this.refreshing = false;
    }
  }

  scheduleRefresh(everyMinutes = 55) {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      // refresh proaktif
      this.refresh().catch(() => {
        // jika gagal refresh periodik, tidak langsung logout di sini;
        // biarkan on-401 fallback menanganinya.
      });
    }, everyMinutes * 60 * 1000);
  }

  cancelSchedule() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  isExpiringSoon(bufferMs = 5 * 60 * 1000) {
    return !this.token || Date.now() + bufferMs >= this.expiresAt;
  }
}

// Singleton server-only
export const tokenManager = new TokenManager();
export const getAuthHeader = () => tokenManager.getAuthHeader();
export const login = (u?: string, p?: string) => tokenManager.login(u, p);
export const refresh = () => tokenManager.refresh();
