import type { Role } from "@/lib/rbac";

/**
 * Alur layanan 5 tahap (DIBATALKAN di luar alur).
 *
 * Disederhanakan dari 8 tahap: skrining dilebur ke tahap 1 (tagihan otomatis
 * terbit saat daftar), penjadwalan otomatis mengikuti pilihan pendaftar
 * sehingga tidak menjadi tahap tersendiri, dan pengolahan data + pelaporan
 * digabung menjadi "Pelaporan Hasil".
 */
export const statusAlur = [
  "MENUNGGU_PEMBAYARAN",
  "TERVERIFIKASI",
  "PELAKSANAAN",
  "PENGOLAHAN_DATA",
  "SELESAI",
] as const;

export type StatusAlur = (typeof statusAlur)[number];

export type Tahap = {
  kode: StatusAlur;
  nomor: number;
  judul: string;
  isi: string;
  aktor: string;
  peran: Role[];
};

export const TAHAP: Tahap[] = [
  {
    kode: "MENUNGGU_PEMBAYARAN",
    nomor: 1,
    judul: "Pendaftaran & Pembayaran",
    isi: "Daftar layanan, pilih jadwal, lalu unggah bukti pembayaran.",
    aktor: "Klien",
    peran: ["ADMIN"],
  },
  {
    kode: "TERVERIFIKASI",
    nomor: 2,
    judul: "Verifikasi Pembayaran",
    isi: "Admin memeriksa bukti pembayaran dan mengonfirmasi jadwal tes Anda.",
    aktor: "Admin",
    peran: ["ADMIN"],
  },
  {
    kode: "PELAKSANAAN",
    nomor: 3,
    judul: "Pelaksanaan Tes",
    isi: "Kerjakan tes melalui tautan dari asisten, sesuai jadwal Anda.",
    aktor: "Klien & Asisten",
    peran: ["ASISTEN"],
  },
  {
    kode: "PENGOLAHAN_DATA",
    nomor: 4,
    judul: "Pelaporan Hasil",
    isi: "Tes selesai dikerjakan. Psikolog menyusun laporan hasil Anda.",
    aktor: "Psikolog",
    peran: ["ASISTEN", "PSIKOLOG"],
  },
  {
    kode: "SELESAI",
    nomor: 5,
    judul: "Selesai",
    isi: "Laporan diserahkan pada sesi umpan balik bersama psikolog.",
    aktor: "Psikolog",
    peran: ["PSIKOLOG"],
  },
];

export const petaTahap = new Map(TAHAP.map((t) => [t.kode, t]));

/**
 * Status lama sebelum penyederhanaan (BARU, SKRINING, TERJADWAL) dipetakan ke
 * tahap terdekat agar data lama tetap tampil wajar dan otomatis dimigrasikan
 * oleh `majuOtomatis` saat kasus disentuh berikutnya.
 */
const LEGACY_KE_TAHAP: Record<string, StatusAlur> = {
  BARU: "MENUNGGU_PEMBAYARAN",
  SKRINING: "MENUNGGU_PEMBAYARAN",
  TERJADWAL: "PELAKSANAAN",
};

/** Kode tahap yang berlaku (legacy dinormalisasi). Null bila di luar alur. */
export function normalisasiStatus(status: string): StatusAlur | null {
  if (petaTahap.has(status as StatusAlur)) return status as StatusAlur;
  return LEGACY_KE_TAHAP[status] ?? null;
}

export function nomorTahap(status: string): number {
  const kode = normalisasiStatus(status);
  return kode ? (petaTahap.get(kode)?.nomor ?? 0) : 0;
}

export function tahapKe(nomor: number): Tahap | undefined {
  return TAHAP.find((t) => t.nomor === nomor);
}

/** Tahap berikutnya, atau null bila sudah selesai/di luar alur. */
export function tahapBerikutnya(status: string): Tahap | null {
  const n = nomorTahap(status);
  if (n === 0 || n >= TAHAP.length) return null;
  return tahapKe(n + 1) ?? null;
}

/** Tahap sebelumnya (untuk koreksi oleh admin). */
export function tahapSebelumnya(status: string): Tahap | null {
  const n = nomorTahap(status);
  if (n <= 1) return null;
  return tahapKe(n - 1) ?? null;
}

/** Apakah status berada pada atau setelah tahap tertentu. */
export function sudahMencapai(status: string, target: StatusAlur): boolean {
  const a = nomorTahap(status);
  const b = nomorTahap(target);
  return a > 0 && b > 0 && a >= b;
}
