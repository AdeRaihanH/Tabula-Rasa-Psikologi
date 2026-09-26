/**
 * Nama cookie sesi.
 *
 * Di produksi memakai awalan `__Host-` yang dipaksakan peramban: cookie wajib
 * `Secure`, ber-`Path=/`, dan tanpa `Domain`. Ini mencegah subdomain lain
 * menimpa atau menyuntik cookie sesi (session fixation lewat subdomain).
 *
 * Di pengembangan (http://localhost) awalan itu tidak dipakai karena `Secure`
 * tidak berlaku pada http.
 */
export const NAMA_COOKIE = `${
  process.env.NODE_ENV === "production" ? "__Host-" : ""
}tr_session`;
