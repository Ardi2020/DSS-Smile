<script lang="ts">
  type TlhiRow = {
    id: string
    nama: string
    overdueCount: number
    maxOverdueDays: number
  };

  export let items: TlhiRow[] = [];
  export let limit = 5;

  const rows = (items ?? [])
    .slice() // clone
    .sort((a, b) => {
      if (b.overdueCount !== a.overdueCount) return b.overdueCount - a.overdueCount;
      return b.maxOverdueDays - a.maxOverdueDays;
    })
    .slice(0, limit);
</script>

<div class="card">
  <div class="mb-3 flex items-baseline justify-between">
    <h2 class="text-base font-semibold">TLHI Overdue (Top {limit})</h2>
    <small class="text-gray-500">status Belum TL / Proses Evaluasi yang melewati tanggal komitmen</small>
  </div>

  {#if rows.length === 0}
    <div class="text-sm text-gray-500">Tidak ada TLHI overdue saat ini.</div>
  {:else}
    <table class="w-full text-sm">
      <thead class="text-left text-gray-600">
        <tr>
          <th class="py-2 pr-2">#</th>
          <th class="py-2 pr-2">Fasilitas</th>
          <th class="py-2 pr-2">Jumlah Overdue</th>
          <th class="py-2">Hari Terlama</th>
        </tr>
      </thead>
      <tbody>
        {#each rows as r, i}
          <tr>
            <td class="py-2 pr-2 align-top">{i + 1}</td>
            <td class="py-2 pr-2 align-top">
              <a class="text-blue-700 hover:underline" href={"/facility/" + encodeURIComponent(r.id)}>
                {r.nama}
              </a>
            </td>
            <td class="py-2 pr-2 align-top font-semibold">{r.overdueCount}</td>
            <td class="py-2 align-top">{r.maxOverdueDays} hari</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>
