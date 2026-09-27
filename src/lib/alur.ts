import type { Role } from "@/lib/rbac";

/**
 * Alur layanan 5 tahap (DIBATALKAN di luar alur).
 *
 * Alur baku yang berlaku:
 *   1. Pendaftaran & Pembayaran
 *   2. Verifikasi Pembayaran
 *   3. Pelaksanaan Tes (Tatap Muka di biro)
 *   4. Pelaporan Hasil
 *   5. Selesai & Umpan Balik
 *
 * Skrining dan penjadwalan bukan tahap tersendiri: tagihan terbit otomatis saat
 * mendaftar, dan jadwal dibuat otomatis dari pilihan pendaftar.
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
    isi: "Isi formulir, pilih jadwal, lalu unggah bukti pembayaran.",
    aktor: "Klien",
    peran: ["ADMIN"],
  },
  {
    kode: "TERVERIFIKASI",
    nomor: 2,
    judul: "Verifikasi Pembayaran",
    isi: "Admin memeriksa bukti dan mengonfirmasi jadwal tes Anda.",
    aktor: "Admin",
    peran: ["ADMIN"],
  },
  {
    kode: "PELAKSANAAN",
    nomor: 3,
    judul: "Pelaksanaan Tes",
    isi: "Datang ke biro sesuai jadwal; asisten mendampingi tes Anda secara Tatap Muka.",
    aktor: "Klien & Asisten",
    peran: ["ASISTEN"],
  },
  {
    kode: "PENGOLAHAN_DATA",
    nomor: 4,
    judul: "Pelaporan Hasil",
    isi: "Psikolog menyusun laporan hasil asesmen Anda.",
    aktor: "Psikolog",
    peran: ["ASISTEN", "PSIKOLOG"],
  },
  {
    kode: "SELESAI",
    nomor: 5,
    judul: "Selesai & Umpan Balik",
    isi: "Terima laporan pada sesi umpan balik bersama psikolog.",
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
