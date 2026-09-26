import type { Role } from "@/lib/rbac";

/** Status yang menjadi bagian dari alur 8 tahap (DIBATALKAN di luar alur). */
export const statusAlur = [
  "BARU",
  "SKRINING",
  "MENUNGGU_PEMBAYARAN",
  "TERVERIFIKASI",
  "TERJADWAL",
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
    kode: "BARU",
    nomor: 1,
    judul: "Pendaftaran Baru",
    isi: "Formulir Anda sudah masuk dan menunggu diperiksa admin.",
    aktor: "Klien",
    peran: ["ADMIN"],
  },
  {
    kode: "SKRINING",
    nomor: 2,
    judul: "Skrining Kebutuhan",
    isi: "Admin sedang memverifikasi kebutuhan Anda.",
    aktor: "Admin",
    peran: ["ADMIN"],
  },
  {
    kode: "MENUNGGU_PEMBAYARAN",
    nomor: 3,
    judul: "Menunggu Pembayaran",
    isi: "Tagihan sudah diterbitkan, menunggu pembayaran dan verifikasi.",
    aktor: "Klien & Admin",
    peran: ["ADMIN"],
  },
  {
    kode: "TERVERIFIKASI",
    nomor: 4,
    judul: "Terverifikasi",
    isi: "Pembayaran sah. Menunggu penjadwalan sesi.",
    aktor: "Admin",
    peran: ["ADMIN"],
  },
  {
    kode: "TERJADWAL",
    nomor: 5,
    judul: "Terjadwal",
    isi: "Sesi sudah dijadwalkan bersama psikolog.",
    aktor: "Admin",
    peran: ["ADMIN"],
  },
  {
    kode: "PELAKSANAAN",
    nomor: 6,
    judul: "Pelaksanaan",
    isi: "Sesi atau asesmen sedang berlangsung.",
    aktor: "Asisten Psikolog",
    peran: ["ASISTEN"],
  },
  {
    kode: "PENGOLAHAN_DATA",
    nomor: 7,
    judul: "Pengolahan Data",
    isi: "Hasil sedang diolah dan disusun laporannya.",
    aktor: "Asisten & Psikolog",
    peran: ["ASISTEN", "PSIKOLOG"],
  },
  {
    kode: "SELESAI",
    nomor: 8,
    judul: "Selesai",
    isi: "Laporan sudah diserahkan. Kasus memasuki tahap pengarsipan.",
    aktor: "Psikolog",
    peran: ["PSIKOLOG"],
  },
];

export const petaTahap = new Map(TAHAP.map((t) => [t.kode, t]));

export function nomorTahap(status: string): number {
  return petaTahap.get(status as StatusAlur)?.nomor ?? 0;
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
