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

export async function tambahLembarTes(formData: FormData) {
  const sesi = await wajibKemampuan("lembartes:kelola");
  const pendaftaranId = String(formData.get("pendaftaranId") ?? "");
  const alatTesId = String(formData.get("alatTesId") ?? "");
  const jadwalSesiId = String(formData.get("jadwalSesiId") ?? "") || null;
  const catatan = String(formData.get("catatan") ?? "").trim() || null;
  if (!pendaftaranId || !alatTesId) return;

  const lembar = await prisma.lembarTes.create({
    data: {
      pendaftaranId,
      alatTesId,
      jadwalSesiId,
      asistenId: sesi.userId,
      catatan,
      status: "MENUNGGU",
    },
    include: { alatTes: { select: { nama: true } } },
  });

  await catat(
    sesi.userId,
    "TAMBAH_LEMBAR_TES",
    "LembarTes",
    lembar.id,
    `Lembar tes ${lembar.alatTes.nama} ditambahkan (Zona 2)`,
  );

  revalidatePath("/dashboard/asesmen");
  revalidatePath(`/dashboard/asesmen/${pendaftaranId}`);
}

export async function ubahStatusLembarTes(formData: FormData) {
  const sesi = await wajibKemampuan("lembartes:kelola");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !status) return;

  const lembar = await prisma.lembarTes.update({
    where: { id },
    data: {
      status: status as "MENUNGGU" | "DIKERJAKAN" | "SKOR_DIISI" | "SELESAI",
      dikerjakanPada: status === "SELESAI" ? new Date() : undefined,
    },
  });

  await catat(sesi.userId, "UBAH_STATUS_LEMBAR_TES", "LembarTes", id, `Status → ${status}`);

  revalidatePath("/dashboard/asesmen");
  revalidatePath(`/dashboard/asesmen/${lembar.pendaftaranId}`);
}

export async function simpanSkor(formData: FormData) {
  const sesi = await wajibKemampuan("skor:kelola");
  const lembarTesId = String(formData.get("lembarTesId") ?? "");
  if (!lembarTesId) return;

  const aspek = formData.getAll("aspek").map((v) => String(v).trim());
  const skor = formData.getAll("skor").map((v) => String(v).trim());

  const baris = aspek
    .map((a, i) => ({ aspek: a, skor: skor[i] ?? "" }))
    .filter((b) => b.aspek.length > 0 && b.skor.length > 0);

  await prisma.$transaction([
    prisma.skorMentah.deleteMany({ where: { lembarTesId } }),
    prisma.skorMentah.createMany({
      data: baris.map((b) => ({
        lembarTesId,
        aspek: b.aspek,
        skor: Number(b.skor.replace(",", ".")),
      })),
    }),
    prisma.lembarTes.update({
      where: { id: lembarTesId },
      data: { status: "SKOR_DIISI" },
    }),
  ]);

  const lembar = await prisma.lembarTes.findUnique({
    where: { id: lembarTesId },
    select: { pendaftaranId: true },
  });

  await catat(
    sesi.userId,
    "SIMPAN_SKOR_MENTAH",
    "LembarTes",
    lembarTesId,
    `${baris.length} baris skor mentah disimpan (Zona 2)`,
  );

  revalidatePath(`/dashboard/asesmen/${lembar?.pendaftaranId ?? ""}`);
  revalidatePath("/dashboard/asesmen");
}
