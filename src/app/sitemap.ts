import type { MetadataRoute } from "next";

import { ambilLayanan } from "@/lib/data-publik";

const dasar = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tabularasa.id";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const layanan = await ambilLayanan();
  const sekarang = new Date();

  const halamanStatis = [
    { url: `${dasar}/`, prioritas: 1 },
    { url: `${dasar}/layanan`, prioritas: 0.9 },
    { url: `${dasar}/biaya`, prioritas: 0.8 },
    { url: `${dasar}/tim`, prioritas: 0.8 },
    { url: `${dasar}/alur`, prioritas: 0.7 },
    { url: `${dasar}/kerahasiaan`, prioritas: 0.7 },
    { url: `${dasar}/faq`, prioritas: 0.6 },
    { url: `${dasar}/kontak`, prioritas: 0.6 },
    { url: `${dasar}/daftar`, prioritas: 0.9 },
    { url: `${dasar}/cek-status`, prioritas: 0.5 },
  ];

  return [
    ...halamanStatis.map((h) => ({
      url: h.url,
      lastModified: sekarang,
      changeFrequency: "monthly" as const,
      priority: h.prioritas,
    })),
    ...layanan.map((l) => ({
      url: `${dasar}/layanan/${l.slug}`,
      lastModified: l.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
