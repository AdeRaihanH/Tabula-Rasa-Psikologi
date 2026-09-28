"use server";

import { revalidatePath } from "next/cache";

import { majuOtomatis } from "@/lib/alur-otomatis";
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

function revalidasiUmum(pendaftaranId: string) {
  revalidatePath("/dashboard/asesmen");
  revalidatePath(`/dashboard/asesmen/${pendaftaranId}`);
  revalidatePath(`/dashboard/pendaftaran/${pendaftaranId}`);
  revalidatePath("/dashboard/pendaftaran");
  revalidatePath("/dashboard/kasus");
  revalidatePath(`/dashboard/kasus/${pendaftaranId}`);
  revalidatePath("/dashboard/riwayat");
  revalidatePath(`/dashboard/riwayat/${pendaftaranId}`);
  revalidatePath("/dashboard");
}

/**
 * Konfirmasi pelaksanaan tes — satu-satunya tindakan asisten psikolog.
 *
 * Asisten cukup menekan "Konfirmasi" bila klien sudah melaksanakan tes secara
 * Tatap Muka di biro. Tidak ada pengisian skor maupun pencatatan tes apa pun.
 *
 * Setelah dikonfirmasi, kasus otomatis naik ke tahap Pelaporan Hasil sehingga
 * psikolog penanggung jawab dapat menyusun interpretasi.
 */
export async function konfirmasiPelaksanaanTes(formData: FormData) {
  const sesi = await wajibKemampuan("lembartes:kelola");
  const pendaftaranId = String(formData.get("pendaftaranId") ?? "");
  const konfirmasi = String(formData.get("konfirmasi") ?? "") === "1";
  if (!pendaftaranId) return;

  const p = await prisma.pendaftaran.findUnique({
    where: { id: pendaftaranId },
    select: { id: true, nomor: true },
  });
  if (!p) return;

  await prisma.pendaftaran.update({
    where: { id: pendaftaranId },
    data: konfirmasi
      ? { konfirmasiTesPada: new Date(), konfirmasiTesOlehId: sesi.userId }
      : { konfirmasiTesPada: null, konfirmasiTesOlehId: null },
  });

  await catat(
    sesi.userId,
    konfirmasi ? "KONFIRMASI_PELAKSANAAN_TES" : "BATAL_KONFIRMASI_TES",
    "Pendaftaran",
    pendaftaranId,
    konfirmasi
      ? `Klien ${p.nomor} dikonfirmasi sudah melaksanakan tes di biro`
      : `Konfirmasi pelaksanaan tes ${p.nomor} dibatalkan`,
  );

  // Kasus naik ke tahap Pelaporan Hasil — psikolog menerima notifikasi.
  if (konfirmasi) await majuOtomatis(pendaftaranId, "PENGOLAHAN_DATA");

  revalidasiUmum(pendaftaranId);
}
