<script lang="ts">
  export let data: { dashboard: any; error?: string };
  const dash = data?.dashboard;
  const err = data?.error;
</script>

<div class="wrap">
  <header class="bar">
    <h1>Balis SPK — Dashboard</h1>
    <form method="POST" action="/logout"><button class="btn" type="submit">Keluar</button></form>
  </header>

  {#if err}
    <div class="error">{err}</div>
  {/if}

  {#if dash}
    <section class="grid">
      <div class="card">
        <h2>Temuan per Kategori</h2>
        <ul>
          {#each dash.temuanByKategori as row}
            <li><strong>{row.kategori}</strong>: {row.jumlah}</li>
          {/each}
        </ul>
      </div>

      <div class="card">
        <h2>TLHI Open & Overdue</h2>
        <p>Total: {dash.tlhiOpenOverdue.length}</p>
      </div>

      <div class="card">
        <h2>Top Regulasi Dilanggar</h2>
        <ol>
          {#each dash.peraturanTopN as r}
            <li>{r.regulasi_kode ?? r.regulasi_id} — {r.jumlah_temuan}</li>
          {/each}
        </ol>
      </div>

      <div class="card">
        <h2>Sampel Tren Parameter vs BKO</h2>
        <p>Poin: {dash.trenParamSample.length}</p>
      </div>
    </section>
  {:else}
    <div class="loading">Memuat data dashboard…</div>
  {/if}
</div>

<style>
  .wrap { padding: 20px; max-width: 1100px; margin: 0 auto; }
  .bar { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
  .btn { padding:8px 12px; border-radius:8px; border:1px solid #ccc; cursor:pointer; }
  .grid { display:grid; gap:14px; grid-template-columns: repeat(auto-fit,minmax(260px,1fr)); }
  .card { border:1px solid #e5e7eb; border-radius:12px; padding:14px; background:#fff; }
  .error { background:#fff3f3; border:1px solid #ffc6c6; color:#b00020; padding:10px; border-radius:8px; }
  .loading { color:#666; }
  h1,h2 { margin:0 0 8px 0 }
  body { background:#f6f7f9 }
</style>
