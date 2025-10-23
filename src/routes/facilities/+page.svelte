<!-- src/routes/facilities/+page.svelte -->
<script lang="ts">
  import type { Facility } from '$lib/server/smile/fasilitas';

  export let data;
  let facilities: Facility[] = data.facilities;
  let facets: Array<{ label: string; count: number }> = data.meta?.facets?.tipe ?? [];
  let total = data.meta?.counts?.total ?? undefined;
  if (typeof total !== 'number' || total < 0) total = facilities.length;
  let source = data.source;

  // UI state
  let q = '';
  let selectedTipe = ''; // '' = all
  let sortBy: 'nama_asc'|'nama_desc'|'tipe' = 'nama_asc';

  $: filtered = facilities
    .filter((f: Facility) => (selectedTipe ? (f.tipe ?? 'Tidak Terspesifikasi') === selectedTipe : true))
    .filter((f: Facility) => {
      const s = (f.nama + ' ' + (f.tipe ?? '')).toLowerCase();
      return s.includes(q.toLowerCase());
    })
    .sort((a: Facility, b: Facility) => {
      if (sortBy === 'nama_asc') return a.nama.localeCompare(b.nama);
      if (sortBy === 'nama_desc') return b.nama.localeCompare(a.nama);
      // tipe
      const ta = (a.tipe ?? 'ZZZ') + a.nama;
      const tb = (b.tipe ?? 'ZZZ') + b.nama;
      return ta.localeCompare(tb);
    });
</script>

<!-- Header Bar -->
<div class="bar">
  <h1>Fasilitas Diawasi</h1>
  <div class="actions">
    <a href="/api/export/pdf/facilities" class="btn" rel="noopener">Export PDF</a>
    <a href="/" class="btn ghost">← Kembali ke Dashboard</a>
  </div>
</div>

<!-- Main Content -->
<div class="wrap">
  <!-- Info Section -->
  <div class="info-panel">
    <div class="info-content">
      <h2 class="info-title">Fasilitas Diawasi</h2>
      <p class="info-subtitle">
        Total: <strong>{total}</strong> • Sumber: {source === 'official' ? 'API Resmi (/instalasi)' : 'Derived (/inspektur-jadwal-inspeksi)'}
      </p>
    </div>
  </div>

  <!-- Search and Filter Section -->
  <div class="filter-panel">
    <div class="filter-grid">
      <input
        class="filter-input"
        placeholder="Cari nama atau tipe…"
        bind:value={q} />

      <select class="filter-select" bind:value={selectedTipe}>
        <option value=''>Semua tipe</option>
        {#each facets as f}
          <option value={f.label}>{f.label} ({f.count})</option>
        {/each}
      </select>

      <select class="filter-select" bind:value={sortBy}>
        <option value="nama_asc">Nama A → Z</option>
        <option value="nama_desc">Nama Z → A</option>
        <option value="tipe">Tipe</option>
      </select>
    </div>
  </div>

  {#if filtered.length === 0}
    <div class="empty-state">
      <div class="empty-icon">🔍</div>
      <p>Tidak ada fasilitas yang cocok dengan filter.</p>
    </div>
  {:else}
    <!-- Facilities Grid -->
    <div class="facilities-grid">
      {#each filtered as f}
        <div class="facility-card">
          <div class="card-header">
            <div class="facility-id">{f.id}</div>
            <div class="facility-type">{f.tipe ?? 'Tidak terspesifikasi'}</div>
          </div>
          <div class="card-body">
            <h3 class="facility-name">{f.nama}</h3>
          </div>
          <div class="card-footer">
            <a class="detail-link" href={`/facility/${encodeURIComponent(f.id)}`}>
              Lihat Detail →
            </a>
          </div>
        </div>
      {/each}
    </div>
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

  /* Filter Panel */
  .filter-panel {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    padding: 16px;
    margin-bottom: 20px;
    box-shadow: 0 1px 0 rgba(0,0,0,.02);
  }

  .filter-grid {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    gap: 12px;
  }

  @media (max-width: 768px) {
    .filter-grid {
      grid-template-columns: 1fr;
    }
  }

  .filter-input,
  .filter-select {
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 14px;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .filter-input:focus,
  .filter-select:focus {
    outline: none;
    border-color: #0ea5e9;
    box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
  }

  .filter-input::placeholder {
    color: #9ca3af;
  }

  /* Empty State */
  .empty-state {
    text-align: center;
    padding: 60px 20px;
    color: #6b7280;
  }

  .empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  .empty-state p {
    font-size: 16px;
    margin: 0;
  }

  /* Facilities Grid */
  .facilities-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;
  }

  @media (max-width: 640px) {
    .facilities-grid {
      grid-template-columns: 1fr;
    }
  }

  /* Facility Card */
  .facility-card {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    padding: 20px;
    transition: all 0.3s ease;
    cursor: pointer;
    box-shadow: 0 1px 0 rgba(0,0,0,.02);
  }

  .facility-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0,0,0,.1);
    border-color: #0ea5e9;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
  }

  .facility-id {
    font-size: 12px;
    color: #6b7280;
    background: #f3f4f6;
    padding: 4px 8px;
    border-radius: 6px;
    font-family: monospace;
  }

  .facility-type {
    font-size: 12px;
    color: #0ea5e9;
    background: #f0f9ff;
    padding: 4px 8px;
    border-radius: 6px;
    font-weight: 500;
  }

  .card-body {
    margin-bottom: 16px;
  }

  .facility-name {
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
    line-height: 1.4;
  }

  .card-footer {
    border-top: 1px solid #f3f4f6;
    padding-top: 12px;
  }

  .detail-link {
    color: #0ea5e9;
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    transition: color 0.2s ease;
  }

  .detail-link:hover {
    color: #0284c7;
    text-decoration: underline;
  }

  /* Background */
  :global(body) {
    background: #f6f7f9;
  }

  /* Print styles */
  @media print {
    .bar .actions {
      display: none;
    }
    .filter-panel {
      display: none;
    }
    .facility-card {
      break-inside: avoid;
      margin-bottom: 16px;
    }
  }
</style>
