"use server";

import { revalidatePath } from "next/cache";

import { wajibKemampuan } from "@/lib/auth/dal";
import { folderPendaftaran } from "@/lib/drive-arsip";
import { driveAktif, unggahBerkas } from "@/lib/gdrive";
import { prisma } from "@/lib/prisma";

export type HasilDriveAksi = { ok: boolean; pesan: string } | undefined;

export async function buatFolderDrive(
  _sebelumnya: HasilDriveAksi,
  formData: FormData,
): Promise<HasilDriveAksi> {
  const sesi = await wajibKemampuan("pendaftaran:kelola");
  const pendaftaranId = String(formData.get("pendaftaranId") ?? "");
  if (!pendaftaranId) return { ok: false, pesan: "Pendaftaran tidak dikenali." };

  if (!driveAktif()) {
    return {
      ok: false,
      pesan:
        "Google Drive belum dikonfigurasi. Hubungi administrator untuk mengisi kredensial Drive.",
    };
  }

  try {
    const folder = await folderPendaftaran(pendaftaranId);

    await prisma.auditLog.create({
      data: {
        userId: sesi.userId,
        aksi: "BUAT_FOLDER_DRIVE",
        entitas: "Pendaftaran",
        entitasId: pendaftaranId,
        detail: `Folder arsip Drive dibuat: ${folder.tautan}`,
      },
    });

    revalidatePath(`/dashboard/pendaftaran/${pendaftaranId}`);
    revalidatePath("/dashboard/arsip");
    return { ok: true, pesan: "Folder arsip berhasil disiapkan di Google Drive." };
  } catch (e) {
    return {
      ok: false,
      pesan: e instanceof Error ? e.message : "Gagal membuat folder Drive.",
    };
  }
}

export async function unggahBuktiPembayaran(
  _sebelumnya: HasilDriveAksi,
  formData: FormData,
): Promise<HasilDriveAksi> {
  const sesi = await wajibKemampuan("pembayaran:verifikasi");
  const pembayaranId = String(formData.get("pembayaranId") ?? "");
  const berkas = formData.get("berkas");

  if (!pembayaranId) return { ok: false, pesan: "Pembayaran tidak dikenali." };
  if (!(berkas instanceof File) || berkas.size === 0) {
    return { ok: false, pesan: "Pilih berkas bukti pembayaran terlebih dahulu." };
  }
  if (berkas.size > 8 * 1024 * 1024) {
    return { ok: false, pesan: "Ukuran berkas maksimal 8 MB." };
  }

  const bayar = await prisma.pembayaran.findUnique({
    where: { id: pembayaranId },
    select: { id: true, pendaftaranId: true },
  });
  if (!bayar) return { ok: false, pesan: "Data pembayaran tidak ditemukan." };

  if (!driveAktif()) {
    return {
      ok: false,
      pesan:
        "Google Drive belum dikonfigurasi. Bukti pembayaran dapat dicatat secara manual.",
    };
  }

  try {
    const folder = await folderPendaftaran(bayar.pendaftaranId);
    const nama = `bukti-pembayaran-${Date.now()}-${berkas.name}`.slice(0, 120);
    const hasil = await unggahBerkas({
      nama,
      mimeType: berkas.type || "application/octet-stream",
      data: Buffer.from(await berkas.arrayBuffer()),
      folderId: folder.id,
    });

    await prisma.pembayaran.update({
      where: { id: pembayaranId },
      data: { buktiUrl: hasil.tautan },
    });

    await prisma.auditLog.create({
      data: {
        userId: sesi.userId,
        aksi: "UNGGAH_BUKTI_PEMBAYARAN",
        entitas: "Pembayaran",
        entitasId: pembayaranId,
        detail: `Bukti pembayaran diunggah ke Drive: ${hasil.tautan}`,
      },
    });

    revalidatePath(`/dashboard/pendaftaran/${bayar.pendaftaranId}`);
    return { ok: true, pesan: "Bukti pembayaran berhasil diunggah ke Google Drive." };
  } catch (e) {
    return {
      ok: false,
      pesan: e instanceof Error ? e.message : "Gagal mengunggah berkas.",
    };
  }
}

export async function unggahDokumenPendaftaran(
  _sebelumnya: HasilDriveAksi,
  formData: FormData,
): Promise<HasilDriveAksi> {
  const sesi = await wajibKemampuan("pendaftaran:kelola");
  const pendaftaranId = String(formData.get("pendaftaranId") ?? "");
  const berkas = formData.get("berkas");

  if (!pendaftaranId) return { ok: false, pesan: "Pendaftaran tidak dikenali." };
  if (!(berkas instanceof File) || berkas.size === 0) {
    return { ok: false, pesan: "Pilih berkas terlebih dahulu." };
  }
  if (berkas.size > 8 * 1024 * 1024) {
    return { ok: false, pesan: "Ukuran berkas maksimal 8 MB." };
  }

  if (!driveAktif()) {
    return { ok: false, pesan: "Google Drive belum dikonfigurasi." };
  }

  try {
    const folder = await folderPendaftaran(pendaftaranId);
    const hasil = await unggahBerkas({
      nama: `${Date.now()}-${berkas.name}`.slice(0, 120),
      mimeType: berkas.type || "application/octet-stream",
      data: Buffer.from(await berkas.arrayBuffer()),
      folderId: folder.id,
    });

    await prisma.auditLog.create({
      data: {
        userId: sesi.userId,
        aksi: "UNGGAH_DOKUMEN",
        entitas: "Pendaftaran",
        entitasId: pendaftaranId,
        detail: `Dokumen ${berkas.name} diunggah ke Drive: ${hasil.tautan}`,
      },
    });

    revalidatePath(`/dashboard/pendaftaran/${pendaftaranId}`);
    return { ok: true, pesan: "Dokumen berhasil diunggah ke Google Drive." };
  } catch (e) {
    return {
      ok: false,
      pesan: e instanceof Error ? e.message : "Gagal mengunggah dokumen.",
    };
  }
}

