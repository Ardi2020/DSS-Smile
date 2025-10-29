<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';

  type TrendRow = {
    tgl_jam_mulai: string | null;
    tgl_jam_selesai: string | null;
    parameter: string;
    nilai_parameter: number | null;
    nilai_bko: number | null;
    status_bko: 'NOT_SET' | 'OK' | 'OUT_OF_RANGE';
  };

  export let selectedParam: string | null = null;
  export let range = { from: '', to: '' };
  export let loading = true;
  export let error: string | null = null;
  export let rows: TrendRow[] = [];
  export let params: string[] = [];
  export let onLoad: () => void = () => {};

  // Dynamic import untuk ApexCharts hanya di browser
  let ApexCharts: any = null;

  onMount(async () => {
    if (browser) {
      try {
        // @ts-ignore
        const module = await import('svelte-apexcharts');
        ApexCharts = module.default;
      } catch (e) {
        console.warn('ApexCharts not available, using fallback');
      }
    }
  });

  function xTime(r: TrendRow): number | null {
    const t = r.tgl_jam_mulai ?? r.tgl_jam_selesai;
    return t ? new Date(t).getTime() : null;
  }

  $: seriesParam = rows
    .filter(r => xTime(r) !== null && r.nilai_parameter !== null && (!selectedParam || r.parameter === selectedParam))
    .map(r => [xTime(r)!, r.nilai_parameter!]);

  $: seriesBKO = rows
    .filter(r => xTime(r) !== null && r.nilai_bko !== null && (!selectedParam || r.parameter === selectedParam))
    .map(r => [xTime(r)!, r.nilai_bko!]);

  const chartOptions = {
    chart: { type: 'line', height: 320, toolbar: { show: false } },
    stroke: { width: [3, 2], curve: 'smooth' },
    xaxis: { type: 'datetime' },
    yaxis: [{ decimalsInFloat: 3 }],
    markers: { size: 3 },
    tooltip: { shared: true, x: { format: 'yyyy-MM-dd HH:mm' } },
    noData: { text: 'Tidak ada data tren.' },
    legend: { position: 'top' }
  };

  function formatDateTime(dateStr: string | null): string {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleString('id-ID', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
</script>

<div class="flex items-center gap-3 mb-3">
  <div class="text-sm text-gray-600">
    Rentang: {formatDateTime(range.from)} — {formatDateTime(range.to)}
  </div>
  {#if params.length > 0}
    <select class="border rounded px-2 py-1 text-sm" bind:value={selectedParam} on:change={onLoad}>
      <option value="">Semua Parameter</option>
      {#each params as p}<option value={p}>{p}</option>{/each}
    </select>
  {/if}
  {#if rows.length > 0 && rows[0]?.parameter === 'BKO Violation'}
    <div class="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded mt-2">
      ⚠️ Data dari fallback TLHM (pelanggaran BKO)
    </div>
  {/if}
</div>

{#if loading}
  <div class="text-sm text-gray-600">Memuat tren parameter…</div>
{:else if error}
  <div class="text-sm text-red-600">{error}</div>
{:else if seriesParam.length === 0 && seriesBKO.length === 0}
  <div class="rounded-lg border p-4 text-sm text-gray-600">
    Data tren belum tersedia untuk pilihan ini.
  </div>
{:else}
  {#if ApexCharts}
    <ApexCharts
      options={chartOptions}
      series={[
        { name: 'Nilai Parameter', type: 'line', data: seriesParam },
        { name: 'BKO', type: 'line', data: seriesBKO }
      ]}
      height={320}
    />
  {:else}
    <!-- Fallback sederhana bila chart lib belum terpasang -->
    <div class="rounded-lg border p-3">
      <div class="mb-2 text-sm font-medium">Preview data (fallback)</div>
      <table class="text-xs w-full">
        <thead><tr><th class="text-left">Waktu</th><th class="text-left">Parameter</th><th>Nilai</th><th>BKO</th><th>Status</th></tr></thead>
        <tbody>
        {#each rows.slice(0, 20) as r}
          <tr>
            <td>{formatDateTime(r.tgl_jam_mulai ?? r.tgl_jam_selesai)}</td>
            <td>{r.parameter}</td>
            <td class="text-right">{r.nilai_parameter ?? '—'}</td>
            <td class="text-right">{r.nilai_bko ?? '—'}</td>
            <td>
              <span class="px-1 py-0.5 text-xs rounded" 
                class:bg-red-100={r.status_bko === 'OUT_OF_RANGE'}
                class:bg-green-100={r.status_bko === 'OK'}
                class:bg-gray-100={r.status_bko === 'NOT_SET'}
                class:text-red-800={r.status_bko === 'OUT_OF_RANGE'}
                class:text-green-800={r.status_bko === 'OK'}
                class:text-gray-800={r.status_bko === 'NOT_SET'}
              >
                {r.status_bko}
              </span>
            </td>
          </tr>
        {/each}
        </tbody>
      </table>
      {#if rows.length > 20}
        <div class="text-xs text-gray-500 mt-2 text-center">
          Menampilkan 20 dari {rows.length} data
        </div>
      {/if}
    </div>
  {/if}
{/if}

<style>
  .border {
    border: 1px solid #e5e7eb;
  }
  
  .rounded {
    border-radius: 0.375rem;
  }
  
  .px-2 {
    padding-left: 0.5rem;
    padding-right: 0.5rem;
  }
  
  .py-1 {
    padding-top: 0.25rem;
    padding-bottom: 0.25rem;
  }
  
  .text-sm {
    font-size: 0.875rem;
    line-height: 1.25rem;
  }
  
  .text-xs {
    font-size: 0.75rem;
    line-height: 1rem;
  }
  
  .text-gray-600 {
    color: #4b5563;
  }
  
  .text-red-600 {
    color: #dc2626;
  }
  
  .text-gray-500 {
    color: #6b7280;
  }
  
  .text-right {
    text-align: right;
  }
  
  .text-left {
    text-align: left;
  }
  
  .text-center {
    text-align: center;
  }
  
  .mb-2 {
    margin-bottom: 0.5rem;
  }
  
  .mb-3 {
    margin-bottom: 0.75rem;
  }
  
  .mt-2 {
    margin-top: 0.5rem;
  }
  
  .p-3 {
    padding: 0.75rem;
  }
  
  .p-4 {
    padding: 1rem;
  }
  
  .w-full {
    width: 100%;
  }
  
  .flex {
    display: flex;
  }
  
  .items-center {
    align-items: center;
  }
  
  .gap-3 {
    gap: 0.75rem;
  }
  
  .px-1 {
    padding-left: 0.25rem;
    padding-right: 0.25rem;
  }
  
  .py-0\.5 {
    padding-top: 0.125rem;
    padding-bottom: 0.125rem;
  }
  
  .bg-red-100 {
    background-color: #fef2f2;
  }
  
  .bg-green-100 {
    background-color: #f0fdf4;
  }
  
  .bg-gray-100 {
    background-color: #f9fafb;
  }
  
  .text-red-800 {
    color: #991b1b;
  }
  
  .text-green-800 {
    color: #166534;
  }
  
  .text-gray-800 {
    color: #1f2937;
  }
</style>
