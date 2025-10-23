// src/lib/server/smile/fasilitas.ts
import { getJson } from '$lib/server/api/http';

type DSSList<T> = {
  status: number;
  keterangan: string;
  response: T[];
  meta?: { total?: string; per_page?: string; current_page?: string; last_page?: string };
};

type InstalasiRaw = {
  kode_instalasi?: string;
  instalasi?: string;
  kode_jadwal?: string;
  sifat_inspeksi?: string;
  tgl_mulai?: string;
  tgl_selesai?: string;
  objek_inspeksi?: string;
  lingkup_inspeksi?: string;
  nilai_ikk?: string;
  ikk_aspek?: any[];
  temuan_aspek?: any[];
  memo_aspek?: any[];
  observasi?: any[];
  [k: string]: any;
};

export type Facility = {
  id: string;                 // dari kode_instalasi
  nama: string;               // dari instalasi
  tipe: string | null;        // objek_inspeksi || sifat_inspeksi
  lokasi: string | null;      // belum tersedia → null
  ringkas: {
    nilai_ikk: string | null;
    ikk_aspek_count: number;
    temuan_aspek_count: number;
  };
  __raw?: InstalasiRaw;       // opsional, untuk debugging (hapus di produksi jika tak perlu)
};

function normalize(row: InstalasiRaw): Facility {
  const id = String(row.kode_instalasi ?? '');
  const nama = String(row.instalasi ?? 'Tanpa Nama');
  const tipe = (row.objek_inspeksi ?? row.sifat_inspeksi ?? null) as string | null;
  const lokasi = null;

  return {
    id: id || nama, // fallback aman
    nama,
    tipe,
    lokasi,
    ringkas: {
      nilai_ikk: row.nilai_ikk ?? null,
      ikk_aspek_count: Array.isArray(row.ikk_aspek) ? row.ikk_aspek.length : 0,
      temuan_aspek_count: Array.isArray(row.temuan_aspek) ? row.temuan_aspek.length : 0
    },
    __raw: row
  };
}

export async function listFacilitiesOfficial(limitPerPage = 200): Promise<Facility[]> {
  const items: Facility[] = [];

  // halaman pertama
  let page = 1;
  // kita akan loop sampai last_page
  while (true) {
    const res = await getJson<DSSList<InstalasiRaw>>('/instalasi', { query: { page, limit: limitPerPage } });

    const rows = Array.isArray(res.response) ? res.response : [];
    for (const r of rows) items.push(normalize(r));

    const meta = res.meta ?? {};
    const cur = parseInt(String(meta.current_page ?? page), 10) || page;
    const last = parseInt(String(meta.last_page ?? page), 10) || page;

    if (cur >= last) break;
    page = cur + 1;
  }

  // Dedup by id (kalau ada duplikasi antar halaman)
  const uniq = new Map<string, Facility>();
  for (const it of items) {
    if (!uniq.has(it.id)) uniq.set(it.id, it);
  }

  return Array.from(uniq.values()).sort((a, b) => a.nama.localeCompare(b.nama));
}

// --- Simple in-memory cache 60 detik ---
const cache = new Map<string, { at: number; data: any }>();
function getCache(key: string) {
  const c = cache.get(key);
  if (!c) return null;
  if (Date.now() - c.at > 60_000) return null; // expired
  return c.data;
}
function setCache(key: string, data: any) {
  cache.set(key, { at: Date.now(), data });
}

// --- Derived list from jadwal ---
export async function listFacilitiesDerived(limitPerPage = 1000): Promise<Facility[]> {
  type JadwalRow = Record<string, any>;
  const res = await getJson<{ status: number; keterangan: string; response: JadwalRow[] }>(
    '/inspektur-jadwal-inspeksi',
    { query: { page: 1, limit: limitPerPage } }
  );

  const uniq = new Map<string, Facility>();
  for (const r of res.response ?? []) {
    // —— PRIORITAS KUNCI DARI JADWAL ——
    const id =
      r.kode_instalasi ?? r.fasilitas_id ?? r.id_fasilitas ?? r.instalasi_id ?? r.id ?? null;
    const nama =
      r.instalasi ?? r.nama_fasilitas ?? r.fasilitas ?? r.nama_instalasi ?? 'Tanpa Nama';
    const tipe = r.objek_inspeksi ?? r.jenis_fasilitas ?? r.tipe_instalasi ?? null;
    const lokasi = r.lokasi ?? r.alamat ?? r.kota ?? null;

    const f: Facility = {
      id: String(id ?? nama),
      nama: String(nama),
      tipe: tipe ? String(tipe) : null,
      lokasi: lokasi ? String(lokasi) : null,
      ringkas: {
        nilai_ikk: r.nilai_ikk ?? null,
        ikk_aspek_count: 0,
        temuan_aspek_count: 0
      }
    };
    if (!uniq.has(f.id)) uniq.set(f.id, f);
  }
  return Array.from(uniq.values()).sort((a, b) => a.nama.localeCompare(b.nama));
}
