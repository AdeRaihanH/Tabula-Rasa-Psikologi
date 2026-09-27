"use server";

import { revalidatePath } from "next/cache";

import { hashPassword } from "@/lib/auth/password";
import { buatSesi } from "@/lib/auth/session";
import {
  filterPendaftaranKlien,
  wajibKlien,
} from "@/lib/auth/dal";
import { folderPendaftaran } from "@/lib/drive-arsip";
import { driveAktif, unggahBerkas } from "@/lib/gdrive";
import { ambilIp } from "@/lib/keamanan/ip";
import {
  cekBatas,
  jebakanTerisi,
  pesanTerlaluSering,
  terisiTerlaluCepat,
} from "@/lib/keamanan/rate-limit";
import { prisma } from "@/lib/prisma";

export type HasilAkun = { ok: boolean; pesan: string; galat?: Record<string, string> };

function bersih(v: FormDataEntryValue | null) {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length > 0 ? s : null;
}

/**
 * Pendaftaran akun klien.
 *
 * Bila sudah ada data `Klien` dengan email yang sama (riwayat pendaftaran lama
 * yang dibuat sebelum akun ada), record tersebut ditautkan ke akun baru agar
 * riwayatnya langsung terbaca di portal.
 */
export async function daftarAkunKlien(
  _sebelumnya: HasilAkun | undefined,
  formData: FormData,
): Promise<HasilAkun> {
  // Anti-spam: jebakan bot, pengisian terlalu cepat, dan pembatas laju per IP.
  if (jebakanTerisi(formData) || terisiTerlaluCepat(formData)) {
    return { ok: false, pesan: "Pengiriman terdeteksi otomatis. Silakan coba lagi." };
  }
  const ip = await ambilIp();
  const batas = cekBatas(`daftar-akun:${ip}`, 5, 3600);
  if (!batas.ok) {
    return { ok: false, pesan: pesanTerlaluSering(batas.cobaDalamDetik) };
  }

  const nama = bersih(formData.get("nama"));
  const email = bersih(formData.get("email"))?.toLowerCase();
  const telepon = bersih(formData.get("telepon"));
  const password = String(formData.get("password") ?? "");
  const ulang = String(formData.get("ulang") ?? "");

  const galat: Record<string, string> = {};
  if (!nama) galat.nama = "Nama lengkap wajib diisi.";
  if (!email) galat.email = "Email wajib diisi.";
  else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    galat.email = "Format email tidak valid.";
  if (!telepon) galat.telepon = "Nomor telepon wajib diisi.";
  if (password.length < 8) galat.password = "Kata sandi minimal 8 karakter.";
  if (password !== ulang) galat.ulang = "Konfirmasi kata sandi tidak cocok.";

  if (Object.keys(galat).length > 0) {
    return { ok: false, pesan: "Mohon lengkapi data yang ditandai.", galat };
  }

  try {
    const sudahAda = await prisma.user.findUnique({ where: { email: email! } });
    if (sudahAda) {
      return {
        ok: false,
        pesan: "Email ini sudah terdaftar. Silakan masuk atau gunakan email lain.",
        galat: { email: "Email sudah terdaftar." },
      };
    }

    const user = await prisma.user.create({
      data: {
        nama: nama!,
        email: email!,
        telepon,
        role: "KLIEN",
        passwordHash: await hashPassword(password),
      },
    });

    // Tautkan riwayat lama yang emailnya sama (bila ada).
    const klienLama = await prisma.klien.findMany({
      where: { email: email!, userId: null },
      select: { id: true },
    });
    if (klienLama.length > 0) {
      await prisma.klien.updateMany({
        where: { id: { in: klienLama.map((k) => k.id) } },
        data: { userId: user.id },
      });
    } else {
      // Belum ada riwayat — siapkan data klien agar pendaftaran berikutnya ringkas.
      await prisma.klien.create({
        data: { userId: user.id, nama: nama!, email: email!, telepon: telepon! },
      });
    }

    await prisma.auditLog.create({
      data: {
        aksi: "DAFTAR_AKUN_KLIEN",
        entitas: "User",
        entitasId: user.id,
        detail: `Akun klien baru: ${nama} (${email})${
          klienLama.length > 0 ? `, ${klienLama.length} riwayat lama ditautkan` : ""
        }`,
      },
    });

    await buatSesi({
      userId: user.id,
      nama: user.nama,
      role: user.role,
      psikologProfilId: null,
    });

    revalidatePath("/dashboard/riwayat");
    return { ok: true, pesan: "Akun berhasil dibuat." };
  } catch (e) {
    console.error("[daftarAkunKlien] gagal:", e);
    return {
      ok: false,
      pesan: "Terjadi kesalahan saat membuat akun. Silakan coba lagi.",
    };
  }
}

export type HasilUnggahBukti = { ok: boolean; pesan: string } | undefined;

/**
 * Klien mengunggah bukti pembayaran untuk pendaftarannya sendiri.
 * Kepemilikan diverifikasi ulang lewat filter DAL sebelum berkas diproses.
 */
export async function unggahBuktiKlien(
  _sebelumnya: HasilUnggahBukti,
  formData: FormData,
): Promise<HasilUnggahBukti> {
  const sesi = await wajibKlien();
  const pembayaranId = String(formData.get("pembayaranId") ?? "");
  const berkas = formData.get("berkas");

  // Batasi jumlah unggahan per akun untuk mencegah penyalahgunaan penyimpanan.
  const batas = cekBatas(`unggah-bukti:${sesi.userId}`, 15, 3600);
  if (!batas.ok) {
    return { ok: false, pesan: pesanTerlaluSering(batas.cobaDalamDetik) };
  }

  if (!pembayaranId) return { ok: false, pesan: "Tagihan tidak dikenali." };
  if (!(berkas instanceof File) || berkas.size === 0) {
    return { ok: false, pesan: "Pilih berkas bukti pembayaran terlebih dahulu." };
  }
  if (berkas.size > 8 * 1024 * 1024) {
    return { ok: false, pesan: "Ukuran berkas maksimal 8 MB." };
  }

  // Validasi tipe berkas agar bisa dibuka admin saat verifikasi.
  const tipeDiizinkan = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/pdf",
  ];
  const ekstensiOk = /\.(jpe?g|png|webp|pdf)$/i.test(berkas.name);
  if (
    (berkas.type && !tipeDiizinkan.includes(berkas.type)) ||
    (!berkas.type && !ekstensiOk)
  ) {
    return {
      ok: false,
      pesan: "Format berkas harus JPG, PNG, WEBP, atau PDF.",
    };
  }

  const bayar = await prisma.pembayaran.findUnique({
    where: { id: pembayaranId },
    select: { id: true, pendaftaranId: true, status: true },
  });
  if (!bayar) return { ok: false, pesan: "Tagihan tidak ditemukan." };

  // Batas kepemilikan: klien hanya boleh menyentuh pendaftarannya sendiri.
  const where = await filterPendaftaranKlien(sesi);
  const milik = await prisma.pendaftaran.findFirst({
    where: { AND: [{ id: bayar.pendaftaranId }, where] },
    select: { id: true, nomor: true },
  });
  if (!milik) {
    await prisma.auditLog.create({
      data: {
        userId: sesi.userId,
        aksi: "AKSES_BUKTI_DITOLAK",
        entitas: "Pembayaran",
        entitasId: pembayaranId,
        detail: "Klien mencoba mengunggah bukti untuk pendaftaran yang bukan miliknya",
      },
    });
    return { ok: false, pesan: "Tagihan ini bukan milik akun Anda." };
  }

  if (bayar.status === "TERVERIFIKASI") {
    return {
      ok: false,
      pesan: "Pembayaran ini sudah diverifikasi. Tidak perlu mengunggah ulang.",
    };
  }

  try {
    let buktiUrl: string;
    let sumberBukti = "penyimpanan lokal";

    if (driveAktif()) {
      try {
        const folder = await folderPendaftaran(bayar.pendaftaranId);
        const namaAman = berkas.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 60);
        const hasil = await unggahBerkas({
          nama: `bukti-${milik.nomor}-${Date.now()}-${namaAman}`.slice(0, 120),
          mimeType: berkas.type || "application/octet-stream",
          data: Buffer.from(await berkas.arrayBuffer()),
          folderId: folder.id,
        });
        buktiUrl = hasil.tautan;
        sumberBukti = `Google Drive (${hasil.tautan})`;
      } catch (e) {
        // Drive dikonfigurasi tapi gagal (mis. folder belum diatur) —
        // simpan lokal agar bukti klien tidak hilang.
        console.error("[unggahBuktiKlien] Drive gagal, pakai lokal:", e);
        const buffer = Buffer.from(await berkas.arrayBuffer());
        buktiUrl = `data:${berkas.type || "application/octet-stream"};base64,${buffer.toString("base64")}`;
        sumberBukti = "penyimpanan lokal (Drive gagal)";
      }
    } else {
      const buffer = Buffer.from(await berkas.arrayBuffer());
      buktiUrl = `data:${berkas.type || "image/jpeg"};base64,${buffer.toString("base64")}`;
    }

    await prisma.pembayaran.update({
      where: { id: pembayaranId },
      data: { buktiUrl, status: "MENUNGGU", catatan: null },
    });


    await prisma.auditLog.create({
      data: {
        userId: sesi.userId,
        aksi: "KLIEN_UNGGAH_BUKTI",
        entitas: "Pembayaran",
        entitasId: pembayaranId,
        detail: `Klien mengunggah bukti untuk ${milik.nomor} via ${sumberBukti}`,
      },
    });

    revalidatePath("/dashboard/riwayat");
    revalidatePath(`/dashboard/riwayat/${bayar.pendaftaranId}`);
    revalidatePath("/dashboard/pendaftaran");
    revalidatePath(`/dashboard/pendaftaran/${bayar.pendaftaranId}`);
    revalidatePath("/dashboard");
    return {
      ok: true,
      pesan:
        "Bukti pembayaran berhasil dikirim dan menunggu verifikasi admin. Anda akan diberi tahu setelah diverifikasi.",
    };
  } catch (e) {
    console.error("[unggahBuktiKlien] gagal:", e);
    return {
      ok: false,
      pesan:
        e instanceof Error
          ? e.message
          : "Gagal mengunggah bukti. Silakan coba lagi.",
    };
  }
}
