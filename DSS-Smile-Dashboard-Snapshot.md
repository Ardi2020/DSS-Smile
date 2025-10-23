# DSS-Smile Dashboard Snapshot

Dokumentasi lengkap untuk review non-destruktif proyek DSS-Smile. Berisi semua konfigurasi, komponen, dan API yang digunakan untuk dashboard dan halaman facilities.

## 📋 Daftar Isi

1. [Project Configuration](#1-project-configuration)
2. [Application Structure](#2-application-structure)
3. [Pages & Components](#3-pages--components)
4. [API Integration](#4-api-integration)
5. [Environment Setup](#5-environment-setup)

---

## 1. Project Configuration

### 1.1 Package Configuration

```json
{
  "name": "dss-smile",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "prepare": "svelte-kit sync || echo ''",
    "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
    "check:watch": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --watch",
    "format": "prettier --write .",
    "lint": "prettier --check ."
  },
  "devDependencies": {
    "@sveltejs/adapter-auto": "^6.1.0",
    "@sveltejs/adapter-node": "^5.4.0",
    "@sveltejs/kit": "^2.43.2",
    "@sveltejs/vite-plugin-svelte": "^6.2.0",
    "@tailwindcss/postcss": "^4.1.15",
    "@types/node": "^24.9.1",
    "autoprefixer": "^10.4.21",
    "playwright": "^1.56.1",
    "postcss": "^8.5.6",
    "prettier": "^3.6.2",
    "prettier-plugin-svelte": "^3.4.0",
    "svelte": "^5.39.5",
    "svelte-check": "^4.3.2",
    "tailwindcss": "^4.1.15",
    "typescript": "^5.9.2",
    "vite": "^7.1.7"
  },
  "dependencies": {
    "zod": "^4.1.12"
  }
}
```

### 1.2 Svelte Configuration

```javascript
import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({ out: 'build' })
	}
};

export default config;
```

### 1.3 Vite Configuration

```typescript
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()]
});
```

### 1.4 TypeScript Configuration

```json
{
	"extends": "./.svelte-kit/tsconfig.json",
	"compilerOptions": {
		"allowJs": true,
		"checkJs": true,
		"esModuleInterop": true,
		"forceConsistentCasingInFileNames": true,
		"resolveJsonModule": true,
		"skipLibCheck": true,
		"sourceMap": true,
		"strict": true,
		"moduleResolution": "bundler"
	}
	// Path aliases are handled by https://svelte.dev/docs/kit/configuration#alias
	// except $lib which is handled by https://svelte.dev/docs/kit/configuration#files
	//
	// To make changes to top-level options such as include and exclude, we recommend extending
	// the generated config; see https://svelte.dev/docs/kit/configuration#typescript
}
```

### 1.5 Tailwind CSS Configuration

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,js,svelte,ts}'
  ],
  theme: {
    extend: {}
  },
  plugins: []
}
```

### 1.6 PostCSS Configuration

```javascript
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {}
  }
};
```

---

## 2. Application Structure

### 2.1 Layout System

#### Root Layout (`src/routes/+layout.svelte`)

```svelte
<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children?.()}
```

#### Layout Server (`src/routes/+layout.server.ts`)

```typescript
import type { LayoutServerLoad } from './$types';
import { getAuthHeader, refresh } from '$lib/server/api/token';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ url, cookies }) => {
  const isLogin = url.pathname === '/login';
  const authedCookie = cookies.get('dss_authed') === '1';
  let hasToken = !!getAuthHeader().Authorization;

  // Kalau cookie ada tapi token hilang (HMR/refresh), coba pulihkan
  if (authedCookie && !hasToken && !isLogin) {
    try { await refresh(); } catch {}
    hasToken = !!getAuthHeader().Authorization;
  }

  if (!isLogin && (!authedCookie || !hasToken)) {
    throw redirect(303, '/login');
  }

  return { authed: authedCookie && hasToken };
};
```

### 2.2 Styling System

#### Global Styles (`src/app.css`)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* optional: tone default */
:root {
  color-scheme: light;
}

@media print {
  a[href]::after { content: ""; } /* hilangkan URL setelah link */
  body { background: white; }
}
```

---

## 3. Pages & Components

### 3.1 Dashboard Page

#### Page Server (`src/routes/+page.server.ts`)

```typescript
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
  const res = await fetch('/api/dashboard');
  if (!res.ok) {
    return { dashboard: null, error: `Gagal memuat dashboard: ${res.status}` };
  }
  const { dashboard, meta, errors } = await res.json();
  return { dashboard, meta, errors };
};
```

#### Dashboard UI (`src/routes/+page.svelte`)

```svelte
<script lang="ts">
  import KpiCard from '$lib/components/KpiCard.svelte';
  import TopTable from '$lib/components/TopTable.svelte';
  import TrendLine from '$lib/components/TrendLine.svelte';
  import { invalidateAll } from '$app/navigation';

  export let data;
  const dash = data?.dashboard;
  const meta = data?.meta;
  const errors = data?.errors;
  const err = data?.error;

  let busy = false;

  async function refreshData() {
    busy = true;
    await invalidateAll();
    busy = false;
  }

  async function refreshToken() {
    busy = true;
    await fetch('/api/auth/refresh', { method: 'POST' }).catch(()=>{});
    await invalidateAll();
    busy = false;
  }
</script>

<!-- Header Bar -->
<div class="bar">
  <h1>Balis SPK — Dashboard</h1>
  <div class="actions">
    <a href="/facilities" class="btn">Fasilitas</a>
    <button class="btn" on:click={refreshData} disabled={busy}>{busy ? 'Merefresh…' : 'Refresh Data'}</button>
    <form method="POST" action="/logout"><button class="btn ghost" type="submit">Keluar</button></form>
    <button class="btn ghost" on:click={refreshToken} disabled={busy}>Refresh Token</button>
  </div>
</div>

<!-- Main Content -->
<div class="wrap">
  <!-- Info Section -->
  <div class="info-panel">
    <div class="info-content">
      <h2 class="info-title">Dashboard Balis SPK</h2>
      <p class="info-subtitle">
        Monitoring dan analisis data inspeksi fasilitas kesehatan
      </p>
    </div>
  </div>

  {#if err}
    <div class="error">{err}</div>
  {/if}

  {#if dash}
    <section class="grid kpi">
      <KpiCard title="Kategori Temuan" value={meta?.counts?.temuan_total ?? 0} subtitle="Total temuan lintas kategori"/>
      <KpiCard title="TLHI Open & Overdue" value={meta?.counts?.tlhi_items ?? 0} subtitle="Item terlambat ditutup"/>
      <KpiCard title="Top Regulasi" value={meta?.counts?.peraturan_temuan ?? 0} subtitle="Daftar prioritas pemeriksaan"/>
      <KpiCard title="Sampel Tren" value={meta?.counts?.trend_param ?? 0} subtitle="Poin data terakhir"/>
      <KpiCard title="Fasilitas Diawasi" value={meta?.counts?.facilities_count ?? 0} subtitle="Total fasilitas dari API resmi"/>
    </section>

    <section class="grid two">
      <div><TrendLine points={dash.trenParamSample ?? []} errors={errors ?? []} /></div>
      <div><TopTable rows={dash.peraturanTopN ?? []} /></div>
    </section>

    <section class="panel">
      <h3>Temuan per Kategori</h3>
      <ul class="cats">
        {#each dash.temuanByKategori as row}
          <li><span>{row.kategori}</span> <b>{row.jumlah}</b></li>
        {/each}
      </ul>
    </section>
  {:else}
    <div class="loading">Memuat data dashboard…</div>
  {/if}

  {#if meta}
    <footer class="meta">
      <small>Jadwal: {meta.jadwal?.count}/{meta.jadwal?.total} • Jadwal Inspektur: {meta.jadwal_inspektur?.count}/{meta.jadwal_inspektur?.total} • Trend points: {meta.trend_param_total}</small>
    </footer>
  {/if}
</div>

<style>
  /* Header Bar */
  .bar {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    padding: 0 20px;
  }

  .bar h1 {
    font-size: 24px;
    font-weight: bold;
    color: #1f2937;
    margin: 0;
  }

  .actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .btn {
    padding: 8px 12px;
    border-radius: 10px;
    border: 1px solid #0ea5e9;
    background: #0ea5e9;
    color: #fff;
    cursor: pointer;
    text-decoration: none;
    font-size: 14px;
    transition: all 0.2s ease;
  }

  .btn:hover {
    background: #0284c7;
    transform: translateY(-1px);
  }

  .btn.ghost {
    background: #fff;
    color: #0ea5e9;
    border-color: #cfeaf7;
  }

  .btn.ghost:hover {
    background: #f0f9ff;
    color: #0284c7;
  }

  /* Main Content */
  .wrap {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
  }

  /* Info Panel */
  .info-panel {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 14px;
    padding: 20px;
    margin-bottom: 20px;
    color: white;
  }

  .info-content {
    text-align: center;
  }

  .info-title {
    font-size: 28px;
    font-weight: bold;
    margin: 0 0 8px 0;
    color: white;
  }

  .info-subtitle {
    font-size: 14px;
    opacity: 0.9;
    margin: 0;
  }

  /* KPI Grid */
  .grid.kpi {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    margin-bottom: 20px;
  }

  .grid.two {
    display: grid;
    gap: 16px;
    grid-template-columns: 1.3fr 1fr;
    margin-bottom: 20px;
  }

  @media (max-width: 980px) {
    .grid.two {
      grid-template-columns: 1fr;
    }
  }

  /* Panel */
  .panel {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    padding: 16px;
    margin-bottom: 20px;
    box-shadow: 0 1px 0 rgba(0,0,0,.02);
  }

  .panel h3 {
    margin: 0 0 12px 0;
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
  }

  .cats {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .cats li {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-top: 1px solid #f3f4f6;
  }

  .cats li:first-child {
    border-top: none;
  }

  .cats span {
    color: #6b7280;
  }

  .cats b {
    font-weight: 600;
    color: #1f2937;
  }

  /* Error and Loading */
  .error {
    background: #fff3f3;
    border: 1px solid #ffc6c6;
    color: #b00020;
    padding: 10px;
    border-radius: 10px;
    margin-bottom: 20px;
  }

  .loading {
    color: #666;
    text-align: center;
    padding: 40px 20px;
  }

  /* Meta Footer */
  .meta {
    margin-top: 20px;
    color: #6b7280;
    text-align: center;
  }

  /* Background */
  :global(body) {
    background: #f6f7f9;
  }
</style>
```

### 3.2 Facility Detail Page

#### Page Server (`src/routes/facility/[id]/+page.server.ts`)

```typescript
export const load = async ({ fetch, params }) => {
  const id = params.id;
  const [overview, jadwal, tlhi] = await Promise.all([
    fetch(`/api/facility/${encodeURIComponent(id)}/overview`).then((r) => r.json()),
    fetch(`/api/facility/${encodeURIComponent(id)}/jadwal`).then((r) => r.json()),
    fetch(`/api/facility/${encodeURIComponent(id)}/tlhi`).then((r) => r.json())
  ]);
  return { overview, jadwal, tlhi };
};
```

#### Facility Detail UI (`src/routes/facility/[id]/+page.svelte`)

```svelte
<!-- src/routes/facility/[id]/+page.svelte -->
<script lang="ts">
  export let data;
  const { overview, jadwal, tlhi } = data;
</script>

<!-- Header -->
<div class="mb-4">
  <div class="text-xs text-gray-500">{overview.profile.id}</div>
  <h1 class="text-2xl font-bold">{overview.profile.nama}</h1>
  <p class="text-sm text-gray-600">{overview.profile.tipe ?? 'Tipe tidak diketahui'}</p>
</div>

<!-- Cards -->
<div class="grid sm:grid-cols-3 gap-3 mb-4">
  <div class="border rounded-xl p-4">
    <div class="text-xs text-gray-500">Jadwal</div>
    <div class="text-2xl font-semibold">{overview.counts.jadwal}</div>
  </div>
  <div class="border rounded-xl p-4">
    <div class="text-xs text-gray-500">TLHI</div>
    <div class="text-2xl font-semibold">{overview.counts.tlhi}</div>
  </div>
  <div class="border rounded-xl p-4">
    <div class="text-xs text-gray-500">Top Temuan</div>
    <div class="text-2xl font-semibold">{overview.counts.topTemuan}</div>
  </div>
</div>

<!-- Panels -->
<div class="grid lg:grid-cols-2 gap-4">
  <div class="border rounded-xl p-4">
    <h2 class="font-semibold mb-2">Jadwal Terkait</h2>
    {#if jadwal.count === 0}
      <div class="text-sm text-gray-500">Tidak ada data.</div>
    {:else}
      <table class="min-w-full text-sm">
        <thead><tr class="text-left text-gray-500">
          <th class="py-1 pr-2">Mulai</th>
          <th class="py-1 pr-2">Selesai</th>
          <th class="py-1 pr-2">Kegiatan</th>
        </tr></thead>
        <tbody>
          {#each jadwal.items.slice(0, 12) as j}
            <tr class="border-t">
              <td class="py-1 pr-2">{j.tgl_mulai ?? '-'}</td>
              <td class="py-1 pr-2">{j.tgl_selesai ?? '-'}</td>
              <td class="py-1 pr-2">{j.kegiatan}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>

  <div class="border rounded-xl p-4">
    <h2 class="font-semibold mb-2">TLHI Terkait</h2>
    {#if tlhi.count === 0}
      <div class="text-sm text-gray-500">Tidak ada data.</div>
    {:else}
      <ul class="list-disc ml-5 text-sm">
        {#each tlhi.items.slice(0, 12) as t}
          <li>{t.judul ?? t.status ?? 'TLHI'}</li>
        {/each}
      </ul>
    {/if}
  </div>

  <div class="border rounded-xl p-4 lg:col-span-2">
    <h2 class="font-semibold mb-2">Top 10 Temuan Peraturan</h2>
    {#if overview.topTemuan.length === 0}
      <div class="text-sm text-gray-500">Tidak ada data.</div>
    {:else}
      <ol class="list-decimal ml-5 text-sm">
        {#each overview.topTemuan as r}
          <li>{r.regulasi_kode} — {r.regulasi_judul} (<b>{r.jumlah_temuan}</b>)</li>
        {/each}
      </ol>
    {/if}
  </div>
</div>
```

### 3.3 Reusable Components

#### KPI Card Component (`src/lib/components/KpiCard.svelte`)

```svelte
<script lang="ts">
  export let title: string;
  export let value: number | string;
  export let subtitle: string = '';
</script>

<div class="card">
  <div class="t">{title}</div>
  <div class="v">{value}</div>
  {#if subtitle}<div class="s">{subtitle}</div>{/if}
</div>

<style>
  .card {
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    padding: 16px;
    background: #fff;
    display: flex;
    flex-direction: column;
    gap: 4px;
    box-shadow: 0 1px 0 rgba(0,0,0,.02);
    transition: all 0.3s ease;
    cursor: pointer;
  }

  .card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0,0,0,.1);
    border-color: #0ea5e9;
  }

  .t {
    font-size: 13px;
    color: #6b7280;
    font-weight: 500;
  }

  .v {
    font-size: 28px;
    font-weight: 700;
    color: #1f2937;
    line-height: 1.2;
  }

  .s {
    font-size: 12px;
    color: #9ca3af;
    line-height: 1.3;
  }
</style>
```

#### Top Table Component (`src/lib/components/TopTable.svelte`)

```svelte
<script lang="ts">
  export let rows: Array<{ regulasi_id: string | number; regulasi_kode?: string; regulasi_judul?: string; jumlah_temuan: number }>;
</script>

<div class="card">
  <h3>Top Regulasi Dilanggar</h3>
  <table>
    <thead><tr><th>Kode</th><th>Judul</th><th class="r">Temuan</th></tr></thead>
    <tbody>
      {#each rows as r}
        <tr>
          <td>{r.regulasi_kode ?? r.regulasi_id}</td>
          <td title={r.regulasi_judul}>{r.regulasi_judul ?? '—'}</td>
          <td class="r">{r.jumlah_temuan}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .card {
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    padding: 16px;
    background: #fff;
    box-shadow: 0 1px 0 rgba(0,0,0,.02);
    transition: all 0.3s ease;
  }

  .card:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,.08);
    border-color: #0ea5e9;
  }

  h3 {
    margin: 0 0 12px 0;
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }

  th, td {
    padding: 10px 8px;
    border-top: 1px solid #f3f4f6;
    transition: background-color 0.2s ease;
  }

  thead th {
    text-align: left;
    color: #6b7280;
    font-weight: 600;
    border-top: none;
    background: #f9fafb;
    font-size: 13px;
  }

  tbody tr:hover {
    background: #f9fafb;
  }

  .r {
    text-align: right;
    font-weight: 600;
    color: #1f2937;
  }

  tbody td {
    color: #374151;
  }
</style>
```

#### Trend Line Component (`src/lib/components/TrendLine.svelte`)

```svelte
<script lang="ts">
  // expects points: [{ waktu: ISO, nilai: number, bko?: number }]
  // also receives errors for graceful degrade
  export let points: Array<{ waktu: string; nilai: number; bko?: number }> = [];
  export let errors: Array<{ tag: string; status: number; message: string; path: string }> = [];
  // Check if trend has error
  const trendError = errors.find(e => e.tag === 'trend');

  // build scaled SVG path
  const w = 560, h = 160, pad = 18;
  const xs = points.map((p, i) => i);
  const ys = points.map(p => p.nilai);
  const minX = 0, maxX = Math.max(1, xs[xs.length-1] ?? 1);
  const minY = Math.min(...ys, 0), maxY = Math.max(...ys, 1);

  const sx = (x:number) => pad + (x - minX) / (maxX - minX) * (w - pad*2);
  const sy = (y:number) => h - pad - (y - minY) / (maxY - minY || 1) * (h - pad*2);

  const path = points
    .map((p, i) => `${i===0?'M':'L'} ${sx(i)},${sy(p.nilai)}`)
    .join(' ');

  // threshold (pakai rata-rata bko jika ada)
  const bkos = points.map(p=>p.bko).filter((v):v is number => typeof v==='number');
  const bko = bkos.length ? (bkos.reduce((a,b)=>a+b,0)/bkos.length) : null;
</script>

{#if points.length === 0 && trendError}
  <div class="card">
    <h3>Tren Parameter vs BKO (sample)</h3>
    <div class="text-sm text-gray-500">
      Tren tidak tersedia ({trendError.status}).
    </div>
  </div>
{:else}
  <div class="card">
    <h3>Tren Parameter vs BKO (sample)</h3>
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} class="chart">
      <rect x="0" y="0" width={w} height={h} fill="#fff"/>
      <!-- grid -->
      {#each [0,1,2,3,4] as i}
        <line x1={pad} x2={w-pad} y1={pad + i*((h-pad*2)/4)} y2={pad + i*((h-pad*2)/4)} stroke="#eef2f7"/>
      {/each}
      <!-- line -->
      <path d={path} fill="none" stroke="#0ea5e9" stroke-width="2.2" stroke-linecap="round"/>
      <!-- threshold -->
      {#if bko !== null}
        <line x1={pad} x2={w-pad} y1={sy(bko)} y2={sy(bko)} stroke="#ef4444" stroke-dasharray="5 5"/>
      {/if}
    </svg>
    <div class="legend">
      <span class="dot blue"></span> Nilai &nbsp;&nbsp;
      {#if bko !== null}<span class="line red"></span> BKO rata-rata{/if}
    </div>
  </div>
{/if}

<style>
  .card {
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    padding: 16px;
    background: #fff;
    box-shadow: 0 1px 0 rgba(0,0,0,.02);
    transition: all 0.3s ease;
  }

  .card:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,.08);
    border-color: #0ea5e9;
  }

  h3 {
    margin: 0 0 12px 0;
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
  }

  .chart {
    width: 100%;
    height: auto;
    display: block;
    border-radius: 10px;
    border: 1px solid #f3f4f6;
    background: #fafafa;
  }

  .legend {
    margin-top: 12px;
    font-size: 12px;
    color: #6b7280;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
  }

  .dot.blue {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 99px;
    background: #0ea5e9;
    margin-right: 6px;
  }

  .line.red {
    display: inline-block;
    width: 18px;
    height: 2px;
    background: #ef4444;
    margin-right: 6px;
  }

  .text-sm {
    font-size: 14px;
    color: #6b7280;
  }
</style>
```

---

## 4. API Integration

### 4.1 HTTP Client

#### HTTP Client (`src/lib/server/api/http.ts`)

```typescript
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
```

### 4.2 Authentication

#### Token Management (`src/lib/server/api/token.ts`)

```typescript
// src/lib/server/api/token.ts
// src/lib/server/api/token.ts
let ACCESS_TOKEN = '';
let EXPIRES_AT = 0; // epoch ms

export function setToken(token: string, ttlSec: number) {
  ACCESS_TOKEN = token;
  EXPIRES_AT = Date.now() + (ttlSec - 60) * 1000; // buffer 60s
}

export function getAuthHeader() {
  if (!ACCESS_TOKEN) return {};
  return { Authorization: `Bearer ${ACCESS_TOKEN}` };
}

export async function refreshToken() {
  if (!ACCESS_TOKEN) throw new Error('No token to refresh');
  // POST /refresh
  const res = await fetch('https://spl.bapeten.go.id/dss-smile/public/api/refresh', {
    method: 'POST',
    headers: { Accept: 'application/json', Authorization: `Bearer ${ACCESS_TOKEN}` }
  });
  if (!res.ok) throw new Error(`refresh failed: ${res.status}`);
  const data = await res.json();
  // Respons resmi berisi access_token, token_type, expires_in (string detik)
  setToken(data.access_token ?? data.response?.access_token, Number(data.expires_in ?? data.response?.expires_in ?? 3600));
}

export function shouldRefresh() {
  return Date.now() >= EXPIRES_AT;
}

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
    // Juga update global ACCESS_TOKEN untuk konsistensi
    setToken(token, Number.isFinite(expiresIn) ? expiresIn : 3600);
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
      setToken(token, Number.isFinite(expiresIn) ? expiresIn : 3600);
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

  clear() {
    this.token = null;
    this.expiresAt = 0;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  isExpiringSoon(bufferMs = 5 * 60 * 1000) {
    return !this.token || Date.now() + bufferMs >= this.expiresAt;
  }
}

// 🔒 Singleton tahan HMR
const g = globalThis as any;
export const tokenManager: TokenManager =
  g.__DSS_TOKEN_MANAGER__ ?? (g.__DSS_TOKEN_MANAGER__ = new TokenManager());

export const getAuthHeaderClass = () => tokenManager.getAuthHeader();
export const login = (u?: string, p?: string) => tokenManager.login(u, p);
export const refresh = () => tokenManager.refresh();
export const clearToken = () => tokenManager.clear();
```

### 4.3 DSS-SMILE API Wrappers

#### API Endpoints (`src/lib/server/smile/endpoints.ts`)

```typescript
export const EP = {
  jadwal:               '/inspeksi-jadwal',
  jadwalInspektur:      '/inspektur-jadwal-inspeksi',
  trendParamBKO:        '/parameter/trend-parameter-bko',
  peraturanTemuan:      '/peraturan/temuan',
  tlhiInspektur:        '/tlhi/inspektur'
} as const;
```

#### Facilities API (`src/lib/server/smile/fasilitas.ts`)

```typescript
// src/lib/server/smile/fasilitas.ts
import { getJson } from '$lib/server/api/http';

type DSSList<T> = {
  status: number;
  keterangan: string;
  response: T[];
  meta?: { total?: string; per_page?: string; current_page?: string; last_page?: string };
};

type InstalasiRaw = {
  kode_instalasi?: string;
  instalasi?: string;
  kode_jadwal?: string;
  sifat_inspeksi?: string;
  tgl_mulai?: string;
  tgl_selesai?: string;
  objek_inspeksi?: string;
  lingkup_inspeksi?: string;
  nilai_ikk?: string;
  ikk_aspek?: any[];
  temuan_aspek?: any[];
  memo_aspek?: any[];
  observasi?: any[];
  [k: string]: any;
};

export type Facility = {
  id: string;                 // dari kode_instalasi
  nama: string;               // dari instalasi
  tipe: string | null;        // objek_inspeksi || sifat_inspeksi
  lokasi: string | null;      // belum tersedia → null
  ringkas: {
    nilai_ikk: string | null;
    ikk_aspek_count: number;
    temuan_aspek_count: number;
  };
  __raw?: InstalasiRaw;       // opsional, untuk debugging (hapus di produksi jika tak perlu)
};

function normalize(row: InstalasiRaw): Facility {
  const id = String(row.kode_instalasi ?? '');
  const nama = String(row.instalasi ?? 'Tanpa Nama');
  const tipe = (row.objek_inspeksi ?? row.sifat_inspeksi ?? null) as string | null;
  const lokasi = null;

  return {
    id: id || nama, // fallback aman
    nama,
    tipe,
    lokasi,
    ringkas: {
      nilai_ikk: row.nilai_ikk ?? null,
      ikk_aspek_count: Array.isArray(row.ikk_aspek) ? row.ikk_aspek.length : 0,
      temuan_aspek_count: Array.isArray(row.temuan_aspek) ? row.temuan_aspek.length : 0
    },
    __raw: row
  };
}

export async function listFacilitiesOfficial(limitPerPage = 200): Promise<Facility[]> {
  const items: Facility[] = [];

  // halaman pertama
  let page = 1;
  // kita akan loop sampai last_page
  while (true) {
    const res = await getJson<DSSList<InstalasiRaw>>('/instalasi', { query: { page, limit: limitPerPage } });

    const rows = Array.isArray(res.response) ? res.response : [];
    for (const r of rows) items.push(normalize(r));

    const meta = res.meta ?? {};
    const cur = parseInt(String(meta.current_page ?? page), 10) || page;
    const last = parseInt(String(meta.last_page ?? page), 10) || page;

    if (cur >= last) break;
    page = cur + 1;
  }

  // Dedup by id (kalau ada duplikasi antar halaman)
  const uniq = new Map<string, Facility>();
  for (const it of items) {
    if (!uniq.has(it.id)) uniq.set(it.id, it);
  }

  return Array.from(uniq.values()).sort((a, b) => a.nama.localeCompare(b.nama));
}

// --- Simple in-memory cache 60 detik ---
const cache = new Map<string, { at: number; data: any }>();
function getCache(key: string) {
  const c = cache.get(key);
  if (!c) return null;
  if (Date.now() - c.at > 60_000) return null; // expired
  return c.data;
}
function setCache(key: string, data: any) {
  cache.set(key, { at: Date.now(), data });
}

// --- Derived list from jadwal ---
export async function listFacilitiesDerived(limitPerPage = 1000): Promise<Facility[]> {
  type JadwalRow = Record<string, any>;
  const res = await getJson<{ status: number; keterangan: string; response: JadwalRow[] }>('/inspektur-jadwal-inspeksi', { query: { page: 1, limit: limitPerPage } });

  const uniq = new Map<string, Facility>();
  for (const r of res.response ?? []) {
    // —— PRIORITAS KUNCI DARI JADWAL ——
    const id = r.kode_instalasi ?? r.fasilitas_id ?? r.id_fasilitas ?? r.instalasi_id ?? r.id ?? null;
    const nama = r.instalasi ?? r.nama_fasilitas ?? r.fasilitas ?? r.nama_instalasi ?? 'Tanpa Nama';
    const tipe = r.objek_inspeksi ?? r.jenis_fasilitas ?? r.tipe_instalasi ?? null;
    const lokasi = r.lokasi ?? r.alamat ?? r.kota ?? null;

    const f: Facility = {
      id: String(id ?? nama),
      nama: String(nama),
      tipe: tipe ? String(tipe) : null,
      lokasi: lokasi ? String(lokasi) : null,
      ringkas: {
        nilai_ikk: r.nilai_ikk ?? null,
        ikk_aspek_count: 0,
        temuan_aspek_count: 0
      }
    };
    if (!uniq.has(f.id)) uniq.set(f.id, f);
  }
  return Array.from(uniq.values()).sort((a, b) => a.nama.localeCompare(b.nama));
}
```

#### Jadwal API (`src/lib/server/smile/jadwal.ts`)

```typescript
import { apiFetch } from '$lib/server/api/http';
import { EP } from './endpoints';

export async function getJadwal(page=1, limit='50') {
  return apiFetch(`${EP.jadwal}?page=${page}&limit=${limit}`);
}
export async function getJadwalInspektur(page=1, limit='50') {
  return apiFetch(`${EP.jadwalInspektur}?page=${page}&limit=${limit}`);
}
```

#### Regulasi API (`src/lib/server/smile/regulasi.ts`)

```typescript
import { apiFetch } from '$lib/server/api/http';
import { EP } from './endpoints';

export async function getPeraturanTemuan(page=1, limit='50') {
  return apiFetch(`${EP.peraturanTemuan}?page=${page}&limit=${limit}`);
}
```

#### TLHI API (`src/lib/server/smile/tlhi.ts`)

```typescript
import { apiFetch } from '$lib/server/api/http';
import { EP } from './endpoints';

export async function getTlhiInspektur(page=1, limit='50') {
  return apiFetch(`${EP.tlhiInspektur}?page=${page}&limit=${limit}`);
}
```

#### Parameter API (`src/lib/server/smile/parameter.ts`)

```typescript
import { apiFetch } from '$lib/server/api/http';
import { EP } from './endpoints';

// Normalizer: ubah berbagai bentuk record → { waktu, nilai, bko }
function normalizeTrend(records: any[]): Array<{ waktu: string; nilai: number; bko?: number }> {
  return (records ?? []).map((r: any) => {
    const waktu = r.waktu ?? r.tanggal ?? r.tgl ?? r.created_at ?? r.time ?? r.ts ?? null;
    const nilai = Number(r.nilai ?? r.value ?? r.hasil ?? r.y ?? r.val ?? NaN);
    const bko = r.bko ?? r.threshold ?? r.limit_bko ?? r.batas ?? undefined;
    return waktu && Number.isFinite(nilai) ? { waktu: String(waktu), nilai, bko } : null;
  }).filter(Boolean) as Array<{ waktu: string; nilai: number; bko?: number }>;
}

export async function getTrendParamBKO() {
  // Try 1: tanpa query param (paling aman untuk endpoint analitik)
  try {
    const res1 = await apiFetch(`${EP.trendParamBKO}`);
    const arr1 = Array.isArray(res1.response) ? res1.response : res1?.response?.response ?? res1?.response?.items ?? res1?.response?.data ?? [];
    const norm1 = normalizeTrend(arr1);
    if (norm1.length) return { items: norm1, tried: 'no-query' };
  } catch {/* lanjut Try 2 */}

  // Try 2: hanya limit (tanpa page)
  try {
    const res2 = await apiFetch(`${EP.trendParamBKO}?limit=200`);
    const arr2 = Array.isArray(res2.response) ? res2.response : res2?.response?.response ?? res2?.response?.items ?? res2?.response?.data ?? [];
    const norm2 = normalizeTrend(arr2);
    if (norm2.length) return { items: norm2, tried: 'limit-only' };
  } catch {/* lanjut Try 3 */}

  // Try 3: page+limit (kalau backend ternyata mendukung)
  try {
    const res3 = await apiFetch(`${EP.trendParamBKO}?page=1&limit=200`);
    const arr3 = Array.isArray(res3.response) ? res3.response : res3?.response?.response ?? res3?.response?.items ?? res3?.response?.data ?? [];
    const norm3 = normalizeTrend(arr3);
    if (norm3.length) return { items: norm3, tried: 'page+limit' };
  } catch {/* give up */}

  // Semua gagal → kembalikan kosong agar tidak meledak
  return { items: [], tried: 'failed' };
}
```

#### Utility Functions (`src/lib/server/smile/util.ts`)

```typescript
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
```

### 4.4 API Endpoints

#### Dashboard API (`src/routes/api/dashboard/+server.ts`)

```typescript
// src/routes/api/dashboard/+server.ts
import type { RequestHandler } from '@sveltejs/kit';
import { getJson } from '$lib/server/api/http';
import { shouldRefresh, refreshToken } from '$lib/server/api/token';
import { listFacilitiesOfficial } from '$lib/server/smile/fasilitas';

type DSRes<T> = { status: number; keterangan: string; response: T; meta?: any };

export const GET: RequestHandler = async () => {
  const errors: Array<{ tag: string; status: number; message: string; path: string }> = [];

  // Jaga-jaga refresh proaktif
  if (shouldRefresh()) {
    try { await refreshToken(); } catch (e) { /* biarkan 401 downstream */ }
  }

  // 1) Peraturan top-N
  let peraturanTopN: any[] = [];
  try {
    const resp = await getJson<DSRes<any[]>>('/peraturan/temuan', { query: { page: 1, limit: 100 } });
    peraturanTopN = (resp.response ?? [])
      .map(r => ({
        regulasi_id: `${r.no_peraturan ? 'PB/PP' : ''}` || r.nama_peraturan,
        regulasi_kode: r.pasal,
        regulasi_judul: r.nama_peraturan,
        jumlah_temuan: Number(r.jumlah_temuan ?? 0)
      }))
      .sort((a, b) => b.jumlah_temuan - a.jumlah_temuan)
      .slice(0, 10);
  } catch (e: any) {
    errors.push({ tag: 'peraturan', status: 500, message: String(e?.message ?? e), path: '/peraturan/temuan' });
  }

  // 2) Temuan by kategori (kita treat "kategori" sebagai nama_peraturan/pasal fallback)
  let temuanByKategori: Array<{ kategori: string; jumlah: number }> = [];
  try {
    const resp = await getJson<DSRes<any[]>>('/peraturan/temuan', { query: { page: 1, limit: 100 } });
    const bucket: Record<string, number> = {};
    for (const r of (resp.response ?? [])) {
      const k = r.nama_peraturan ?? 'Lainnya';
      bucket[k] = (bucket[k] ?? 0) + Number(r.jumlah_temuan ?? 0);
    }
    temuanByKategori = Object.entries(bucket).map(([kategori, jumlah]) => ({ kategori, jumlah }));
  } catch (e: any) {
    errors.push({ tag: 'temuan', status: 500, message: String(e?.message ?? e), path: '/peraturan/temuan' });
  }

  // 3) TLHI (open/overdue) — saat ini belum ada filter, tampilkan raw length
  let tlhiOpenOverdue: any[] = [];
  try {
    const resp = await getJson<DSRes<any[]>>('/tlhi/inspektur', { query: { page: 1, limit: 100 } });
    tlhiOpenOverdue = resp.response ?? [];
  } catch (e: any) {
    errors.push({ tag: 'tlhi', status: 500, message: String(e?.message ?? e), path: '/tlhi/inspektur' });
  }

  // 4) Tren Parameter (opsional; graceful on 500)
  let trenParamSample: any[] = [];
  try {
    const resp = await getJson<DSRes<any[]>>('/parameter/trend-parameter-bko', { query: { page: 1, limit: 50 } });
    trenParamSample = resp.response ?? [];
  } catch (e: any) {
    errors.push({ tag: 'trend', status: 500, message: String(e?.message ?? e), path: '/parameter/trend-parameter-bko' });
    trenParamSample = []; // biarkan kosong untuk chart placeholder
  }

  // 5) Fasilitas resmi (untuk hitung total fasilitas)
  let facilitiesCount: number = 0;
  try {
    const facilities = await listFacilitiesOfficial(1000); // limit tinggi untuk total
    facilitiesCount = facilities.length;
  } catch (e: any) {
    errors.push({ tag: 'facilities', status: 500, message: String(e?.message ?? e), path: '/instalasi' });
  }

  // Ringkasan untuk kartu
  const totalTemuan = temuanByKategori.reduce((s, it) => s + (Number(it.jumlah) || 0), 0);
  const dashboard = {
    ikk: null,
    temuanByKategori,
    tlhiOpenOverdue,
    peraturanTopN,
    trenParamSample
  };

  // Partial OK: true jika ada minimal satu modul berisi data
  const anyData =
    (peraturanTopN.length > 0) ||
    (temuanByKategori.length > 0 && totalTemuan > 0) ||
    (tlhiOpenOverdue.length > 0) ||
    (trenParamSample.length > 0) ||
    (facilitiesCount > 0);

  const meta = {
    counts: {
      peraturan_temuan: peraturanTopN.length,
      temuan_total: totalTemuan,
      tlhi_items: tlhiOpenOverdue.length,
      trend_param: trenParamSample.length,
      facilities_count: facilitiesCount
    }
  };

  return new Response(
    JSON.stringify({ ok: anyData, dashboard, meta, errors }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
```

#### Facilities API (`src/routes/api/facilities/+server.ts`)

```typescript
// src/routes/api/facilities/+server.ts
import type { RequestHandler } from '@sveltejs/kit';
import { listFacilitiesOfficial, listFacilitiesDerived } from '$lib/server/smile/fasilitas';

const cache = new Map<string, { at: number; data: any }>();
const TTL = 60_000;

function getCache(key: string) {
  const c = cache.get(key);
  if (!c) return null;
  if (Date.now() - c.at > TTL) return null;
  return c.data;
}
function setCache(key: string, data: any) {
  // JANGAN cache payload kosong
  if (Array.isArray(data?.facilities) && data.facilities.length === 0) return;
  cache.set(key, { at: Date.now(), data });
}

export const GET: RequestHandler = async ({ url }) => {
  const limit = Number(url.searchParams.get('limit') ?? 1000);
  const noCache = url.searchParams.get('noCache') === '1';
  const key = `facilities:${limit}`;

  if (!noCache) {
    const cached = getCache(key);
    if (cached) return new Response(JSON.stringify(cached), { headers: { 'Content-Type': 'application/json' } });
  }

  const payload: any = { ok: true, facilities: [], source: 'official', errors: [] as any[] };

  try {
    const official = await listFacilitiesOfficial(limit);
    if (official.length > 0) {
      payload.facilities = official;
      payload.source = 'official';
    } else {
      payload.errors.push('official-empty');
      const derived = await listFacilitiesDerived(limit);
      payload.facilities = derived;
      payload.source = 'derived';
    }
  } catch (e: any) {
    payload.errors.push(String(e?.message ?? e));
    try {
      const derived = await listFacilitiesDerived(limit);
      payload.facilities = derived;
      payload.source = 'derived';
    } catch (e2: any) {
      payload.ok = false;
      payload.errors.push(String(e2?.message ?? e2));
    }
  }

  // Facets & meta dihitung dari hasil final
  const byTipe = new Map<string, number>();
  for (const f of payload.facilities) {
    const k = f.tipe ?? 'Tidak Terspesifikasi';
    byTipe.set(k, (byTipe.get(k) ?? 0) + 1);
  }
  payload.meta = {
    counts: { total: payload.facilities.length },
    facets: { tipe: Array.from(byTipe.entries()).map(([label, count]) => ({ label, count })) },
    updated_at: new Date().toISOString()
  };

  // Cache hanya jika ada isi
  if (payload.ok && payload.facilities.length > 0 && !noCache) setCache(key, payload);

  return new Response(JSON.stringify(payload), { headers: { 'Content-Type': 'application/json' } });
};
```

#### Facility Overview API (`src/routes/api/facility/[id]/overview/+server.ts`)

```typescript
// src/routes/api/facility/[id]/overview/+server.ts
import type { RequestHandler } from '@sveltejs/kit';
import { getJson } from '$lib/server/api/http';
import { cacheGet, cacheSet, matchFacility } from '$lib/server/smile/util';

type DSList<T> = { status: number; keterangan: string; response: T[] };
type Row = Record<string, any>;

export const GET: RequestHandler = async ({ params, url }) => {
  if (!params.id) throw new Error('ID fasilitas tidak disediakan');
  const id = decodeURIComponent(params.id);
  const ttl = Number(url.searchParams.get('ttl') ?? 60_000);
  const ck = `facility_overview:${id}`;
  const cached = cacheGet(ck, ttl);
  if (cached) return new Response(JSON.stringify(cached), { headers: { 'Content-Type': 'application/json' } });

  // 1) Ambil daftar fasilitas dari BFF existing untuk dapatkan nama/tipe
  const fac = await fetch(url.origin + '/api/facilities').then(r => r.json());
  const profile = (fac.facilities ?? []).find((f: any) => String(f.id) === id) ?? { id, nama: id, tipe: null, lokasi: null };

  // 2) Ambil jadwal (basis kuat untuk filter)
  const jadwalRes = await getJson<DSList<Row>>('/inspektur-jadwal-inspeksi', { query: { page: 1, limit: 1000 } });
  const jadwal = (jadwalRes.response ?? []).filter(r => matchFacility(r, id, profile.nama));

  // 3) (Optional) TLHI — jika endpoint tersedia, ganti path di bawah; kalau belum, set []
  let tlhi: Row[] = [];
  try {
    const tlhiRes = await getJson<DSList<Row>>('/tlhi/inspektur', { query: { page: 1, limit: 1000 } });
    tlhi = (tlhiRes.response ?? []).filter(r => matchFacility(r, id, profile.nama));
  } catch {
    tlhi = [];
  }

  // 4) (Optional) Temuan/peraturan — reuse peraturan/temuan dan filter bila ada kolom fasilitas
  let topTemuan: Array<{ regulasi_kode: string; regulasi_judul: string; jumlah_temuan: number }> = [];
  try {
    const pr = await getJson<DSList<Row>>('/peraturan/temuan', { query: { page: 1, limit: 1000 } });
    const filtered = (pr.response ?? []).filter(r => matchFacility(r, id, profile.nama));
    const agg = new Map<string, { kode: string; judul: string; n: number }>();
    for (const r of filtered) {
      const kode = String(r.pasal ?? r.regulasi_kode ?? '-');
      const judul = String(r.nama_peraturan ?? r.regulasi_judul ?? 'Peraturan');
      const key = `${kode}|${judul}`;
      const cur = agg.get(key) ?? { kode, judul, n: 0 };
      cur.n += Number(r.jumlah_temuan ?? r.count ?? 1);
      agg.set(key, cur);
    }
    topTemuan = Array.from(agg.values())
      .map(x => ({ regulasi_kode: x.kode, regulasi_judul: x.judul, jumlah_temuan: x.n }))
      .sort((a, b) => b.jumlah_temuan - a.jumlah_temuan)
      .slice(0, 10);
  } catch {
    topTemuan = [];
  }

  const payload = {
    ok: true,
    id: profile.id,
    profile,
    counts: {
      jadwal: jadwal.length,
      tlhi: tlhi.length,
      topTemuan: topTemuan.length
    },
    samples: {
      jadwal: jadwal.slice(0, 5),
      tlhi: tlhi.slice(0, 5)
    },
    topTemuan
  };

  cacheSet(ck, payload);
  return new Response(JSON.stringify(payload), { headers: { 'Content-Type': 'application/json' } });
};
```

#### Facility Jadwal API (`src/routes/api/facility/[id]/jadwal/+server.ts`)

```typescript
// src/routes/api/facility/[id]/jadwal/+server.ts
import type { RequestHandler } from '@sveltejs/kit';
import { getJson } from '$lib/server/api/http';
import { cacheGet, cacheSet, matchFacility } from '$lib/server/smile/util';

type DSList<T> = { status: number; keterangan: string; response: T[] };
type Row = Record<string, any>;

export const GET: RequestHandler = async ({ params, url }) => {
  if (!params.id) throw new Error('ID fasilitas tidak disediakan');
  const id = decodeURIComponent(params.id);
  const ttl = Number(url.searchParams.get('ttl') ?? 60_000);
  const ck = `facility_jadwal:${id}`;
  const cached = cacheGet(ck, ttl);
  if (cached) return new Response(JSON.stringify(cached), { headers: { 'Content-Type': 'application/json' } });

  // Ambil profil fasilitas untuk nama
  const fac = await fetch(url.origin + '/api/facilities').then(r => r.json());
  const profile = (fac.facilities ?? []).find((f: any) => String(f.id) === id) ?? { nama: id };

  const res = await getJson<DSList<Row>>('/inspektur-jadwal-inspeksi', { query: { page: 1, limit: 1000 } });
  const all = res.response ?? [];
  const items = all
    .filter((r) => matchFacility(r, id, profile.nama))
    .map((j) => ({
      tgl_mulai: j.tgl_mulai ?? j.tanggal_mulai ?? j.tanggal ?? null,
      tgl_selesai: j.tgl_selesai ?? j.tanggal_selesai ?? null,
      kegiatan: j.kegiatan ?? j.lingkup_inspeksi ?? j.objek_inspeksi ?? j.sifat_inspeksi ?? '-',
      kode_jadwal: j.kode_jadwal ?? null,
      raw: j
    }));

  const payload = { ok: true, id, count: items.length, items, updated_at: new Date().toISOString() };
  cacheSet(ck, payload);
  return new Response(JSON.stringify(payload), { headers: { 'Content-Type': 'application/json' } });
};
```

#### Facility TLHI API (`src/routes/api/facility/[id]/tlhi/+server.ts`)

```typescript
// src/routes/api/facility/[id]/tlhi/+server.ts
import type { RequestHandler } from '@sveltejs/kit';
import { getJson } from '$lib/server/api/http';
import { cacheGet, cacheSet, matchFacility } from '$lib/server/smile/util';

type DSList<T> = { status: number; keterangan: string; response: T[] };
type Row = Record<string, any>;

export const GET: RequestHandler = async ({ params, url }) => {
  if (!params.id) throw new Error('ID fasilitas tidak disediakan');
  const id = decodeURIComponent(params.id);
  const ttl = Number(url.searchParams.get('ttl') ?? 60_000);
  const ck = `facility_tlhi:${id}`;
  const cached = cacheGet(ck, ttl);
  if (cached) return new Response(JSON.stringify(cached), { headers: { 'Content-Type': 'application/json' } });

  // Ambil profil fasilitas untuk nama
  const fac = await fetch(url.origin + '/api/facilities').then(r => r.json());
  const profile = (fac.facilities ?? []).find((f: any) => String(f.id) === id) ?? { nama: id };

  let items: Row[] = [];
  try {
    const res = await getJson<DSList<Row>>('/tlhi/inspektur', { query: { page: 1, limit: 1000 } });
    items = (res.response ?? []).filter(r => matchFacility(r, id, profile.nama));
  } catch {
    items = [];
  }

  const payload = { ok: true, id, items };
  cacheSet(ck, payload);
  return new Response(JSON.stringify(payload), { headers: { 'Content-Type': 'application/json' } });
};
```

---

## 5. Environment Setup

### 5.1 Environment Template (`.env.example`)

```bash
# Kredensial hanya dipakai di server; jangan pernah di-echo ke client
DSS_API_BASE="https://spl.bapeten.go.id/dss-smile/public/api"
DSS_USERNAME=your_username
DSS_PASSWORD=your_password
```

---

## 📋 Setup Instructions

### Prerequisites
- Node.js 18+
- npm atau pnpm

### Installation
```bash
# 1. Clone repository
git clone <repository-url>
cd dss-smile

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
# Edit .env dengan kredensial DSS-SMILE Anda

# 4. Run development server
npm run dev
```

### Development
- Dashboard: `http://localhost:5173/`
- Facilities: `http://localhost:5173/facilities`
- API Documentation: Available through API endpoints

### Build
```bash
npm run build
npm run preview
```

---

## 🔧 Architecture Overview

### **Frontend Stack:**
- **SvelteKit**: Full-stack framework dengan SSR
- **TypeScript**: Type safety untuk development
- **Tailwind CSS**: Utility-first CSS framework
- **PostCSS**: CSS processing dan optimization

### **Backend Integration:**
- **DSS-SMILE API**: External API untuk data inspeksi
- **Authentication**: Bearer token dengan auto-refresh
- **Caching**: In-memory caching untuk performance
- **Error Handling**: Graceful degradation untuk API failures

### **Key Features:**
- ✅ **Responsive Design**: Mobile-first approach
- ✅ **Real-time Data**: Auto-refresh authentication tokens
- ✅ **Error Resilience**: Graceful handling of API failures
- ✅ **Performance**: Client-side caching dan pagination
- ✅ **Type Safety**: Full TypeScript implementation

---

*Snapshot created on: $(date)*
*DSS-Smile Version: 0.0.1*
*Review Status: Ready for non-destructive review*
