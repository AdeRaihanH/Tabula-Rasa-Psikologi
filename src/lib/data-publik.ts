import { cache } from "react";

import { siteConfig } from "@/lib/config";
import { prisma } from "@/lib/prisma";

/**
 * Fetcher untuk halaman publik. Dibungkus try/catch supaya build/deploy tetap
 * berhasil walaupun database belum dikonfigurasi — halaman publik cukup
 * menampilkan bagian yang tersedia.
 */
export const ambilLayanan = cache(async (hanyaAktif = true) => {
  try {
    return await prisma.layanan.findMany({
      where: hanyaAktif ? { aktif: true } : undefined,
      orderBy: [{ urutan: "asc" }, { nama: "asc" }],
    });
  } catch {
    return [];
  }
});

export const ambilLayananSlug = cache(async (slug: string) => {
  try {
    return await prisma.layanan.findFirst({ where: { slug, aktif: true } });
  } catch {
    return null;
  }
});

export const ambilPsikologPublik = cache(async () => {
  try {
    return await prisma.profilPsikolog.findMany({
      where: { publik: true, user: { aktif: true } },
      include: {
        user: { select: { nama: true, fotoUrl: true } },
      },
      orderBy: { pengalaman: "desc" },
    });
  } catch {
    return [];
  }
});

export const ambilPengaturan = cache(async () => {
  try {
    return await prisma.pengaturanSitus.findUnique({ where: { id: "utama" } });
  } catch {
    return null;
  }
});

/**
 * Identitas biro untuk situs publik: gabungan pengaturan dari database
 * (dapat diubah admin) dengan nilai bawaan dari `siteConfig`.
 */
export const ambilIdentitas = cache(async () => {
  const p = await ambilPengaturan();
  return {
    nama: p?.namaBiro ?? siteConfig.nama,
    tagline: p?.tagline ?? siteConfig.tagline,
    deskripsi: p?.deskripsi ?? siteConfig.deskripsi,
    telepon: p?.telepon ?? siteConfig.telepon,
    whatsapp: p?.whatsapp ?? siteConfig.whatsapp,
    email: p?.email ?? siteConfig.email,
    alamat: p?.alamat ?? siteConfig.alamat,
    jamOperasional: p?.jamOperasional ?? siteConfig.jamOperasional,
  };
});
