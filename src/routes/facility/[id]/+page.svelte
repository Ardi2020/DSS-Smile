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
