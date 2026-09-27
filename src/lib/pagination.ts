/**
 * Paginasi daftar di dashboard.
 *
 * Ukuran halaman seragam agar tabel tetap ringan dan mudah dipindai. Nilai
 * halaman dibaca dari query string (`?hal=2`) sehingga dapat di-bookmark dan
 * tetap bekerja tanpa JavaScript.
 */

export const UKURAN_HALAMAN = 20;

export type HasilPaginasi = {
  /** Halaman aktif (1-based, sudah dibatasi minimal 1). */
  hal: number;
  /** Jumlah baris yang dilewati — langsung dipakai sebagai `skip`. */
  skip: number;
  /** Jumlah baris per halaman — langsung dipakai sebagai `take`. */
  take: number;
};

/** Membaca nomor halaman dari nilai query string apa pun. */
export function halamanDari(nilai: unknown): number {
  const mentah = Array.isArray(nilai) ? nilai[0] : nilai;
  const angka = Number(mentah);
  if (!Number.isFinite(angka) || angka < 1) return 1;
  return Math.floor(angka);
}

/** Rentang data untuk Prisma (`skip` & `take`) beserta halaman aktif. */
export function hitungPaginasi(
  nilaiHalaman: unknown,
  ukuran: number = UKURAN_HALAMAN,
): HasilPaginasi {
  const hal = halamanDari(nilaiHalaman);
  const take = ukuran > 0 ? Math.floor(ukuran) : UKURAN_HALAMAN;
  return { hal, skip: (hal - 1) * take, take };
}

/** Jumlah halaman total (minimal 1 supaya UI tetap menampilkan "1 / 1"). */
export function jumlahHalaman(total: number, ukuran: number = UKURAN_HALAMAN) {
  const perHalaman = ukuran > 0 ? ukuran : UKURAN_HALAMAN;
  return Math.max(1, Math.ceil(total / perHalaman));
}
