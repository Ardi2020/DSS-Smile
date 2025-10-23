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
  .card {
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    padding: 16px;
    background: #fff;
    box-shadow: 0 1px 0 rgba(0,0,0,.02);
    transition: all 0.3s ease;
  }

  .card:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,.08);
    border-color: #0ea5e9;
  }

  h3 {
    margin: 0 0 12px 0;
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }

  th, td {
    padding: 10px 8px;
    border-top: 1px solid #f3f4f6;
    transition: background-color 0.2s ease;
  }

  thead th {
    text-align: left;
    color: #6b7280;
    font-weight: 600;
    border-top: none;
    background: #f9fafb;
    font-size: 13px;
  }

  tbody tr:hover {
    background: #f9fafb;
  }

  .r {
    text-align: right;
    font-weight: 600;
    color: #1f2937;
  }

  tbody td {
    color: #374151;
  }
</style>
