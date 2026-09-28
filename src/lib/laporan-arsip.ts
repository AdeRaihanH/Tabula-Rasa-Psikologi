import "server-only";

import { prisma } from "@/lib/prisma";
import { bisaMembuatBerkas, unggahBerkas } from "@/lib/gdrive";
import {
  buildLaporanDocx,
  namaDokumenLaporan,
  type DataDokumen,
} from "@/lib/laporan-doc";

/** Mengumpulkan seluruh data yang diperlukan untuk dokumen laporan. */
export async function bangunDataDokumen(
  pendaftaranId: string,
): Promise<{ data: DataDokumen; laporanId: string } | null> {
  const p = await prisma.pendaftaran.findUnique({
    where: { id: pendaftaranId },
    include: {
      klien: {
        select: {
          nama: true,
          tanggalLahir: true,
          jenisKelamin: true,
          email: true,
          telepon: true,
          institusi: true,
          alamat: true,
        },
      },
      layanan: { select: { nama: true } },
      psikolog: {
        select: {
          nama: true,
          profilPsikolog: {
            select: { gelar: true, driveFolderId: true },
          },
        },
      },
      laporan: true,
    },
  });

  if (!p || !p.laporan) return null;

  const pengaturan = await prisma.pengaturanSitus.findUnique({
    where: { id: "utama" },
    select: { namaBiro: true },
  });

  const data: DataDokumen = {
    nomor: p.nomor,
    namaKlien: p.klien.nama,
    tanggalLahir: p.klien.tanggalLahir,
    jenisKelamin: p.klien.jenisKelamin,
    email: p.klien.email,
    telepon: p.klien.telepon,
    institusi: p.klien.institusi,
    alamat: p.klien.alamat,
    namaLayanan: p.layanan.nama,
    namaPsikolog: p.psikolog?.nama ?? "Psikolog",
    gelarPsikolog: p.psikolog?.profilPsikolog?.gelar ?? null,
    namaBiro: pengaturan?.namaBiro ?? "Tabula Rasa",
    difinalkanPada: p.laporan.difinalkanPada,
    ringkasan: p.laporan.ringkasan,
    interpretasi: p.laporan.interpretasi,
    kesimpulan: p.laporan.kesimpulan,
    rekomendasi: p.laporan.rekomendasi,
  };

  return { data, laporanId: p.laporan.id };
}

/**
 * Membuat dokumen Word laporan dan mengunggahnya ke folder Drive psikolog
 * penanggung jawab. Dipanggil otomatis saat laporan difinalkan.
 *
 * Kegagalan (kredensial belum diisi, mode service account, folder belum
 * diatur) tidak menggagalkan finalisasi — dokumen tetap dapat diunduh langsung
 * dari aplikasi oleh psikolog yang bersangkutan.
 */
export async function arsipkanDokumenLaporan(
  pendaftaranId: string,
): Promise<{ ok: boolean; pesan: string; url?: string }> {
  const bangun = await bangunDataDokumen(pendaftaranId);
  if (!bangun) return { ok: false, pesan: "Laporan belum tersimpan." };

  const buffer = await buildLaporanDocx(bangun.data);
  const nama = namaDokumenLaporan(
    bangun.data.nomor,
    bangun.data.namaKlien,
  );

  const p = await prisma.pendaftaran.findUnique({
    where: { id: pendaftaranId },
    select: {
      psikolog: {
        select: { profilPsikolog: { select: { driveFolderId: true } } },
      },
    },
  });
  const folderId = p?.psikolog?.profilPsikolog?.driveFolderId ?? null;

  if (!bisaMembuatBerkas() || !folderId) {
    // Dokumen tetap dicatat namanya; tautan Drive belum tersedia.
    await prisma.laporanHasil.update({
      where: { id: bangun.laporanId },
      data: { dokumenNama: nama },
    });
    return {
      ok: false,
      pesan:
        "Dokumen dibuat, namun belum diunggah ke Drive (kredensial/folder psikolog belum siap). Dokumen tetap dapat diunduh dari halaman kasus.",
    };
  }

  const hasil = await unggahBerkas({
    nama,
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    data: buffer,
    folderId,
  });

  await prisma.laporanHasil.update({
    where: { id: bangun.laporanId },
    data: {
      dokumenUrl: hasil.tautan,
      dokumenId: hasil.id,
      dokumenNama: nama,
      dokumenPada: new Date(),
    },
  });

  return { ok: true, pesan: "Dokumen laporan diunggah ke Drive.", url: hasil.tautan };
}
