"use server";

import { revalidatePath } from "next/cache";

import { hashPassword } from "@/lib/auth/password";
import { cabutSemuaSesi } from "@/lib/auth/session";
import { wajibKemampuan } from "@/lib/auth/dal";
import { ambilIp } from "@/lib/keamanan/ip";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/generated/prisma/enums";

async function catat(
  userId: string,
  aksi: string,
  entitas: string,
  entitasId: string,
  detail: string,
) {
  await prisma.auditLog.create({
    data: { userId, aksi, entitas, entitasId, detail, ip: await ambilIp() },
  });
}

export type HasilPengguna = { ok: boolean; pesan: string } | undefined;

export async function buatPengguna(
  _sebelumnya: HasilPengguna,
  formData: FormData,
): Promise<HasilPengguna> {
  const sesi = await wajibKemampuan("pengguna:kelola");

  const nama = String(formData.get("nama") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "ASISTEN") as Role;
  const password = String(formData.get("password") ?? "");
  const telepon = String(formData.get("telepon") ?? "").trim() || null;
  const spesialisasi = String(formData.get("spesialisasi") ?? "").trim();
  const gelar = String(formData.get("gelar") ?? "").trim() || null;
  const sipp = String(formData.get("sipp") ?? "").trim() || null;
  const str = String(formData.get("str") ?? "").trim() || null;

  if (!nama || !email || !password) {
    return { ok: false, pesan: "Nama, email, dan kata sandi wajib diisi." };
  }
  if (password.length < 8) {
    return { ok: false, pesan: "Kata sandi minimal 8 karakter." };
  }
  if (role === "PSIKOLOG" && !spesialisasi) {
    return { ok: false, pesan: "Spesialisasi wajib diisi untuk peran psikolog." };
  }

  const sudahAda = await prisma.user.findUnique({ where: { email } });
  if (sudahAda) return { ok: false, pesan: "Email sudah terdaftar." };

  const user = await prisma.user.create({
    data: {
      nama,
      email,
      telepon,
      role,
      passwordHash: await hashPassword(password),
      profilPsikolog:
        role === "PSIKOLOG"
          ? {
              create: {
                spesialisasi,
                gelar,
                sipp,
                str,
                publik: true,
              },
            }
          : undefined,
    },
  });

  await catat(
    sesi.userId,
    "BUAT_PENGGUNA",
    "User",
    user.id,
    `Pengguna baru ${nama} (${email}) dengan peran ${role}`,
  );

  revalidatePath("/dashboard/pengguna");
  return { ok: true, pesan: `Akun ${nama} berhasil dibuat.` };
}

export async function perbaruiPengguna(formData: FormData) {
  const sesi = await wajibKemampuan("pengguna:kelola");
  const id = String(formData.get("id") ?? "");
  const nama = String(formData.get("nama") ?? "").trim();
  const role = String(formData.get("role") ?? "") as Role;
  const telepon = String(formData.get("telepon") ?? "").trim() || null;
  const aktif = formData.get("aktif") === "on";
  if (!id || !nama) return;

  if (id === sesi.userId && !aktif) return;

  const sebelum = await prisma.user.findUnique({
    where: { id },
    select: { role: true },
  });
  if (!sebelum) return;

  const user = await prisma.user.update({
    where: { id },
    data: { nama, role, telepon, aktif },
  });

  // Akun yang dinonaktifkan ATAU perannya berubah langsung kehilangan semua
  // sesinya — JWT lama masih membawa peran sebelumnya, jadi harus dipaksa
  // masuk ulang agar hak aksesnya benar-benar mengikuti peran baru.
  const peranBerubah = sebelum.role !== role;
  if (!aktif || peranBerubah) await cabutSemuaSesi(id);

  await catat(
    sesi.userId,
    "PERBARUI_PENGGUNA",
    "User",
    id,
    `${user.nama} → peran ${role}, ${aktif ? "aktif" : "nonaktif"}${
      !aktif || peranBerubah ? " (sesi dicabut)" : ""
    }`,
  );

  revalidatePath("/dashboard/pengguna");
}

export async function resetPassword(formData: FormData) {
  const sesi = await wajibKemampuan("pengguna:kelola");
  const id = String(formData.get("id") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!id || password.length < 8) return;

  const user = await prisma.user.update({
    where: { id },
    data: { passwordHash: await hashPassword(password) },
  });

  // Kata sandi berubah → semua sesi lama pemilik akun tidak berlaku lagi.
  await cabutSemuaSesi(id);

  await catat(
    sesi.userId,
    "RESET_PASSWORD",
    "User",
    id,
    `Kata sandi ${user.nama} direset oleh admin; semua sesi dicabut`,
  );

  revalidatePath("/dashboard/pengguna");
}
