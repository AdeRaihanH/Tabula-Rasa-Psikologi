import "server-only";

import type { IsiSesi } from "@/lib/auth/session";
import { klienMilikSaya } from "@/lib/auth/dal";
import { nomorTahap } from "@/lib/alur";
import { prisma } from "@/lib/prisma";

export type JenisNotifikasi = "peringatan" | "info" | "sukses";

export type Notifikasi = {
  id: string;
  judul: string;
  isi: string;
  href: string;
  jenis: JenisNotifikasi;
  /** Waktu kejadian (ISO) bila ada, untuk pengurutan. */
  waktu?: string;
};

/**
 * Pemberitahuan dihitung langsung dari kondisi database, bukan dari tabel
 * terpisah. Dengan begitu isinya selalu akurat (mis. jumlah yang menunggu
 * verifikasi berkurang begitu admin memverifikasi) tanpa perlu mekanisme
 * penandaan "sudah dibaca" yang bisa basi.
 */
export async function ambilNotifikasi(sesi: IsiSesi): Promise<Notifikasi[]> {
  switch (sesi.role) {
    case "ADMIN":
      return notifikasiAdmin();
    case "ASISTEN":
      return notifikasiAsisten();
    case "PSIKOLOG":
      return notifikasiPsikolog(sesi.userId);
    case "KLIEN":
      return notifikasiKlien(sesi);
    default:
      return [];
  }
}

async function notifikasiAdmin(): Promise<Notifikasi[]> {
  const [
    baru,
    tagihanMenunggu,
    buktiMenunggu,
    siapArsip,
    tanpaPsikolog,
  ] = await Promise.all([
    prisma.pendaftaran.count({ where: { status: "BARU" } }),
    prisma.pembayaran.count({ where: { status: "MENUNGGU" } }),
    prisma.pembayaran.count({
      where: { status: "MENUNGGU", buktiUrl: { not: null } },
    }),
    prisma.pendaftaran.count({ where: { status: "SELESAI", arsip: null } }),
    prisma.pendaftaran.count({
      where: { psikologId: null, status: { notIn: ["SELESAI", "DIBATALKAN"] } },
    }),
  ]);

  const daftar: Notifikasi[] = [];

  if (baru > 0) {
    daftar.push({
      id: "admin-baru",
      judul: `${baru} pendaftaran baru`,
      isi: "Perlu skrining kebutuhan sebelum diproses lebih lanjut.",
      href: "/dashboard/pendaftaran?status=BARU",
      jenis: "info",
    });
  }

  if (buktiMenunggu > 0) {
    daftar.push({
      id: "admin-bukti",
      judul: `${buktiMenunggu} bukti pembayaran siap diverifikasi`,
      isi: "Klien sudah mengunggah bukti transfer.",
      href: "/dashboard/pendaftaran?status=MENUNGGU_PEMBAYARAN",
      jenis: "peringatan",
    });
  }

  const tagihanTanpaBukti = tagihanMenunggu - buktiMenunggu;
  if (tagihanTanpaBukti > 0) {
    daftar.push({
      id: "admin-tagihan",
      judul: `${tagihanTanpaBukti} tagihan belum dibayar`,
      isi: "Tagihan sudah diterbitkan, menunggu pembayaran klien.",
      href: "/dashboard/pendaftaran?status=MENUNGGU_PEMBAYARAN",
      jenis: "info",
    });
  }

  if (tanpaPsikolog > 0) {
    daftar.push({
      id: "admin-tanpa-psikolog",
      judul: `${tanpaPsikolog} kasus belum punya psikolog`,
      isi: "Tetapkan psikolog penanggung jawab agar bisa dijadwalkan.",
      href: "/dashboard/pendaftaran",
      jenis: "peringatan",
    });
  }

  if (siapArsip > 0) {
    daftar.push({
      id: "admin-arsip",
      judul: `${siapArsip} kasus selesai siap diarsipkan`,
      isi: "Laporan sudah difinalkan dan menunggu pengarsipan.",
      href: "/dashboard/arsip",
      jenis: "info",
    });
  }

  return daftar;
}

async function notifikasiAsisten(): Promise<Notifikasi[]> {
  const [perluTes, perluSkor] = await Promise.all([
    prisma.pendaftaran.count({
      where: {
        status: { in: ["TERJADWAL", "PELAKSANAAN"] },
        lembarTes: { none: {} },
      },
    }),
    prisma.lembarTes.count({
      where: {
        status: { in: ["MENUNGGU", "DIKERJAKAN"] },
        skor: { none: {} },
      },
    }),
  ]);

  const daftar: Notifikasi[] = [];

  if (perluTes > 0) {
    daftar.push({
      id: "asisten-perlu-tes",
      judul: `${perluTes} kasus belum punya lembar tes`,
      isi: "Sesi sudah terjadwal — siapkan lembar tesnya.",
      href: "/dashboard/asesmen",
      jenis: "peringatan",
    });
  }

  if (perluSkor > 0) {
    daftar.push({
      id: "asisten-perlu-skor",
      judul: `${perluSkor} lembar tes belum ada skor`,
      isi: "Isi skor mentah agar psikolog dapat menyusun laporan.",
      href: "/dashboard/asesmen",
      jenis: "info",
    });
  }

  return daftar;
}

async function notifikasiPsikolog(userId: string): Promise<Notifikasi[]> {
  const [perluLaporan, draft] = await Promise.all([
    prisma.pendaftaran.count({
      where: {
        psikologId: userId,
        status: "PENGOLAHAN_DATA",
        laporan: null,
      },
    }),
    prisma.laporanHasil.count({
      where: { psikologId: userId, status: "DRAFT" },
    }),
  ]);

  const daftar: Notifikasi[] = [];

  if (perluLaporan > 0) {
    daftar.push({
      id: "psikolog-perlu-laporan",
      judul: `${perluLaporan} kasus siap dibuatkan laporan`,
      isi: "Skor mentah sudah lengkap dan menunggu interpretasi Anda.",
      href: "/dashboard/kasus",
      jenis: "peringatan",
    });
  }

  if (draft > 0) {
    daftar.push({
      id: "psikolog-draft",
      judul: `${draft} laporan masih draft`,
      isi: "Finalkan agar kasus dapat diselesaikan dan diarsipkan.",
      href: "/dashboard/kasus",
      jenis: "info",
    });
  }

  return daftar;
}

async function notifikasiKlien(sesi: IsiSesi): Promise<Notifikasi[]> {
  const daftarKlien = await klienMilikSaya(sesi);
  const ids = daftarKlien.map((k) => k.id);
  if (ids.length === 0) return [];

  const [ditolak, belumBayar, selesai, jadwal] = await Promise.all([
    prisma.pembayaran.count({
      where: { pendaftaran: { klienId: { in: ids } }, status: "DITOLAK" },
    }),
    prisma.pembayaran.count({
      where: {
        pendaftaran: { klienId: { in: ids } },
        status: "MENUNGGU",
        buktiUrl: null,
      },
    }),
    prisma.pendaftaran.count({
      where: { klienId: { in: ids }, status: "SELESAI" },
    }),
    prisma.jadwalSesi.count({
      where: {
        pendaftaran: { klienId: { in: ids } },
        status: "TERJADWAL",
        mulai: { gte: new Date() },
      },
    }),
  ]);

  const daftar: Notifikasi[] = [];

  if (ditolak > 0) {
    daftar.push({
      id: "klien-ditolak",
      judul: `${ditolak} bukti pembayaran ditolak`,
      isi: "Silakan periksa dan kirim ulang bukti yang benar.",
      href: "/dashboard/riwayat",
      jenis: "peringatan",
    });
  }

  if (belumBayar > 0) {
    daftar.push({
      id: "klien-belum-bayar",
      judul: `${belumBayar} tagihan belum dibayar`,
      isi: "Selesaikan pembayaran agar sesi dapat dijadwalkan.",
      href: "/dashboard/riwayat",
      jenis: "peringatan",
    });
  }

  if (jadwal > 0) {
    daftar.push({
      id: "klien-jadwal",
      judul: `${jadwal} sesi akan datang`,
      isi: "Lihat jadwal dan detail sesi Anda.",
      href: "/dashboard/riwayat",
      jenis: "info",
    });
  }

  if (selesai > 0) {
    daftar.push({
      id: "klien-selesai",
      judul: `${selesai} layanan telah selesai`,
      isi: "Laporan diserahkan melalui sesi umpan balik psikolog.",
      href: "/dashboard/riwayat",
      jenis: "sukses",
    });
  }

  return daftar;
}

/** Jumlah pemberitahuan yang berjenis peringatan (untuk bulatan merah). */
export function jumlahPenting(daftar: Notifikasi[]) {
  return daftar.filter((n) => n.jenis === "peringatan").length;
}

/** Status tahap untuk penyaringan cepat di halaman terkait. */
export const tahapMenunggu = nomorTahap("MENUNGGU_PEMBAYARAN");
