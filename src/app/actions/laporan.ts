"use server";

import { revalidatePath } from "next/cache";

import { majuOtomatis, syaratFinalkan } from "@/lib/alur-otomatis";
import { wajibKemampuan } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";

export type HasilLaporan = { ok: boolean; pesan: string } | undefined;

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
 *
 * Finalisasi hanya boleh dilakukan bila asesmen benar-benar sudah dikerjakan:
 * minimal ada satu lembar tes dan seluruh lembar tes memiliki skor mentah.
 * Dengan begitu status tidak bisa melompat langsung ke "Selesai".
 */
export async function simpanLaporan(
  _sebelumnya: HasilLaporan,
  formData: FormData,
): Promise<HasilLaporan> {
  const sesi = await wajibKemampuan("laporan:kelola");
  const pendaftaranId = String(formData.get("pendaftaranId") ?? "");
  const finalkan = String(formData.get("finalkan") ?? "") === "1";
  if (!pendaftaranId) return { ok: false, pesan: "Pendaftaran tidak dikenali." };

  const pendaftaran = await prisma.pendaftaran.findUnique({
    where: { id: pendaftaranId },
    select: { id: true, psikologId: true, nomor: true, status: true },
  });
  if (!pendaftaran) return { ok: false, pesan: "Pendaftaran tidak ditemukan." };

  // Batas isolasi: psikolog lain tidak boleh menyentuh kasus ini.
  if (pendaftaran.psikologId !== sesi.userId) {
    await catat(
      sesi.userId,
      "AKSES_LAPORAN_DITOLAK",
      "LaporanHasil",
      pendaftaranId,
      `Percobaan akses laporan kasus ${pendaftaran.nomor} yang bukan miliknya`,
    );
    return { ok: false, pesan: "Kasus ini bukan milik Anda." };
  }

  // Syarat finalisasi.
  if (finalkan) {
    const syarat = await syaratFinalkan(pendaftaranId);
    if (!syarat.ok) {
      return {
        ok: false,
        pesan: `Laporan belum dapat difinalkan: ${syarat.pesan}`,
      };
    }
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
    // Tahap 7 lalu 8 — supaya jejak audit menunjukkan keduanya.
    await majuOtomatis(pendaftaranId, "PENGOLAHAN_DATA");
    await majuOtomatis(pendaftaranId, "SELESAI");
  } else {
    // Menyusun draft berarti data sedang diolah (tahap 7).
    await majuOtomatis(pendaftaranId, "PENGOLAHAN_DATA");
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
  revalidatePath(`/dashboard/pendaftaran/${pendaftaranId}`);
  revalidatePath("/dashboard/pendaftaran");
  revalidatePath("/dashboard/asesmen");
  revalidatePath("/dashboard");

  return {
    ok: true,
    pesan: finalkan
      ? "Laporan difinalkan. Kasus berstatus Selesai dan siap diarsipkan."
      : "Draft laporan tersimpan. Kasus masuk tahap Pengolahan Data.",
  };
}
