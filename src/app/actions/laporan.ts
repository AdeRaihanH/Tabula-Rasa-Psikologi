"use server";

import { revalidatePath } from "next/cache";

import { majuOtomatis, syaratFinalkan } from "@/lib/alur-otomatis";
import { wajibKemampuan } from "@/lib/auth/dal";
import { arsipkanDokumenLaporan } from "@/lib/laporan-arsip";
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
 * Isolasi: psikolog hanya boleh menyentuh kasus miliknya — dijaga di dua
 * lapis: peran (laporan:kelola) dan kepemilikan kasus.
 *
 * Gerbang konfirmasi: interpretasi baru boleh disusun setelah asisten
 * psikolog mengonfirmasi bahwa klien sudah melaksanakan tes di biro.
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

  // Isolasi + gerbang konfirmasi: psikolog hanya boleh menyusun interpretasi
  // setelah asisten mengonfirmasi klien sudah melaksanakan tes.
  const syarat = await syaratFinalkan(pendaftaranId);
  if (!syarat.ok) {
    return { ok: false, pesan: syarat.pesan };
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
    // Tahap 4 lalu 5 — supaya jejak audit menunjukkan keduanya.
    await majuOtomatis(pendaftaranId, "PENGOLAHAN_DATA");
    await majuOtomatis(pendaftaranId, "SELESAI");
  } else {
    // Menyusun draft berarti laporan sedang disusun (tahap 4).
    await majuOtomatis(pendaftaranId, "PENGOLAHAN_DATA");
  }

  await catat(
    sesi.userId,
    finalkan ? "FINALKAN_LAPORAN" : "SIMPAN_DRAFT_LAPORAN",
    "LaporanHasil",
    laporan.id,
    `Laporan kasus ${pendaftaran.nomor} disimpan (Zona 3)`,
  );

  let pesanDokumen = "";
  if (finalkan) {
    try {
      const arsip = await arsipkanDokumenLaporan(pendaftaranId);
      pesanDokumen = arsip.ok
        ? " Dokumen Word laporan otomatis diunggah ke Drive Anda."
        : ` ${arsip.pesan}`;
    } catch {
      pesanDokumen =
        " Dokumen Word dibuat, namun unggah ke Drive gagal — Anda tetap dapat mengunduhnya dari halaman ini.";
    }
  }

  revalidatePath(`/dashboard/kasus/${pendaftaranId}`);
  revalidatePath("/dashboard/kasus");
  revalidatePath(`/dashboard/pendaftaran/${pendaftaranId}`);
  revalidatePath("/dashboard/pendaftaran");
  revalidatePath("/dashboard/asesmen");
  revalidatePath("/dashboard");

  return {
    ok: true,
    pesan: finalkan
      ? `Laporan difinalkan. Kasus berstatus Selesai dan siap diarsipkan.${pesanDokumen}`
      : "Draft laporan tersimpan. Kasus masuk tahap Pelaporan Hasil.",
  };
}
