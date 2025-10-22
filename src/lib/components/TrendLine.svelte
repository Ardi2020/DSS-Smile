<script lang="ts">
  // expects points: [{ waktu: ISO, nilai: number, bko?: number }]
  export let points: Array<{ waktu: string; nilai: number; bko?: number }> = [];

  // build scaled SVG path
  const w = 560, h = 160, pad = 18;
  const xs = points.map((p, i) => i);
  const ys = points.map(p => p.nilai);
  const minX = 0, maxX = Math.max(1, xs[xs.length-1] ?? 1);
  const minY = Math.min(...ys, 0), maxY = Math.max(...ys, 1);

  const sx = (x:number) => pad + (x - minX) / (maxX - minX) * (w - pad*2);
  const sy = (y:number) => h - pad - (y - minY) / (maxY - minY || 1) * (h - pad*2);

  const path = points
    .map((p, i) => `${i===0?'M':'L'} ${sx(i)},${sy(p.nilai)}`)
    .join(' ');

  // threshold (pakai rata-rata bko jika ada)
  const bkos = points.map(p=>p.bko).filter((v):v is number => typeof v==='number');
  const bko = bkos.length ? (bkos.reduce((a,b)=>a+b,0)/bkos.length) : null;
</script>

<div class="card">
  <h3>Tren Parameter vs BKO (sample)</h3>
  <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} class="chart">
    <rect x="0" y="0" width={w} height={h} fill="#fff"/>
    <!-- grid -->
    {#each [0,1,2,3,4] as i}
      <line x1={pad} x2={w-pad} y1={pad + i*((h-pad*2)/4)} y2={pad + i*((h-pad*2)/4)} stroke="#eef2f7"/>
    {/each}
    <!-- line -->
    <path d={path} fill="none" stroke="#0ea5e9" stroke-width="2.2" stroke-linecap="round"/>
    <!-- threshold -->
    {#if bko !== null}
      <line x1={pad} x2={w-pad} y1={sy(bko)} y2={sy(bko)} stroke="#ef4444" stroke-dasharray="5 5"/>
    {/if}
  </svg>
  <div class="legend">
    <span class="dot blue"></span> Nilai &nbsp;&nbsp;
    {#if bko !== null}<span class="line red"></span> BKO rata-rata{/if}
  </div>
</div>

<style>
  .card { border:1px solid #e5e7eb; border-radius:14px; padding:14px; background:#fff }
  .chart { width:100%; height:auto; display:block; border-radius:10px; border:1px solid #f0f2f5 }
  .legend { margin-top:8px; font-size:12px; color:#6b7280 }
  .dot.blue { display:inline-block; width:10px; height:10px; border-radius:99px; background:#0ea5e9; margin-right:6px }
  .line.red { display:inline-block; width:18px; height:2px; background:#ef4444; margin-right:6px }
</style>
