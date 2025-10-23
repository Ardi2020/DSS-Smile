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
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    padding: 16px;
    background: #fff;
    display: flex;
    flex-direction: column;
    gap: 4px;
    box-shadow: 0 1px 0 rgba(0,0,0,.02);
    transition: all 0.3s ease;
    cursor: pointer;
  }

  .card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0,0,0,.1);
    border-color: #0ea5e9;
  }

  .t {
    font-size: 13px;
    color: #6b7280;
    font-weight: 500;
  }

  .v {
    font-size: 28px;
    font-weight: 700;
    color: #1f2937;
    line-height: 1.2;
  }

  .s {
    font-size: 12px;
    color: #9ca3af;
    line-height: 1.3;
  }
</style>
