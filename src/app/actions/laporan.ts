"use server";

import { revalidatePath } from "next/cache";

import { wajibKemampuan } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";

async function catat(
  userId: string,
  aksi: string,
  entitas: string,
  entitasId: string,
  detail: string,
) {
  await prisma.auditLog.create({
    data: { userId, aksi, entitas, entitasId, detail },
  });
}

/**
 * Menyimpan laporan Zona 3. Psikolog hanya boleh menyentuh kasus miliknya —
 * dijaga di dua lapis: peran (laporan:kelola) dan kepemilikan kasus.
 */
export async function simpanLaporan(formData: FormData) {
  const sesi = await wajibKemampuan("laporan:kelola");
  const pendaftaranId = String(formData.get("pendaftaranId") ?? "");
  const finalkan = String(formData.get("finalkan") ?? "") === "1";
  if (!pendaftaranId) return;

  const pendaftaran = await prisma.pendaftaran.findUnique({
    where: { id: pendaftaranId },
    select: { id: true, psikologId: true, nomor: true },
  });
  if (!pendaftaran) return;

  // Batas isolasi: psikolog lain tidak boleh menyentuh kasus ini.
  if (pendaftaran.psikologId !== sesi.userId) {
    await catat(
      sesi.userId,
      "AKSES_LAPORAN_DITOLAK",
      "LaporanHasil",
      pendaftaranId,
      `Percobaan akses laporan kasus ${pendaftaran.nomor} yang bukan miliknya`,
    );
    return;
  }

  const data = {
    ringkasan: String(formData.get("ringkasan") ?? "").trim() || null,
    interpretasi: String(formData.get("interpretasi") ?? "").trim() || null,
    rekomendasi: String(formData.get("rekomendasi") ?? "").trim() || null,
    kesimpulan: String(formData.get("kesimpulan") ?? "").trim() || null,
    status: finalkan ? ("FINAL" as const) : ("DRAFT" as const),
    difinalkanPada: finalkan ? new Date() : null,
  };

  const laporan = await prisma.laporanHasil.upsert({
    where: { pendaftaranId },
    create: { pendaftaranId, psikologId: sesi.userId, ...data },
    update: data,
  });

  if (finalkan) {
    await prisma.pendaftaran.update({
      where: { id: pendaftaranId },
      data: { status: "SELESAI" },
    });
  }

  await catat(
    sesi.userId,
    finalkan ? "FINALKAN_LAPORAN" : "SIMPAN_DRAFT_LAPORAN",
    "LaporanHasil",
    laporan.id,
    `Laporan kasus ${pendaftaran.nomor} disimpan (Zona 3)`,
  );

  revalidatePath(`/dashboard/kasus/${pendaftaranId}`);
  revalidatePath("/dashboard/kasus");
}
