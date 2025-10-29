<script lang="ts">
  export let items: Array<{ id: string; nama: string; score: number; explain: string[] }> = [];
  export let limit = 5;
  const rows = (items ?? []).slice(0, limit);
</script>

<div class="card">
  <div class="mb-3 flex items-baseline justify-between">
    <h2 class="text-base font-semibold">Prioritas Inspeksi (Top {limit})</h2>
    <small class="text-gray-500">berdasarkan indikator: TLHM > BKO dan TLHI overdue</small>
  </div>

  {#if rows.length === 0}
    <div class="text-sm text-gray-500">Tidak ada rekomendasi prioritas saat ini.</div>
  {:else}
    <table class="w-full text-sm">
      <thead class="text-left text-gray-600">
        <tr>
          <th class="py-2 pr-2">#</th>
          <th class="py-2 pr-2">Fasilitas</th>
          <th class="py-2 pr-2">Skor</th>
          <th class="py-2">Alasan</th>
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
            <td class="py-2 pr-2 align-top font-semibold">{r.score}</td>
            <td class="py-2 align-top">
              {#if r.explain?.length}
                <ul class="list-disc pl-5">
                  {#each r.explain as ex}
                    <li>{ex}</li>
                  {/each}
                </ul>
              {:else}
                <span class="text-gray-500">–</span>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>
