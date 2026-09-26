/**
 * Perhitungan biaya layanan.
 *
 * Harga diambil dari layanan sesuai metode yang dipilih:
 *   ONLINE  → `hargaOnline`
 *   OFFLINE → `hargaOffline`
 * Bila harga khusus metode belum diisi, dipakai `harga` sebagai cadangan.
 */

export type Harga = {
  harga?: unknown;
  hargaOnline?: unknown;
  hargaOffline?: unknown;
};

export type Metode = "ONLINE" | "OFFLINE";

/** Mengubah nilai Decimal/string/null dari Prisma menjadi number atau null. */
export function keAngka(nilai: unknown): number | null {
  if (nilai === null || nilai === undefined) return null;
  const n = typeof nilai === "number" ? nilai : Number(nilai);
  return Number.isFinite(n) ? n : null;
}

/** Biaya layanan untuk metode tertentu, atau null bila belum ditetapkan. */
export function hitungBiaya(layanan: Harga, metode: Metode): number | null {
  const khusus = metode === "ONLINE" ? layanan.hargaOnline : layanan.hargaOffline;
  return keAngka(khusus) ?? keAngka(layanan.harga);
}

/** Ringkasan harga per metode untuk ditampilkan di kartu layanan. */
export function hargaPerMetode(layanan: Harga) {
  const online = keAngka(layanan.hargaOnline) ?? keAngka(layanan.harga);
  const offline = keAngka(layanan.hargaOffline) ?? keAngka(layanan.harga);
  return { online, offline };
}
