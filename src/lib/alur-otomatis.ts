import "server-only";

import {
  normalisasiStatus,
  nomorTahap,
  tahapKe,
  type StatusAlur,
} from "@/lib/alur";
import { prisma } from "@/lib/prisma";

export type HasilSyarat = { ok: boolean; pesan: string };

/** Memastikan seluruh syarat sebuah tahap sudah terpenuhi. */
export async function cekSyaratTahap(
  pendaftaranId: string,
  target: StatusAlur,
): Promise<HasilSyarat> {
  const p = await prisma.pendaftaran.findUnique({
    where: { id: pendaftaranId },
    include: {
      pembayaran: { select: { status: true } },
      jadwal: { select: { id: true } },
      laporan: { select: { status: true } },
    },
  });
  if (!p) return { ok: false, pesan: "Pendaftaran tidak ditemukan." };

  switch (target) {
    case "MENUNGGU_PEMBAYARAN":
      if (p.pembayaran.length === 0) {
        return {
          ok: false,
          pesan:
            "Belum ada tagihan. Catat tagihan pembayaran terlebih dahulu pada bagian Pembayaran.",
        };
      }
      return { ok: true, pesan: "" };

    case "TERVERIFIKASI":
      if (!p.pembayaran.some((b) => b.status === "TERVERIFIKASI")) {
        return {
          ok: false,
          pesan:
            "Belum ada pembayaran yang diverifikasi. Verifikasi pembayaran terlebih dahulu.",
        };
      }
      return { ok: true, pesan: "" };

    case "PELAKSANAAN":
      // Jadwal dibuat otomatis dari pilihan pendaftar saat mendaftar, jadi
      // tahap ini terbuka segera setelah ada jadwal — asisten lalu
      // membagikan tautan tes dan klien mengerjakannya sesuai jadwal.
      if (p.jadwal.length === 0) {
        return {
          ok: false,
          pesan:
            "Belum ada jadwal. Jadwal dibuat otomatis dari pilihan pendaftar, atau buat manual pada bagian Jadwal Sesi.",
        };
      }
      return { ok: true, pesan: "" };

    case "PENGOLAHAN_DATA": {
      // Psikolog hanya boleh menyusun interpretasi setelah asisten
      // mengonfirmasi bahwa klien sudah melaksanakan tes di biro.
      if (!p.konfirmasiTesPada) {
        return {
          ok: false,
          pesan:
            "Asisten psikolog belum mengonfirmasi pelaksanaan tes klien.",
        };
      }
      return { ok: true, pesan: "" };
    }

    case "SELESAI":
      if (p.laporan?.status !== "FINAL") {
        return {
          ok: false,
          pesan:
            "Laporan belum difinalkan. Psikolog perlu menyusun dan memfinalkan laporan terlebih dahulu.",
        };
      }
      return { ok: true, pesan: "" };

    default:
      return { ok: false, pesan: "Tahap tidak dikenali." };
  }
}

/**
 * Syarat menyusun laporan Zona 3: asisten harus sudah mengonfirmasi bahwa
 * klien melaksanakan tes di biro.
 */
export async function syaratFinalkan(
  pendaftaranId: string,
): Promise<{ ok: boolean; pesan: string; jumlahAlat: number }> {
  const p = await prisma.pendaftaran.findUnique({
    where: { id: pendaftaranId },
    select: {
      konfirmasiTesPada: true,
      layanan: { select: { _count: { select: { checklist: true } } } },
    },
  });
  if (!p) return { ok: false, pesan: "Pendaftaran tidak ditemukan.", jumlahAlat: 0 };

  if (!p.konfirmasiTesPada) {
    return {
      ok: false,
      pesan:
        "Asisten psikolog belum mengonfirmasi pelaksanaan tes klien.",
      jumlahAlat: 0,
    };
  }

  return { ok: true, pesan: "", jumlahAlat: p.layanan._count.checklist };
}

/**
 * Menaikkan status secara otomatis setelah sebuah tindakan berhasil.
 *
 * Aturan penting: status hanya naik SATU TAHAP demi satu dan setiap tahap
 * diperiksa syaratnya. Jadi kasus tidak mungkin melompat (mis. dari
 * "Pendaftaran" langsung ke "Selesai"). Bila syarat tahap berikutnya
 * belum terpenuhi, kenaikan berhenti di tahap terakhir yang sah.
 *
 * Status lama (BARU, SKRINING, TERJADWAL) dinormalisasi dulu ke tahap baru
 * yang setara, sehingga data lama ikut terpigrasi dengan sendirinya.
 *
 * Mengembalikan status akhir setelah proses.
 */
export async function majuOtomatis(
  pendaftaranId: string,
  target: StatusAlur,
): Promise<string> {
  const p = await prisma.pendaftaran.findUnique({
    where: { id: pendaftaranId },
    select: { status: true },
  });
  if (!p) return "";
  if (p.status === "DIBATALKAN") return p.status;

  let sekarang = normalisasiStatus(p.status);
  if (!sekarang) return p.status;
  if (sekarang !== p.status) {
    await prisma.pendaftaran.update({
      where: { id: pendaftaranId },
      data: { status: sekarang },
    });
    await prisma.auditLog.create({
      data: {
        aksi: "NAIK_TAHAP_OTOMATIS",
        entitas: "Pendaftaran",
        entitasId: pendaftaranId,
        detail: `${p.status} → ${sekarang} (normalisasi ke alur 5 tahap)`,
      },
    });
  }

  let nomorSekarang = nomorTahap(sekarang);
  const nomorTarget = nomorTahap(target);
  if (nomorSekarang === 0 || nomorTarget === 0) return sekarang;

  while (nomorSekarang < nomorTarget) {
    const berikut = tahapKe(nomorSekarang + 1);
    if (!berikut) break;

    const syarat = await cekSyaratTahap(pendaftaranId, berikut.kode);
    if (!syarat.ok) break;

    await prisma.pendaftaran.update({
      where: { id: pendaftaranId },
      data: { status: berikut.kode },
    });

    await prisma.auditLog.create({
      data: {
        aksi: "NAIK_TAHAP_OTOMATIS",
        entitas: "Pendaftaran",
        entitasId: pendaftaranId,
        detail: `${sekarang} → ${berikut.kode} (otomatis, tahap ${berikut.nomor})`,
      },
    });

    sekarang = berikut.kode;
    nomorSekarang = berikut.nomor;
  }

  return sekarang;
}
