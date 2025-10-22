<script lang="ts">
  export let title: string;
  export let value: number | string;
  export let subtitle: string = '';
</script>

<div class="card">
  <div class="t">{title}</div>
  <div class="v">{value}</div>
  {#if subtitle}<div class="s">{subtitle}</div>{/if}
</div>

<style>
  .card {
    border: 1px solid #e5e7eb; border-radius: 14px; padding: 14px;
    background: #fff; display:flex; flex-direction:column; gap:4px;
    box-shadow: 0 1px 0 rgba(0,0,0,.02);
  }
  .t { font-size: 13px; color:#6b7280; }
  .v { font-size: 24px; font-weight: 700; }
  .s { font-size: 12px; color:#9ca3af; }
</style>
