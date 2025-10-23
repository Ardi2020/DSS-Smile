<script lang="ts">
  import KpiCard from '$lib/components/KpiCard.svelte';
  import TopTable from '$lib/components/TopTable.svelte';
  import TrendLine from '$lib/components/TrendLine.svelte';
  import PrioritasTable from '$lib/components/PrioritasTable.svelte';
  import TlhiOverdueTable from '$lib/components/TlhiOverdueTable.svelte';
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

  {#if data?.dashboard?.riskPrioritas?.length}
    <PrioritasTable items={data.dashboard.riskPrioritas} limit={5} />
  {/if}

  {#if data?.dashboard?.tlhiOverdueByFacility?.length}
    <TlhiOverdueTable items={data.dashboard.tlhiOverdueByFacility} limit={5} />
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
