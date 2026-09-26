"use server";

import { revalidatePath } from "next/cache";

import { wajibKemampuan } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";

export async function simpanPengaturan(formData: FormData) {
  const sesi = await wajibKemampuan("pengaturan:kelola");

  const data = {
    namaBiro: String(formData.get("namaBiro") ?? "").trim() || "Tabula Rasa",
    tagline: String(formData.get("tagline") ?? "").trim() || null,
    deskripsi: String(formData.get("deskripsi") ?? "").trim() || null,
    telepon: String(formData.get("telepon") ?? "").trim() || null,
    whatsapp: String(formData.get("whatsapp") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || null,
    alamat: String(formData.get("alamat") ?? "").trim() || null,
    jamOperasional: String(formData.get("jamOperasional") ?? "").trim() || null,
    driveFolderId: String(formData.get("driveFolderId") ?? "").trim() || null,
  };

  await prisma.pengaturanSitus.upsert({
    where: { id: "utama" },
    create: { id: "utama", ...data },
    update: data,
  });

  await prisma.auditLog.create({
    data: {
      userId: sesi.userId,
      aksi: "PERBARUI_PENGATURAN",
      entitas: "PengaturanSitus",
      entitasId: "utama",
      detail: "Pengaturan situs publik diperbarui",
    },
  });

  revalidatePath("/dashboard/pengaturan");
  revalidatePath("/", "layout");
}
