"use server";

import { redirect } from "next/navigation";

import { buatSesi, hapusSesi } from "@/lib/auth/session";
import { verifikasiPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";
import { rumahDashboard } from "@/lib/rbac";

export type HasilMasuk = { ok: false; pesan: string } | undefined;

export async function masuk(
  _sebelumnya: HasilMasuk,
  formData: FormData,
): Promise<HasilMasuk> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { ok: false, pesan: "Email dan kata sandi wajib diisi." };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { profilPsikolog: { select: { id: true } } },
  });

  if (!user || !user.aktif) {
    return { ok: false, pesan: "Email atau kata sandi salah." };
  }

  const cocok = await verifikasiPassword(password, user.passwordHash);
  if (!cocok) {
    await prisma.auditLog.create({
      data: {
        aksi: "LOGIN_GAGAL",
        entitas: "User",
        entitasId: user.id,
        detail: `Percobaan masuk gagal untuk ${email}`,
      },
    });
    return { ok: false, pesan: "Email atau kata sandi salah." };
  }

  if (user.role === "KLIEN") {
    return { ok: false, pesan: "Akun klien belum tersedia. Hubungi admin." };
  }

  await buatSesi({
    userId: user.id,
    nama: user.nama,
    role: user.role,
    psikologProfilId: user.profilPsikolog?.id ?? null,
  });

  await prisma.auditLog.create({
    data: {
      aksi: "LOGIN_BERHASIL",
      entitas: "User",
      entitasId: user.id,
      detail: `${user.nama} masuk sebagai ${user.role}`,
    },
  });

  redirect(rumahDashboard(user.role));
}

export async function keluar() {
  await hapusSesi();
  redirect("/masuk");
}
