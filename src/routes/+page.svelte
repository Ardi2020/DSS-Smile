<script lang="ts">
  export let data;
  const dash = data?.dashboard;
</script>

<div class="p-6 space-y-6">
  <h1 class="text-2xl font-semibold">Dashboard DSS-SMILE</h1>

  {#if dash}
    <section class="grid md:grid-cols-2 gap-4">
      <div class="rounded-xl border p-4">
        <h2 class="font-medium mb-2">Temuan per Kategori</h2>
        <ul class="list-disc list-inside">
          {#each dash.temuanByKategori as row}
            <li>{row.kategori}: {row.jumlah}</li>
          {/each}
        </ul>
      </div>

      <div class="rounded-xl border p-4">
        <h2 class="font-medium mb-2">TLHI Open & Overdue</h2>
        <p>Total: {dash.tlhiOpenOverdue.length}</p>
      </div>

      <div class="rounded-xl border p-4">
        <h2 class="font-medium mb-2">Top Regulasi Dilanggar</h2>
        <ol class="list-decimal list-inside">
          {#each dash.peraturanTopN as r}
            <li>{r.regulasi_kode} — {r.jumlah_temuan}</li>
          {/each}
        </ol>
      </div>

      <div class="rounded-xl border p-4">
        <h2 class="font-medium mb-2">Sampel Tren Parameter vs BKO</h2>
        <p>Poin sampel: {dash.trenParamSample.length}</p>
      </div>
    </section>
  {:else}
    <p>Mengambil data…</p>
  {/if}
</div>
