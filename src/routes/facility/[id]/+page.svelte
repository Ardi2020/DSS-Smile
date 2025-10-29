<!-- src/routes/facility/[id]/+page.svelte -->
<script lang="ts">
  export let data;
  const { overview, jadwal, tlhi } = data;
  let error = !data.overview?.ok ? 'Gagal memuat data fasilitas' : null;
</script>

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

  .facility-header {
    flex: 1;
  }

  .bar h1 {
    font-size: 24px;
    font-weight: bold;
    color: #1f2937;
    margin: 0 0 4px 0;
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

  .kpi-card {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    padding: 20px;
    text-align: center;
    box-shadow: 0 1px 0 rgba(0,0,0,.02);
    transition: all 0.3s ease;
  }

  .kpi-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0,0,0,.1);
    border-color: #0ea5e9;
  }

  .kpi-label {
    font-size: 12px;
    color: #6b7280;
    text-transform: uppercase;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .kpi-value {
    font-size: 32px;
    font-weight: bold;
    color: #1f2937;
    margin-bottom: 4px;
  }

  .kpi-subtitle {
    font-size: 12px;
    color: #6b7280;
  }

  /* Data Grid */
  .grid.two {
    display: grid;
    gap: 16px;
    grid-template-columns: 1fr 1fr;
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
    box-shadow: 0 1px 0 rgba(0,0,0,.02);
    transition: all 0.3s ease;
  }

  .panel:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,.08);
    border-color: #0ea5e9;
  }

  .panel.full-width {
    grid-column: 1 / -1;
  }

  .panel-title {
    margin: 0 0 12px 0;
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
  }

  /* Data Table */
  .data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }

  .data-table th, .data-table td {
    padding: 10px 8px;
    border-top: 1px solid #f3f4f6;
    transition: background-color 0.2s ease;
  }

  .data-table thead th {
    text-align: left;
    color: #6b7280;
    font-weight: 600;
    border-top: none;
    background: #f9fafb;
    font-size: 13px;
  }

  .data-table tbody tr:hover {
    background: #f9fafb;
  }

  .data-table tbody td {
    color: #374151;
  }

  /* Data List */
  .data-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .data-list li {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-top: 1px solid #f3f4f6;
  }

  .data-list li:first-child {
    border-top: none;
  }

  .data-list.numbered {
    list-style: decimal;
    padding-left: 20px;
  }

  .data-list.numbered li {
    display: list-item;
    margin-left: 0;
    border-top: none;
    padding: 4px 0;
  }

  /* Error State */
  .error-state {
    text-align: center;
    padding: 60px 20px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 14px;
    color: #dc2626;
  }

  .error-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  .error-state h3 {
    font-size: 20px;
    font-weight: 600;
    margin: 0 0 8px 0;
    color: #dc2626;
  }

  .error-state p {
    font-size: 16px;
    margin: 0 0 20px 0;
    color: #7f1d1d;
  }

  /* Empty State */
  .empty-state {
    text-align: center;
    padding: 40px 20px;
    color: #6b7280;
  }

  .empty-icon {
    font-size: 32px;
    margin-bottom: 12px;
  }

  .empty-state p {
    font-size: 14px;
    margin: 0;
  }

  /* Background */
  :global(body) {
    background: #f6f7f9;
  }
</style>

<!-- Header Bar -->
<div class="bar">
  <div class="facility-header">
    <div class="text-xs text-gray-500">{overview.profile.id}</div>
    <h1 class="text-2xl font-bold">{overview.profile.nama}</h1>
    <p class="text-sm text-gray-600">{overview.profile.tipe ?? 'Tipe tidak diketahui'}</p>
  </div>
  <div class="actions">
    <button class="btn" on:click={() => window.location.href = `/facility/${encodeURIComponent(overview.profile.id)}?noCache=1`}>🔄 Refresh</button>
    <a href="/facilities" class="btn ghost">← Kembali ke Fasilitas</a>
    <a href="/" class="btn">Dashboard</a>
  </div>
</div>

<!-- Main Content -->
<div class="wrap">
  {#if error}
    <div class="error-state">
      <div class="error-icon">⚠️</div>
      <h3>Terjadi Kesalahan</h3>
      <p>{error}</p>
      <button class="btn" on:click={() => window.location.reload()}>Coba Lagi</button>
    </div>
  {:else}
    <!-- Info Panel -->
    <div class="info-panel">
      <div class="info-content">
        <h2 class="info-title">Detail Fasilitas</h2>
        <p class="info-subtitle">
          {overview.profile.nama} • {overview.profile.tipe ?? 'Tipe tidak diketahui'}
        </p>
      </div>
    </div>

  <!-- KPI Cards -->
  <section class="grid kpi">
    <div class="kpi-card">
      <div class="kpi-label">Jadwal</div>
      <div class="kpi-value">{overview.counts.jadwal}</div>
      <div class="kpi-subtitle">Total jadwal inspeksi</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">TLHI</div>
      <div class="kpi-value">{overview.counts.tlhi}</div>
      <div class="kpi-subtitle">Total item TLHI</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Top Temuan</div>
      <div class="kpi-value">{overview.counts.topTemuan}</div>
      <div class="kpi-subtitle">Regulasi yang sering dilanggar</div>
    </div>
  </section>

  <!-- Data Panels -->
  <section class="grid two">
    <div class="panel">
      <h3 class="panel-title">Jadwal Terkait</h3>
      {#if jadwal.count === 0}
        <div class="empty-state">
          <div class="empty-icon">📅</div>
          <p>Tidak ada jadwal inspeksi.</p>
        </div>
      {:else}
        <table class="data-table">
          <thead><tr>
            <th>Mulai</th>
            <th>Selesai</th>
            <th>Kegiatan</th>
          </tr></thead>
          <tbody>
            {#each jadwal.items.slice(0, 12) as j}
              <tr>
                <td>{j.tgl_mulai ?? '-'}</td>
                <td>{j.tgl_selesai ?? '-'}</td>
                <td>{j.kegiatan}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </div>

    <div class="panel">
      <h3 class="panel-title">TLHI Terkait</h3>
      {#if tlhi.count === 0}
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <p>Tidak ada item TLHI.</p>
        </div>
      {:else}
        <ul class="data-list">
          {#each tlhi.items.slice(0, 12) as t}
            <li>{t.judul ?? t.status ?? 'TLHI'}</li>
          {/each}
        </ul>
      {/if}
    </div>
  </section>

    <section class="panel full-width">
      <h3 class="panel-title">Top 10 Temuan Peraturan</h3>
      {#if overview.topTemuan.length === 0}
        <div class="empty-state">
          <div class="empty-icon">⚖️</div>
          <p>Tidak ada temuan peraturan.</p>
        </div>
      {:else}
        <ol class="data-list numbered">
          {#each overview.topTemuan as r}
            <li>{r.regulasi_kode} — {r.regulasi_judul} (<strong>{r.jumlah_temuan}</strong>)</li>
          {/each}
        </ol>
      {/if}
    </section>
  {/if}
</div>
