"use server";

import { revalidatePath } from "next/cache";

import { wajibKemampuan } from "@/lib/auth/dal";
import { folderPendaftaran } from "@/lib/drive-arsip";
import { driveAktif } from "@/lib/gdrive";
import { prisma } from "@/lib/prisma";
import type { KlasifikasiData } from "@/generated/prisma/enums";

export async function arsipkanPendaftaran(formData: FormData) {
  const sesi = await wajibKemampuan("arsip:kelola");
  const pendaftaranId = String(formData.get("pendaftaranId") ?? "");
  const klasifikasi = String(formData.get("klasifikasi") ?? "ZONA_1") as KlasifikasiData;
  const bulanRetensi = Number(formData.get("bulanRetensi") ?? 60);
  const catatan = String(formData.get("catatan") ?? "").trim() || null;
  if (!pendaftaranId) return;

  const retensiSampai = new Date();
  retensiSampai.setMonth(retensiSampai.getMonth() + (bulanRetensi || 60));

  // Siapkan folder arsip di Google Drive (bila dikonfigurasi).
  let folderDriveUrl: string | null = null;
  if (driveAktif()) {
    try {
      const folder = await folderPendaftaran(pendaftaranId);
      folderDriveUrl = folder.tautan;
    } catch {
      folderDriveUrl = null;
    }
  }

  const arsip = await prisma.arsipData.upsert({
    where: { pendaftaranId },
    create: { pendaftaranId, klasifikasi, retensiSampai, catatan, folderDriveUrl },
    update: { klasifikasi, retensiSampai, catatan, ...(folderDriveUrl ? { folderDriveUrl } : {}) },
  });

  const p = await prisma.pendaftaran.findUnique({
    where: { id: pendaftaranId },
    select: { nomor: true },
  });

  await prisma.auditLog.create({
    data: {
      userId: sesi.userId,
      aksi: "ARSIPKAN_PENDAFTARAN",
      entitas: "ArsipData",
      entitasId: arsip.id,
      detail: `Kasus ${p?.nomor ?? pendaftaranId} diarsipkan (${klasifikasi})${
        folderDriveUrl ? " + folder Drive" : ""
      }`,
    },
  });

  revalidatePath("/dashboard/arsip");
}

export async function hapusArsip(formData: FormData) {
  const sesi = await wajibKemampuan("arsip:kelola");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const arsip = await prisma.arsipData.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      userId: sesi.userId,
      aksi: "BATAL_ARSIP",
      entitas: "ArsipData",
      entitasId: id,
      detail: `Arsip dibatalkan untuk pendaftaran ${arsip.pendaftaranId}`,
    },
  });

  revalidatePath("/dashboard/arsip");
}
