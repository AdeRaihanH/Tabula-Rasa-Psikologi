/**
 * Konstanta keamanan yang dipakai bersama kode server dan komponen klien.
 * Tidak boleh mengimpor modul `server-only`.
 */

/** Nama field jebakan (honeypot) yang tidak pernah diisi manusia. */
export const FIELD_JEBAKAN = "situs_web";

/** Field penanda waktu render formulir, untuk mendeteksi pengiriman instan. */
export const FIELD_WAKTU = "_waktu";

/** Waktu minimal (ms) yang wajar untuk mengisi sebuah formulir. */
export const WAKTU_MINIMAL_ISI_MS = 1500;
