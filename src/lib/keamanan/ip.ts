import "server-only";

import { headers } from "next/headers";

/**
 * Alamat IP pemanggil, dibaca dari header proxy tepercaya.
 *
 * Di Vercel, `x-forwarded-for` diisi oleh edge platform. Nilai pertama adalah
 * klien asli; sisanya adalah rantai proxy. Bila header tidak ada (mis. saat
 * pengembangan lokal), kembalikan penanda netral agar rate limit tetap bekerja
 * per-proses.
 */
export async function ambilIp() {
  const h = await headers();
  return ipDariHeader(h);
}

export function ipDariHeader(h: Headers) {
  const fwd = h.get("x-forwarded-for");
  if (fwd) {
    const pertama = fwd.split(",")[0]?.trim();
    if (pertama) return pertama;
  }
  return (
    h.get("x-real-ip")?.trim() ||
    h.get("cf-connecting-ip")?.trim() ||
    "lokal"
  );
}

/**
 * Sidik jari perangkat sederhana dari header permintaan.
 *
 * Dipakai untuk mengikat sesi ke perangkat pembuatnya: cookie yang dicuri lalu
 * dipakai di peramban lain akan ditolak karena sidik jarinya berbeda. Hanya
 * User-Agent yang dipakai agar sidik jari stabil (tidak berubah antar permintaan
 * dari peramban yang sama).
 */
export function sidikPerangkat(h: Headers) {
  return (h.get("user-agent") ?? "").slice(0, 400);
}
