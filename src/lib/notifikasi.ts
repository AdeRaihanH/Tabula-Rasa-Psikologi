import "server-only";

import type { IsiSesi } from "@/lib/auth/session";
import { klienMilikSaya } from "@/lib/auth/dal";
import { jamWIB, labelHariWIB, parsePreferensiJadwal } from "@/lib/jadwal";
import { butuhPeringatanJam, jadwalBergeserDariPreferensi, jadwalDiubahAdmin } from "@/lib/jadwal";
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
  const [tagihanMenunggu, buktiMenunggu, siapArsip, tanpaPsikolog] =
    await Promise.all([
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
  const perluKonfirmasi = await prisma.pendaftaran.count({
    where: {
      status: { in: ["TERVERIFIKASI", "PELAKSANAAN"] },
      konfirmasiTesPada: null,
    },
  });

  const daftar: Notifikasi[] = [];

  if (perluKonfirmasi > 0) {
    daftar.push({
      id: "asisten-perlu-konfirmasi",
      judul: `${perluKonfirmasi} kasus menunggu konfirmasi`,
      isi: "Konfirmasi bahwa klien sudah melaksanakan tes di biro.",
      href: "/dashboard/asesmen",
      jenis: "peringatan",
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
      isi: "Pelaksanaan tes sudah dikonfirmasi asisten dan menunggu interpretasi Anda.",
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

  const sekarang = new Date();
  const batasReminder = new Date(sekarang.getTime() + 24 * 60 * 60 * 1000);

  const [ditolak, belumBayar, selesai, jadwalJauh, sesiMendekat] =
    await Promise.all([
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
          mulai: { gte: batasReminder },
        },
      }),
      prisma.jadwalSesi.findMany({
        where: {
          pendaftaran: { klienId: { in: ids } },
          status: "TERJADWAL",
          mulai: { gte: sekarang, lt: batasReminder },
        },
        orderBy: { mulai: "asc" },
        select: {
          id: true,
          mulai: true,
          pendaftaranId: true,
          pendaftaran: {
            select: { nomor: true, layanan: { select: { nama: true } } },
          },
        },
      }),
    ]);

  // Jadwal mendatang yang pernah diubah admin (jam digeser / ruangan
  // ditetapkan). Satu-satunya penulis ulang jadwal adalah admin, sehingga
  // `updatedAt > createdAt` berarti ada penyesuaian setelah pendaftaran —
  // dilengkapi pemeriksaan teks catatan untuk baris lama. Dibedakan dua
  // tingkat: jam bergeser (mendesak) vs info dilengkapi, jam sama (ruangan).
  const jadwalTerkini = await prisma.jadwalSesi.findMany({
    where: {
      pendaftaran: { klienId: { in: ids } },
      status: "TERJADWAL",
      mulai: { gte: sekarang },
    },
    orderBy: { mulai: "asc" },
    select: {
      id: true,
      mulai: true,
      lokasi: true,
      catatan: true,
      createdAt: true,
      updatedAt: true,
      pendaftaranId: true,
      pendaftaran: {
        select: {
          nomor: true,
          kebutuhan: true,
          layanan: { select: { nama: true } },
        },
      },
    },
  });

  const daftar: Notifikasi[] = [];

  for (const j of jadwalTerkini) {
    const diubah = jadwalDiubahAdmin(j);
    if (!diubah) continue;
    const pref = parsePreferensiJadwal(j.pendaftaran.kebutuhan);
    // Nada mengikuti edit terakhir: "diubah" hanya bila edit terakhir
    // menggeser jam. Edit info-only (ruangan) menonjolkan ruangannya.
    const peringatan = butuhPeringatanJam(j, pref);
    const bedaDariPilihan = pref
      ? jadwalBergeserDariPreferensi(j.mulai, pref, false)
      : false;
    const labelHari = labelHariWIB(j.mulai, sekarang);
    const ruangan = j.lokasi?.trim() || null;
    if (peringatan) {
      daftar.push({
        id: `klien-jadwal-diubah-${j.id}`,
        judul: `Jadwal ${j.pendaftaran.nomor} diubah admin — ${labelHari} pukul ${jamWIB(j.mulai)} WIB`,
        isi: ruangan
          ? `Waktu terbaru: ${labelHari} pukul ${jamWIB(j.mulai)} WIB (bukan lagi pilihan awal Anda). Ruangan kamu di: ${ruangan}. Buka detail untuk konfirmasi.`
          : `Waktu terbaru: ${labelHari} pukul ${jamWIB(j.mulai)} WIB (bukan lagi pilihan awal Anda). Buka detail untuk konfirmasi.`,
        href: `/dashboard/riwayat/${j.pendaftaranId}`,
        jenis: "peringatan",
        waktu: j.updatedAt.toISOString(),
      });
    } else if (ruangan) {
      daftar.push({
        id: `klien-jadwal-info-${j.id}`,
        judul: `Ruangan sesi ${j.pendaftaran.nomor}: ${ruangan}`,
        isi: bedaDariPilihan
          ? `Waktu sesi: ${labelHari} pukul ${jamWIB(j.mulai)} WIB. Ruangan kamu di: ${ruangan}.`
          : `Jam masih sesuai pilihan Anda (${labelHari} pukul ${jamWIB(j.mulai)} WIB). Ruangan kamu di: ${ruangan}.`,
        href: `/dashboard/riwayat/${j.pendaftaranId}`,
        jenis: "info",
        waktu: j.updatedAt.toISOString(),
      });
    } else {
      daftar.push({
        id: `klien-jadwal-info-${j.id}`,
        judul: `Info sesi ${j.pendaftaran.nomor} diperbarui admin`,
        isi: bedaDariPilihan
          ? `Waktu sesi: ${labelHari} pukul ${jamWIB(j.mulai)} WIB. Lihat detail untuk info terbaru.`
          : `Jam masih sesuai pilihan Anda (${labelHari} pukul ${jamWIB(j.mulai)} WIB). Lihat detail untuk info terbaru.`,
        href: `/dashboard/riwayat/${j.pendaftaranId}`,
        jenis: "info",
        waktu: j.updatedAt.toISOString(),
      });
    }
  }

  for (const s of sesiMendekat) {
    const labelHari = labelHariWIB(s.mulai, sekarang);
    daftar.push({
      id: `klien-reminder-${s.id}`,
      judul: `Pengingat: tes ${labelHari} pukul ${jamWIB(s.mulai)} WIB`,
      isi: `Tes "${s.pendaftaran.layanan.nama}" (${s.pendaftaran.nomor}) akan dilaksanakan ${labelHari}. Mohon datang tepat waktu ke biro.`,
      href: `/dashboard/riwayat/${s.pendaftaranId}`,
      jenis: "peringatan",
      waktu: s.mulai.toISOString(),
    });
  }

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

  if (jadwalJauh > 0) {
    daftar.push({
      id: "klien-jadwal",
      judul: `${jadwalJauh} sesi akan datang`,
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
