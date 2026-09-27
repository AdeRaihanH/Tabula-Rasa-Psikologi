import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { ambilTokenSesi, dekripsiSesi, sesiTercatat, type IsiSesi } from "@/lib/auth/session";
import { sidikPerangkat } from "@/lib/keamanan/ip";
import { prisma } from "@/lib/prisma";
import { boleh, type Kemampuan, type Role } from "@/lib/rbac";

/**
 * Sesi ringkas dari cookie: hanya memverifikasi tanda tangan JWT, tanpa
 * menyentuh database. Dipakai untuk keperluan tampilan (mis. tombol di header).
 * JANGAN dipakai untuk otorisasi.
 */
export const sesiRingkas = cache(async (): Promise<IsiSesi | null> => {
  const token = await ambilTokenSesi();
  return dekripsiSesi(token);
});

/**
 * Sesi saat ini, diverifikasi penuh: tanda tangan JWT **dan** keberadaannya di
 * tabel `sesi_login` (belum kedaluwarsa, perangkat cocok). Ini yang menjadi
 * dasar otorisasi — sesi yang dicabut atau cookie yang dicuri dari peramban
 * lain tidak akan lolos. Di-memo per render pass.
 */
export const sesiSaatIni = cache(async (): Promise<IsiSesi | null> => {
  const isi = await sesiRingkas();
  if (!isi) return null;

  const h = await headers();
  const tercatat = await sesiTercatat(isi.sid, sidikPerangkat(h));
  if (!tercatat) return null;
  // Pakai nama terkini dari database agar perubahan nama segera terlihat.
  return { ...isi, nama: tercatat.nama };
});

/** Wajib login. Mengembalikan sesi atau mengalihkan ke /masuk. */
export const wajibMasuk = cache(async (): Promise<IsiSesi> => {
  const sesi = await sesiSaatIni();
  if (!sesi?.userId) redirect("/masuk");
  return sesi;
});

/** Wajib salah satu peran. */
export const wajibPeran = cache(
  async (...peran: Role[]): Promise<IsiSesi> => {
    const sesi = await wajibMasuk();
    if (!peran.includes(sesi.role)) redirect("/dashboard");
    return sesi;
  },
);

/** Wajib memiliki kemampuan tertentu (matriks hak akses). */
export async function wajibKemampuan(kemampuan: Kemampuan): Promise<IsiSesi> {
  const sesi = await wajibMasuk();
  if (!boleh(sesi.role, kemampuan)) redirect("/dashboard");
  return sesi;
}

/**
 * Record Klien milik pengguna yang sedang login.
 *
 * Pencocokan memakai `userId` ATAU `email`, supaya riwayat yang dibuat sebelum
 * akun ada (pendaftaran lama tanpa akun) tetap ikut terbaca. `Klien.email`
 * tidak unik, jadi beberapa record bisa cocok.
 */
export const klienMilikSaya = cache(async (sesi: IsiSesi) => {
  const user = await prisma.user.findUnique({
    where: { id: sesi.userId },
    select: { email: true },
  });
  if (!user) return [];

  return prisma.klien.findMany({
    where: {
      OR: [{ userId: sesi.userId }, { email: user.email }],
    },
    orderBy: { createdAt: "desc" },
  });
});

/** Wajib login sebagai klien. Mengalihkan peran internal ke dashboard-nya. */
export const wajibKlien = cache(async (): Promise<IsiSesi> => {
  const sesi = await wajibMasuk();
  if (sesi.role !== "KLIEN") redirect("/dashboard");
  return sesi;
});

/**
 * Filter `where` untuk pendaftaran milik klien yang login.
 * Dipakai agar klien tidak pernah bisa membaca kasus klien lain.
 */
export async function filterPendaftaranKlien(sesi: IsiSesi) {
  const daftarKlien = await klienMilikSaya(sesi);
  const user = await prisma.user.findUnique({
    where: { id: sesi.userId },
    select: { email: true },
  });

  const ids = daftarKlien.map((k) => k.id);

  // Bila belum ada record Klien sama sekali, cocokkan lewat email pendaftaran.
  if (ids.length === 0) {
    return { klien: { email: user?.email ?? "__tidak_ada__" } };
  }

  return {
    OR: [
      { klienId: { in: ids } },
      ...(user?.email ? [{ klien: { email: user.email } }] : []),
    ],
  };
}
