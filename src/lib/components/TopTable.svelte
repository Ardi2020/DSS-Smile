<script lang="ts">
  export let rows: Array<{ regulasi_id: string | number; regulasi_kode?: string; regulasi_judul?: string; jumlah_temuan: number }>;
</script>

<div class="card">
  <h3>Top Regulasi Dilanggar</h3>
  <table>
    <thead><tr><th>Kode</th><th>Judul</th><th class="r">Temuan</th></tr></thead>
    <tbody>
      {#each rows as r}
        <tr>
          <td>{r.regulasi_kode ?? r.regulasi_id}</td>
          <td title={r.regulasi_judul}>{r.regulasi_judul ?? '—'}</td>
          <td class="r">{r.jumlah_temuan}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .card { border:1px solid #e5e7eb; border-radius:14px; padding:14px; background:#fff }
  h3 { margin:0 0 8px 0 }
  table { width:100%; border-collapse: collapse; font-size:14px }
  th, td { padding:8px 8px; border-top:1px solid #f0f2f5 }
  thead th { text-align:left; color:#6b7280; font-weight:600; border-top:none }
  .r { text-align:right }
</style>
