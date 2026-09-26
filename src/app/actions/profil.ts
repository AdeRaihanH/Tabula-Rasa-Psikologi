"use server";

import { revalidatePath } from "next/cache";

import { hashPassword, verifikasiPassword } from "@/lib/auth/password";
import { wajibMasuk } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";

export type HasilProfil = { ok: boolean; pesan: string } | undefined;

export async function simpanProfil(
  _sebelumnya: HasilProfil,
  formData: FormData,
): Promise<HasilProfil> {
  const sesi = await wajibMasuk();

  const nama = String(formData.get("nama") ?? "").trim();
  const telepon = String(formData.get("telepon") ?? "").trim() || null;
  if (!nama) return { ok: false, pesan: "Nama wajib diisi." };

  await prisma.user.update({
    where: { id: sesi.userId },
    data: { nama, telepon },
  });

  if (sesi.role === "PSIKOLOG") {
    const spesialisasi = String(formData.get("spesialisasi") ?? "").trim();
    if (!spesialisasi) {
      return { ok: false, pesan: "Spesialisasi wajib diisi untuk psikolog." };
    }
    const data = {
      spesialisasi,
      gelar: String(formData.get("gelar") ?? "").trim() || null,
      sipp: String(formData.get("sipp") ?? "").trim() || null,
      str: String(formData.get("str") ?? "").trim() || null,
      bio: String(formData.get("bio") ?? "").trim() || null,
      pengalaman: Number(formData.get("pengalaman") ?? 0) || 0,
      publik: formData.get("publik") === "on",
    };

    await prisma.profilPsikolog.upsert({
      where: { userId: sesi.userId },
      create: { userId: sesi.userId, ...data },
      update: data,
    });
  }

  await prisma.auditLog.create({
    data: {
      userId: sesi.userId,
      aksi: "PERBARUI_PROFIL",
      entitas: "User",
      entitasId: sesi.userId,
      detail: `${nama} memperbarui profil sendiri`,
    },
  });

  revalidatePath("/dashboard/profil");
  revalidatePath("/tim", "page");
  return { ok: true, pesan: "Profil berhasil diperbarui." };
}

export async function ubahPasswordSendiri(
  _sebelumnya: HasilProfil,
  formData: FormData,
): Promise<HasilProfil> {
  const sesi = await wajibMasuk();

  const lama = String(formData.get("lama") ?? "");
  const baru = String(formData.get("baru") ?? "");
  const ulang = String(formData.get("ulang") ?? "");

  if (baru.length < 8) return { ok: false, pesan: "Kata sandi baru minimal 8 karakter." };
  if (baru !== ulang) return { ok: false, pesan: "Konfirmasi kata sandi tidak cocok." };

  const user = await prisma.user.findUnique({ where: { id: sesi.userId } });
  if (!user) return { ok: false, pesan: "Akun tidak ditemukan." };

  const cocok = await verifikasiPassword(lama, user.passwordHash);
  if (!cocok) return { ok: false, pesan: "Kata sandi lama salah." };

  await prisma.user.update({
    where: { id: sesi.userId },
    data: { passwordHash: await hashPassword(baru) },
  });

  await prisma.auditLog.create({
    data: {
      userId: sesi.userId,
      aksi: "UBAH_PASSWORD_SENDIRI",
      entitas: "User",
      entitasId: sesi.userId,
      detail: `${user.nama} mengubah kata sandi sendiri`,
    },
  });

  return { ok: true, pesan: "Kata sandi berhasil diubah." };
}
