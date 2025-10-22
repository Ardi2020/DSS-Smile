<script lang="ts">
  export let form;
</script>

<!-- Fullscreen hero -->
<div class="login-hero">
  <div class="overlay"></div>

  <!-- Centered container -->
  <div class="container">
    <!-- Left: Intro copy -->
    <section class="intro">
      <h1>Selamat Datang di <span class="brand">Balis SPK</span></h1>
      <h2>Mengubah Data Menjadi Keputusan Strategis.</h2>
      <p>
        Aplikasi ini dirancang untuk menganalisis data operasional yang terkumpul dari sistem
        <strong>B@LIS - SMILE</strong>. Balis SPK menyajikan wawasan mendalam,
        evaluasi kinerja, dan rekomendasi berbasis data untuk mendukung pimpinan BAPETEN dalam
        mengambil keputusan pengawasan instalasi nuklir yang lebih akurat, efektif, dan proaktif.
      </p>
      <p class="muted">Masuk untuk mengakses dasbor analisis dan laporan strategis.</p>
    </section>

    <!-- Right: Login card -->
    <section class="card">
      <header>
        <div class="badge">Login</div>
        <h3>Akses Balis SPK</h3>
        <p class="sub">Gunakan kredensial DSS-SMILE Anda</p>
      </header>

      <form method="POST" class="form">
        <label>
          <span>Username</span>
          <input name="username" value="unand_view" autocomplete="username" required />
        </label>

        <label>
          <span>Password</span>
          <input name="password" type="password" value="unandTI_24#" autocomplete="current-password" required />
        </label>

        <button class="btn" type="submit" aria-label="Masuk ke Balis SPK">Masuk</button>

        {#if form?.error}
          <p class="error" role="alert">{form.error}</p>
        {/if}
      </form>

      <footer class="footnote">
        <small>Token disimpan aman di memori server & diperbarui otomatis.</small>
      </footer>
    </section>
  </div>
</div>

<style>
  :root {
    --bg: #0b0f14;
    --glass: 255, 255, 255;      /* rgb base for glass */
    --glass-alpha: 0.10;          /* card background alpha */
    --glass-border: 0.25;         /* border alpha */
    --brand: #00e0c7;
    --text: #e9eef5;
    --muted: #b9c1cc;
    --accent: #10b981;            /* emerald-ish for focus */
  }

  .login-hero {
    position: relative;
    min-height: 100dvh;
    background: var(--bg) url('/images/login-bg.jpg') center/cover no-repeat fixed;
    display: grid;
    place-items: center;
  }

  .overlay {
    position: absolute; inset: 0;
    background:
      radial-gradient(80rem 40rem at 20% 20%, rgba(0,0,0,0.30), transparent 60%),
      linear-gradient(to bottom right, rgba(7,12,18,0.75), rgba(7,12,18,0.35));
    backdrop-filter: saturate(120%) brightness(0.9);
  }

  .container {
    position: relative;
    z-index: 1;
    width: min(1100px, 92vw);
    display: grid;
    grid-template-columns: 1.25fr 0.9fr;
    gap: clamp(20px, 4vw, 48px);
    align-items: center;
  }

  /* Intro text */
  .intro {
    color: var(--text);
    text-shadow: 0 1px 0 rgba(0,0,0,0.3);
  }
  .intro h1 {
    font-size: clamp(28px, 4vw, 44px);
    line-height: 1.1;
    margin: 0 0 8px 0;
    font-weight: 700;
  }
  .intro .brand { color: var(--brand); }
  .intro h2 {
    font-size: clamp(16px, 2.2vw, 22px);
    font-weight: 500;
    color: var(--text);
    opacity: .95;
    margin: 0 0 14px 0;
  }
  .intro p {
    font-size: clamp(14px, 1.6vw, 16px);
    color: var(--text);
    opacity: .92;
    margin: 0 0 10px 0;
    max-width: 70ch;
  }
  .intro .muted { color: var(--muted); }

  /* Glass card */
  .card {
    background: rgba(var(--glass), var(--glass-alpha));
    border: 1px solid rgba(var(--glass), var(--glass-border));
    box-shadow:
      0 10px 35px rgba(0,0,0,.45),
      inset 0 1px 0 rgba(255,255,255,.08);
    backdrop-filter: blur(10px);
    border-radius: 18px;
    padding: clamp(18px, 3.2vw, 28px);
    color: var(--text);
  }

  .badge {
    display: inline-block;
    font-size: 12px; letter-spacing: .12em; text-transform: uppercase;
    padding: 6px 10px; border-radius: 999px;
    background: rgba(16, 185, 129, .12);
    border: 1px solid rgba(16, 185, 129, .35);
    color: #c8f5e7;
    margin-bottom: 8px;
  }

  header h3 {
    margin: 0;
    font-size: 20px; font-weight: 700;
  }
  .sub {
    margin: 4px 0 14px 0;
    color: var(--muted);
    font-size: 13px;
  }

  .form { display: grid; gap: 12px; }

  label span {
    display: block;
    font-size: 12px;
    color: var(--muted);
    margin-bottom: 6px;
  }

  input {
    width: 100%;
    padding: 12px 14px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,.18);
    background: rgba(8, 12, 18, .55);
    color: var(--text);
    outline: none;
    transition: box-shadow .2s ease, border-color .2s ease, background .2s ease;
  }
  input::placeholder { color: #9fb1c0; opacity: .8; }
  input:focus {
    border-color: rgba(16, 185, 129, .55);
    box-shadow: 0 0 0 3px rgba(16, 185, 129, .25);
    background: rgba(8, 12, 18, .7);
  }

  .btn {
    margin-top: 6px;
    width: 100%;
    padding: 12px 16px;
    border-radius: 12px;
    border: 1px solid rgba(16, 185, 129, .45);
    background: linear-gradient(180deg, #22c1a1, #10b981);
    color: #071016;
    font-weight: 700;
    cursor: pointer;
    transition: transform .06s ease, filter .2s ease, box-shadow .2s ease;
    box-shadow: 0 8px 18px rgba(16,185,129,.25);
  }
  .btn:hover { filter: brightness(1.05); }
  .btn:active { transform: translateY(1px); }

  .error {
    margin-top: 8px;
    color: #ffb4b4;
    background: rgba(255, 99, 71, .1);
    border: 1px solid rgba(255, 99, 71, .35);
    padding: 10px 12px;
    border-radius: 10px;
    text-align: center;
    font-size: 13px;
  }

  .footnote {
    margin-top: 10px;
    color: var(--muted);
    text-align: center;
  }

  /* Responsive: stack on narrow screens */
  @media (max-width: 980px) {
    .container {
      grid-template-columns: 1fr;
      gap: 20px;
    }
    .intro { text-align: center; }
    .intro p { margin-left: auto; margin-right: auto; }
  }
</style>
