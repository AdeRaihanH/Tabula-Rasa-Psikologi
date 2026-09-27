/**
 * Perhitungan biaya layanan.
 *
 * Seluruh layanan dilaksanakan **Tatap Muka**, jadi biaya diambil dari
 * `hargaOffline`; `harga` (umum) dipakai sebagai cadangan bila belum diisi.
 */

export type Harga = {
  harga?: unknown;
  hargaOffline?: unknown;
};

/** Mengubah nilai Decimal/string/null dari Prisma menjadi number atau null. */
export function keAngka(nilai: unknown): number | null {
  if (nilai === null || nilai === undefined) return null;
  const n = typeof nilai === "number" ? nilai : Number(nilai);
  return Number.isFinite(n) ? n : null;
}

/** Biaya layanan tatap muka, atau null bila belum ditetapkan. */
export function hitungBiaya(layanan: Harga): number | null {
  return keAngka(layanan.hargaOffline) ?? keAngka(layanan.harga);
}

/** Ringkasan harga layanan untuk ditampilkan di kartu layanan. */
export function hargaPerMetode(layanan: Harga) {
  const offline = keAngka(layanan.hargaOffline) ?? keAngka(layanan.harga);
  return { offline };
}
