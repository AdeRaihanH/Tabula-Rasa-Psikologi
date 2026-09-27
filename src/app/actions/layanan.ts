"use server";

import { revalidatePath } from "next/cache";

import { wajibKemampuan } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";

export type HasilLayanan = { ok: boolean; pesan: string } | undefined;

function angkaAtauNull(v: FormDataEntryValue | null) {
  const s = typeof v === "string" ? v.replace(/[^\d]/g, "") : "";
  if (s.length === 0) return null;
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Menyimpan harga layanan (tatap muka) beserta status aktifnya. */
export async function simpanLayanan(
  _sebelumnya: HasilLayanan,
  formData: FormData,
): Promise<HasilLayanan> {
  const sesi = await wajibKemampuan("layanan:kelola");
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, pesan: "Layanan tidak dikenali." };

  const layanan = await prisma.layanan.findUnique({ where: { id } });
  if (!layanan) return { ok: false, pesan: "Layanan tidak ditemukan." };

  const hargaOffline = angkaAtauNull(formData.get("hargaOffline"));
  const aktif = formData.get("aktif") === "on";

  await prisma.layanan.update({
    where: { id },
    data: { hargaOffline, aktif },
  });

  await prisma.auditLog.create({
    data: {
      userId: sesi.userId,
      aksi: "PERBARUI_LAYANAN",
      entitas: "Layanan",
      entitasId: id,
      detail: `Harga ${layanan.nama}: ${hargaOffline ?? "-"}, ${aktif ? "aktif" : "nonaktif"}`,
    },
  });

  revalidatePath("/dashboard/layanan");
  revalidatePath("/layanan", "page");
  revalidatePath("/biaya", "page");
  revalidatePath("/", "page");
  return { ok: true, pesan: `Harga ${layanan.nama} disimpan.` };
}
