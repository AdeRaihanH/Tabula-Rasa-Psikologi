"use server";

import { redirect } from "next/navigation";

import { buatSesi, hapusSesi } from "@/lib/auth/session";
import { sesiRingkas } from "@/lib/auth/dal";
import { verifikasiPassword } from "@/lib/auth/password";
import { ambilIp } from "@/lib/keamanan/ip";
import {
  bersihkanGagalLogin,
  cekBatas,
  jebakanTerisi,
  periksaBatasLogin,
  terisiTerlaluCepat,
} from "@/lib/keamanan/rate-limit";
import { prisma } from "@/lib/prisma";
import { rumahDashboard } from "@/lib/rbac";

export type HasilMasuk = { ok: false; pesan: string } | undefined;

/**
 * Hash tiruan untuk menyamakan waktu respons saat email tidak ditemukan.
 * Tanpa ini, penyerang dapat menebak email mana yang terdaftar dari selisih
 * waktu balasan (user enumeration).
 */
const HASH_TIRUAN =
  "$2b$10$4DooyEY9VBDLJf9frLIYLe7A/wJMD2kh/n9Umv8KSzpHoTOtsJddu";

const PESAN_GAGAL = "Email atau kata sandi salah.";

export async function masuk(
  _sebelumnya: HasilMasuk,
  formData: FormData,
): Promise<HasilMasuk> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const ip = await ambilIp();

  if (!email || !password) {
    return { ok: false, pesan: "Email dan kata sandi wajib diisi." };
  }

  // 1) Batas percobaan diperiksa lebih dulu: kunci sementara per akun dan per
  //    alamat IP. Ini juga membatasi jumlah baris audit yang bisa ditulis bot.
  const batas = await periksaBatasLogin(email, ip);
  if (!batas.ok) {
    // Catat pemblokiran paling banyak sekali per 15 menit per IP agar tabel
    // audit tidak bisa dibanjiri.
    if (cekBatas(`log-dibatasi:${ip}`, 1, 900).ok) {
      await prisma.auditLog.create({
        data: {
          aksi: "LOGIN_DIBATASI",
          entitas: "User",
          entitasId: email,
          ip,
          detail: `Percobaan masuk diblokir oleh pembatas laju untuk ${email}`,
        },
      });
    }
    return { ok: false, pesan: batas.pesan };
  }

  // 2) Jebakan bot: formulir yang dikendalikan skrip dihitung sebagai gagal
  //    (sehingga ikut membatasi percobaan berikutnya).
  if (jebakanTerisi(formData) || terisiTerlaluCepat(formData)) {
    await prisma.auditLog.create({
      data: {
        aksi: "LOGIN_GAGAL",
        entitas: "User",
        entitasId: email,
        ip,
        detail: `Percobaan masuk ditolak jebakan bot untuk ${email}`,
      },
    });
    return { ok: false, pesan: PESAN_GAGAL };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { profilPsikolog: { select: { id: true } } },
  });

  // 3) Selalu jalankan perbandingan bcrypt, walau akun tidak ada, agar waktu
  //    respons seragam.
  const cocok = await verifikasiPassword(
    password,
    user?.passwordHash ?? HASH_TIRUAN,
  );

  if (!user || !user.aktif || !cocok) {
    await prisma.auditLog.create({
      data: {
        aksi: "LOGIN_GAGAL",
        entitas: "User",
        entitasId: email,
        ip,
        detail: `Percobaan masuk gagal untuk ${email}`,
      },
    });
    return { ok: false, pesan: PESAN_GAGAL };
  }

  // 4) Berhasil: buat sesi baru (ID sesi baru setiap login) dan bersihkan
  //    riwayat kegagalan akun ini.
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
      ip,
      detail: `${user.nama} masuk sebagai ${user.role}`,
    },
  });

  await bersihkanGagalLogin(email);

  redirect(rumahDashboard(user.role));
}

export async function keluar() {
  const [sesi, ip] = await Promise.all([sesiRingkas(), ambilIp()]);

  await hapusSesi();

  await prisma.auditLog.create({
    data: {
      userId: sesi?.userId ?? null,
      aksi: "LOGOUT",
      entitas: "Sesi",
      entitasId: sesi?.sid ?? null,
      ip,
      detail: "Pengguna keluar dan sesinya dicabut dari server",
    },
  });

  redirect("/masuk");
}
