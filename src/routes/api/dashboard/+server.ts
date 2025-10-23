// src/routes/api/dashboard/+server.ts
import type { RequestHandler } from '@sveltejs/kit';
import { getJson } from '$lib/server/api/http';
import { shouldRefresh, refreshToken } from '$lib/server/api/token';
import { listFacilitiesOfficial } from '$lib/server/smile/fasilitas';
import { EP } from '$lib/server/smile/endpoints';

type DSRes<T> = { status: number; keterangan: string; response: T; meta?: any };

// [ADD] helper kecil di atas GET:
function parseDate(s?: string | null) {
  if (!s || s === '0000-00-00 00:00:00') return null;
  // dukung format 'YYYY-MM-DD' atau 'YYYY-MM-DD HH:mm:ss'
  const d = new Date(String(s).replace(' ', 'T'));
  return Number.isFinite(d.getTime()) ? d : null;
}

function isSudahTL(status: any) {
  const v = String(status ?? '').toLowerCase();
  return v.includes('sudah tl');
}

function daysOverdue(d?: string | null) {
  if (!d) return 0;
  const due = new Date(d).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((now - due) / 86_400_000));
}

function uniqById<T extends { id?: any }>(arr: T[]) {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const it of arr ?? []) {
    const key = String(it?.id ?? '');
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }
  return out;
}

// ==== Helpers TLHI summary ====
type TlhiFact = { status?: string; tgl_komitmen?: string | null };
type TlhiTemuan = { fakta?: TlhiFact[] };
type TlhiRow = {
  kode_instalasi?: string | number;
  instalasi_id?: string | number;
  id?: string | number;
  instalasi?: string;    // terkadang nama
  nama?: string;         // terkadang nama
  temuan?: TlhiTemuan[];
};

function extractFacilityId(row: TlhiRow): string {
  return String(
    row.kode_instalasi ?? row.instalasi_id ?? row.id ?? row.instalasi ?? row.nama ?? ''
  );
}

function extractFacilityLabel(row: TlhiRow): string {
  return String(row.instalasi ?? row.nama ?? extractFacilityId(row));
}

// ringkas TLHI → per-fasilitas
function summarizeTLHIByFacility(rows: TlhiRow[]) {
  const now = new Date();
  const soon = new Date(now.getTime() + 30 * 86_400_000);

  type Sum = {
    id: string; nama: string;
    overdueCount: number; openCount: number; dueSoonCount: number;
    maxOverdueDays: number;
  };
  const bucket = new Map<string, Sum>();

  for (const r of rows ?? []) {
    const id = extractFacilityId(r);
    const nama = extractFacilityLabel(r);
    if (!id) continue;

    const s = bucket.get(id) ?? { id, nama, overdueCount: 0, openCount: 0, dueSoonCount: 0, maxOverdueDays: 0 };

    const temuan = Array.isArray(r.temuan) ? r.temuan : [];
    for (const t of temuan) {
      const fakta = Array.isArray(t.fakta) ? t.fakta : [];
      for (const f of fakta) {
        const open = !isSudahTL(f.status);
        if (!open) continue;

        s.openCount += 1;

        const due = parseDate(f.tgl_komitmen);
        if (due) {
          if (due < now) {
            s.overdueCount += 1;
            s.maxOverdueDays = Math.max(s.maxOverdueDays, daysOverdue(f.tgl_komitmen));
          } else if (due >= now && due <= soon) {
            s.dueSoonCount += 1;
          }
        }
      }
    }

    bucket.set(id, s);
  }

  const arr = Array.from(bucket.values())
    .sort((a, b) =>
      b.overdueCount - a.overdueCount ||
      b.openCount - a.openCount ||
      b.dueSoonCount - a.dueSoonCount
    );

  const tlhi_overdue_total = arr.reduce((s, it) => s + it.overdueCount, 0);
  return { arr, tlhi_overdue_total };
}

// bangun risk ranking dari ringkasan TLHI
function buildRiskPrioritas(items: Array<{ facility: string; overdue: number; open: number; dueSoon: number }>) {
  const risks = items.map((x) => {
    const score = 40 * x.overdue + 10 * x.open + 5 * x.dueSoon;
    const level = score >= 80 ? 'HIGH' : score >= 40 ? 'MED' : 'LOW';
    const explain: string[] = [];
    if (x.overdue) explain.push(`TLHI overdue: ${x.overdue}`);
    if (x.open)    explain.push(`TLHI open: ${x.open}`);
    if (x.dueSoon) explain.push(`Komitmen ≤30 hari: ${x.dueSoon}`);
    return { facility: x.facility, score, level, explain };
  }).sort((a, b) => b.score - a.score);

  const risk_high = risks.filter((r) => r.level === 'HIGH').length;
  return { risks, risk_high };
}

// ===================[ Helpers untuk Tren ]===================
type TrendPoint = { waktu: string; nilai: number; bko?: number };

// pilih kandidat field berdasar daftar alias
function pickField<T extends Record<string, any>>(row: T, aliases: string[]): any {
  for (const key of Object.keys(row)) {
    const low = key.toLowerCase();
    if (aliases.includes(low)) return row[key];
  }
  return undefined;
}

function toDateISO(x: any): string | null {
  if (!x) return null;
  const s = String(x).replace(' ', 'T'); // dukung 'YYYY-MM-DD HH:mm:ss'
  const d = new Date(s);
  return Number.isFinite(d.getTime()) ? d.toISOString() : null;
}

function toNum(x: any): number | null {
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

// Normalisasi item -> TrendPoint (untuk sumber utama & fallback akuisisi)
function normalizeTrendRows(rows: any[], opts?: { allowNoBko?: boolean }): TrendPoint[] {
  const out: TrendPoint[] = [];
  for (const r of rows ?? []) {
    const waktuRaw =
      pickField(r, ['waktu','tanggal','tgl','created_at','time','ts','datetime','timestamp','tanggal_sampling','tgl_sampling','jam']);
    const nilaiRaw =
      pickField(r, ['nilai','value','hasil','y','val','nilai_ukur','nilai_parameter','nilai_pengukuran']);
    const bkoRaw =
      pickField(r, ['bko','threshold','limit_bko','batas','ambang','ambang_bko']);

    const waktu = toDateISO(waktuRaw);
    const nilai = toNum(nilaiRaw);
    const bko = toNum(bkoRaw);

    // wajib punya waktu & nilai; bko opsional
    if (waktu && nilai !== null && (opts?.allowNoBko ? true : true)) {
      const p: TrendPoint = { waktu, nilai };
      if (bko !== null) p.bko = bko;
      out.push(p);
    }
  }
  // sort naik berdasarkan waktu
  out.sort((a, b) => a.waktu.localeCompare(b.waktu));
  return out;
}

// Agregasi TLHM> BKO per-bulan -> pseudo-tren (fallback terakhir)
function monthlyCountFromTLHM(rows: any[]): TrendPoint[] {
  const bucket = new Map<string, number>(); // key = 'YYYY-MM-01'
  for (const r of rows ?? []) {
    const tRaw = pickField(r, ['waktu','tanggal','tgl','created_at','time','ts','tanggal_temuan']);
    const iso = toDateISO(tRaw);
    if (!iso) continue;
    const ym = iso.slice(0, 7) + '-01T00:00:00.000Z'; // anchor ke awal bulan UTC
    bucket.set(ym, (bucket.get(ym) ?? 0) + 1);
  }
  const out: TrendPoint[] = Array.from(bucket.entries())
    .map(([w, c]) => ({ waktu: w, nilai: c }))
    .sort((a, b) => a.waktu.localeCompare(b.waktu));
  return out;
}

// Sumber utama: /parameter/trend-parameter-bko
async function fetchTrendPrimary(getJson: Function): Promise<TrendPoint[]> {
  try {
    const r = await getJson('/parameter/trend-parameter-bko', { query: { page: 1, limit: 200 } });
    const rows = Array.isArray(r?.response) ? r.response : (Array.isArray(r) ? r : []);
    return normalizeTrendRows(rows, { allowNoBko: true });
  } catch {
    return [];
  }
}

// Fallback 1: /akuisisi-data/reaktor  (nilai saja, bko opsional)
async function fetchTrendAcquisition(getJson: Function): Promise<TrendPoint[]> {
  try {
    const r = await getJson('/akuisisi-data/reaktor', { query: { page: 1, limit: 100 } });
    const rows = Array.isArray(r?.response) ? r.response : (Array.isArray(r) ? r : []);
    return normalizeTrendRows(rows, { allowNoBko: true });
  } catch {
    return [];
  }
}

// Fallback 2: /tlhm/melebihi-bko  (agregat jumlah per-bulan)
async function fetchTrendFromTLHM(getJson: Function): Promise<TrendPoint[]> {
  try {
    const r = await getJson('/tlhm/melebihi-bko', { query: { page: 1, limit: 1000 } });
    const rows = Array.isArray(r?.response) ? r.response : (Array.isArray(r) ? r : []);
    return monthlyCountFromTLHM(rows);
  } catch {
    return [];
  }
}

// Orkestrasi: pilih sumber terbaik yang tersedia saat runtime
async function buildTrendParamSample(getJson: Function): Promise<{ points: TrendPoint[]; source: string; note?: string }> {
  // 1) sumber utama
  const p = await fetchTrendPrimary(getJson);
  if (p.length > 0) return { points: p, source: 'trend-parameter-bko' };

  // 2) fallback akuisisi
  const a = await fetchTrendAcquisition(getJson);
  if (a.length > 0) return { points: a, source: 'akuisisi-data/reaktor', note: 'Tren sampel dari data akuisisi; BKO mungkin tidak tersedia untuk setiap titik.' };

  // 3) fallback agregat TLHM
  const t = await fetchTrendFromTLHM(getJson);
  if (t.length > 0) return { points: t, source: 'tlhm-melebihi-bko', note: 'Agregat jumlah kejadian melebihi BKO per bulan.' };

  return { points: [], source: 'none' };
}
// ===================[ END Helpers Tren ]===================

export const GET: RequestHandler = async ({ fetch }) => {
  const errors: Array<{ tag: string; status: number; message: string; path: string }> = [];

  // Jaga-jaga refresh proaktif
  if (shouldRefresh()) {
    try { await refreshToken(); } catch (e) { /* biarkan 401 downstream */ }
  }

  // 1) Peraturan top-N
  let peraturanTopN: any[] = [];
  try {
    const resp = await getJson<DSRes<any[]>>('/peraturan/temuan', { query: { page: 1, limit: 100 } });
    peraturanTopN = (resp.response ?? [])
      .map(r => ({
        regulasi_id: `${r.no_peraturan ? 'PB/PP' : ''}` || r.nama_peraturan,
        regulasi_kode: r.pasal,
        regulasi_judul: r.nama_peraturan,
        jumlah_temuan: Number(r.jumlah_temuan ?? 0)
      }))
      .sort((a, b) => b.jumlah_temuan - a.jumlah_temuan)
      .slice(0, 10);
  } catch (e: any) {
    errors.push({ tag: 'peraturan', status: 500, message: String(e?.message ?? e), path: '/peraturan/temuan' });
  }

  // 2) Temuan by kategori (kita treat "kategori" sebagai nama_peraturan/pasal fallback)
  let temuanByKategori: Array<{ kategori: string; jumlah: number }> = [];
  try {
    const resp = await getJson<DSRes<any[]>>('/peraturan/temuan', { query: { page: 1, limit: 100 } });
    const bucket: Record<string, number> = {};
    for (const r of (resp.response ?? [])) {
      const k = r.nama_peraturan ?? 'Lainnya';
      bucket[k] = (bucket[k] ?? 0) + Number(r.jumlah_temuan ?? 0);
    }
    temuanByKategori = Object.entries(bucket).map(([kategori, jumlah]) => ({ kategori, jumlah }));
  } catch (e: any) {
    errors.push({ tag: 'temuan', status: 500, message: String(e?.message ?? e), path: '/peraturan/temuan' });
  }

  // 3) TLHI (open/overdue) — hitung overdue per-fasilitas
  let tlhiOpenOverdue: any[] = [];
  let tlhiOverdueByFacility: Array<{ id: string; nama: string; overdueCount: number; maxOverdueDays: number }> = [];
  try {
    const resp = await getJson<DSRes<any[]>>('/tlhi/inspektur', { query: { page: 1, limit: 1000 } });
    tlhiOpenOverdue = resp.response ?? [];

    // [REFINE] TLHI → hitung overdue per-fasilitas dengan struktur baru
    const bucket = new Map<string, { n: number; max: number }>();
    for (const t of tlhiOpenOverdue) {
      const status = String(t.status ?? '').toLowerCase();
      const isOpen = status.includes('belum') || status.includes('proses');
      const due = daysOverdue(t.tgl_komitmen ?? t.tanggal_komitmen ?? null);
      if (isOpen && due > 0) {
        const id = String(t.kode_instalasi ?? t.fasilitas_id ?? t.instalasi_id ?? t.id ?? 'UNKNOWN');
        const cur = bucket.get(id) ?? { n: 0, max: 0 };
        cur.n += 1; cur.max = Math.max(cur.max, due);
        bucket.set(id, cur);
      }
    }
    tlhiOverdueByFacility = Array.from(bucket.entries()).map(([id, v]) => {
      const nama = facilitiesList.find(x => String(x.id) === String(id))?.nama ?? id;
      return ({ id, nama, overdueCount: v.n, maxOverdueDays: v.max });
    });
  } catch (e: any) {
    errors.push({ tag: 'tlhi', status: 500, message: String(e?.message ?? e), path: '/tlhi/inspektur' });
  }

  // Gunakan helper yang sudah didefinisikan di atas
  const { arr: tlhiOverdueByFacilityNew, tlhi_overdue_total } = summarizeTLHIByFacility(tlhiOpenOverdue as TlhiRow[]);

  // 4) Tren Parameter dengan fallback berjenjang
  let trenParamSample: TrendPoint[] = [];
  let trenParamSampleSource = 'none';
  let trenParamSampleNote: string | undefined = undefined;

  try {
    const { points, source, note } = await buildTrendParamSample(getJson);
    trenParamSample = points;
    trenParamSampleSource = source;
    trenParamSampleNote = note;
  } catch (e: any) {
    errors.push({ tag: 'trend', status: 500, message: String(e?.message ?? e), path: 'buildTrendParamSample' });
    trenParamSample = []; // biarkan kosong untuk chart placeholder
  }

  // [ADD] TLHM > BKO (early warning) - perbaiki dengan data trenParamSample
  let bkoExceedByFacility: Array<{ id: string; nama: string; count: number }> = [];
  try {
    // gunakan trenParamSample yang sudah dinormalisasi
    const bucket: Record<string, number> = {};
    for (const it of (trenParamSample ?? [])) {
      // TrendPoint tidak memiliki field fasilitas, jadi skip untuk sekarang
      // TODO: perlu field tambahan di TrendPoint untuk fasilitas jika diperlukan
      const nilai = it.nilai;
      const bko = it.bko;
      if (nilai && bko && nilai > bko) {
        // Untuk sementara, gunakan placeholder atau skip
        // bucket['unknown'] = (bucket['unknown'] ?? 0) + 1;
      }
    }
    bkoExceedByFacility = Object.entries(bucket)
      .map(([facility, count]) => ({ id: facility, nama: facility, count }))
      .sort((a, b) => b.count - a.count);
  } catch (e: any) {
    errors.push({ tag: 'bko', status: 500, message: String(e?.message ?? e), path: 'trenParamSample' });
  }

  // 5) Fasilitas resmi (untuk hitung total fasilitas) - ganti dengan fetch ke /api/facilities
  let facilitiesCount: number = 0;
  let facilitiesList: Array<{ id: string; nama: string }> = [];

  try {
    // gunakan fetch dari RequestEvent dan path relatif agar aman di dev/prod
    const resp = await fetch('/api/facilities');
    if (resp.ok) {
      const fac = await resp.json();
      const arr = Array.isArray(fac?.facilities) ? fac.facilities : [];
      const uniq = uniqById(arr).map((f: any) => ({
        id: String(f.id ?? ''),
        nama: String(f.nama ?? f.name ?? f.title ?? '').trim() || String(f.id ?? '')
      }));
      facilitiesList = uniq;
      facilitiesCount = uniq.length;
    }
  } catch (e: any) {
    errors.push({ tag: 'facilities', status: 500, message: String(e?.message ?? e), path: '/api/facilities' });
  }

  // Fallback kalau /api/facilities gagal
  if (!facilitiesCount) {
    // fallback: ambil dari TLHI agar tidak nol
    const ids = new Set<string>();

    for (const row of tlhiOpenOverdue ?? []) {
      const fid = String(row?.kode_instalasi ?? row?.instalasi_id ?? row?.id ?? '');
      if (fid) ids.add(fid);
    }

    facilitiesCount = ids.size || facilitiesCount; // kalau masih 0, biarkan 0
  }

  function labelOf(id: string) {
    const f = facilitiesList.find(x => String(x.id) === String(id));
    return f?.nama ?? id;
  }

  // --- Bangun Prioritas Inspeksi dengan NAMA & EXPLAIN yang eksplisit ---
  type TlhiSum = { id: string; nama: string; overdueCount: number; openCount: number; dueSoonCount: number };

  function buildRiskWithExplain(items: TlhiSum[]) {
    const risks = items.map((x) => {
      const score = 40 * x.overdueCount + 10 * x.openCount + 5 * x.dueSoonCount;
      const level = score >= 80 ? 'HIGH' : score >= 40 ? 'MED' : 'LOW';

      // nama prioritas: pakai mapping facilitiesList jika nama dari TLHI kosong/kurang informatif
      const namaFinal = (x.nama && x.nama !== x.id) ? x.nama : labelOf(x.id);

      // explain yang ramah UI
      const explain: string[] = [];
      if (x.overdueCount > 0) explain.push(`TLHI overdue: ${x.overdueCount}`);
      if (x.openCount > 0)    explain.push(`TLHI open: ${x.openCount}`);
      if (x.dueSoonCount > 0) explain.push(`Komitmen ≤30 hari: ${x.dueSoonCount}`);

      // Kalau skor > 0 tapi explain kosong (kasus aneh), buat ringkasan fallback
      if (score > 0 && explain.length === 0) {
        explain.push(`Komponen risiko terdeteksi (score=${score})`);
      }

      return { id: x.id, nama: namaFinal, score, level, explain };
    }).sort((a, b) => b.score - a.score);

    const risk_high = risks.filter(r => r.level === 'HIGH').length;
    return { risks, risk_high };
  }

  // === PANGGIL setelah summarizeTLHIByFacility ===
  const tlhiSummaryLabeled: TlhiSum[] = tlhiOverdueByFacilityNew.map((x: any) => ({
    ...x,
    // kuatkan nama menggunakan labelOf agar tidak kosong
    nama: (x.nama && x.nama !== x.id) ? x.nama : labelOf(x.id)
  }));

  const { risks: riskPrioritas, risk_high } = buildRiskWithExplain(tlhiSummaryLabeled);

  // Ringkasan untuk kartu
  const totalTemuan = temuanByKategori.reduce((s, it) => s + (Number(it.jumlah) || 0), 0);
  const dashboard: any = {
    ikk: null,
    temuanByKategori,
    tlhiOpenOverdue,
    peraturanTopN,
    trenParamSample,
    // [ADD] field baru:
    bkoExceedByFacility,
    tlhiOverdueByFacility: tlhiOverdueByFacilityNew,
    riskPrioritas,
    // opsional (UI Anda akan mengabaikan jika tidak digunakan)
    trenParamSampleSource,
    trenParamSampleNote
  };

  // Partial OK: true jika ada minimal satu modul berisi data
  const anyData =
    (peraturanTopN.length > 0) ||
    (temuanByKategori.length > 0 && totalTemuan > 0) ||
    (tlhiOpenOverdue.length > 0) ||
    (trenParamSample.length > 0) ||
    (facilitiesCount > 0);

  const meta = {
    counts: {
      peraturan_temuan: peraturanTopN.length,
      temuan_total: totalTemuan,
      tlhi_items: tlhiOpenOverdue.length,
      trend_param: trenParamSample.length,
      facilities_count: facilitiesCount,
      // [ADD] perluas meta.counts
      bko_exceed_total: bkoExceedByFacility.reduce((s, x) => s + x.count, 0),
      tlhi_overdue_total: tlhi_overdue_total,
      risk_high: risk_high
    }
  };

  // (opsional) jika Anda ingin expose daftar ringkas ke UI suatu saat:
  dashboard.facilitiesSummary = facilitiesList; // tidak dipakai UI kini; aman dibiarkan

  return new Response(
    JSON.stringify({ ok: anyData, dashboard, meta, errors }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
