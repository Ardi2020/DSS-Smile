<script lang="ts">
  import KpiCard from '$lib/components/KpiCard.svelte';
  import TopTable from '$lib/components/TopTable.svelte';
  import TrendLine from '$lib/components/TrendLine.svelte';
  import { invalidateAll } from '$app/navigation';

  export let data;
  const dash = data?.dashboard;
  const meta = data?.meta;
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

<div class="wrap">
  <header class="bar">
    <h1>Balis SPK — Dashboard</h1>
    <div class="actions">
      <button class="btn" on:click={refreshData} disabled={busy}>{busy ? 'Merefresh…' : 'Refresh Data'}</button>
      <form method="POST" action="/logout"><button class="btn ghost" type="submit">Keluar</button></form>
      <button class="btn ghost" on:click={refreshToken} disabled={busy}>Refresh Token</button>
    </div>
  </header>

  {#if err}
    <div class="error">{err}</div>
  {/if}

  {#if dash}
    <section class="grid kpi">
      <KpiCard title="Kategori Temuan" value={dash.temuanByKategori?.length ?? 0} subtitle="Jumlah kategori aktif"/>
      <KpiCard title="TLHI Open & Overdue" value={dash.tlhiOpenOverdue?.length ?? 0} subtitle="Item terlambat ditutup"/>
      <KpiCard title="Top Regulasi" value={dash.peraturanTopN?.length ?? 0} subtitle="Daftar prioritas pemeriksaan"/>
      <KpiCard title="Sampel Tren" value={dash.trenParamSample?.length ?? 0} subtitle="Poin data terakhir"/>
    </section>

    <section class="grid two">
      <div><TrendLine points={dash.trenParamSample ?? []} /></div>
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
  .wrap { padding: 20px; max-width: 1200px; margin: 0 auto; }
  .bar { display:flex; gap:12px; align-items:center; justify-content:space-between; margin-bottom:16px; }
  .actions { display:flex; gap:8px; align-items:center }
  .btn { padding:8px 12px; border-radius:10px; border:1px solid #0ea5e9; background:#0ea5e9; color:#fff; cursor:pointer }
  .btn.ghost { background:#fff; color:#0ea5e9; border-color:#cfeaf7 }
  .grid.kpi { display:grid; gap:12px; grid-template-columns: repeat(auto-fit,minmax(200px,1fr)); margin-bottom:12px }
  .grid.two { display:grid; gap:12px; grid-template-columns: 1.3fr 1fr; margin-bottom:12px }
  @media (max-width: 980px){ .grid.two { grid-template-columns: 1fr } }
  .panel { border:1px solid #e5e7eb; border-radius:14px; background:#fff; padding:14px }
  .cats { list-style:none; margin:0; padding:0 }
  .cats li { display:flex; justify-content:space-between; padding:8px 0; border-top:1px solid #f0f2f5 }
  .cats li:first-child { border-top:none }
  .error { background:#fff3f3; border:1px solid #ffc6c6; color:#b00020; padding:10px; border-radius:10px; margin-bottom:12px }
  .loading { color:#666 }
  .meta { margin-top:10px; color:#6b7280; text-align:center }
  body { background:#f6f7f9 }
</style>
