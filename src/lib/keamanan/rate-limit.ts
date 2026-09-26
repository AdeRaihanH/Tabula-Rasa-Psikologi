import "server-only";

import {
  FIELD_JEBAKAN,
  FIELD_WAKTU,
  WAKTU_MINIMAL_ISI_MS,
} from "@/lib/keamanan/konstanta";
import { prisma } from "@/lib/prisma";

/**
 * Perlindungan penyalahgunaan: pembatas laju (rate limit) dan jebakan bot.
 *
 * Dua lapis dipakai:
 *  1. Limiter dalam memori — cepat, tanpa database, tetapi hanya berlaku per
 *     instance server (best effort pada lingkungan serverless).
 *  2. Limiter berbasis database — dipakai untuk login, agar hitungan tetap
 *     benar meski permintaan tersebar ke banyak instance.
 */

// ---------------------------------------------------------------- dalam memori

type Catatan = { jumlah: number; resetPada: number };

const peta = new Map<string, Catatan>();
const BATAS_ENTRI = 10_000;

export type HasilBatas = {
  ok: boolean;
  sisa: number;
  cobaDalamDetik: number;
};

function bersihkanKedaluwarsa(sekarang: number) {
  for (const [kunci, nilai] of peta) {
    if (nilai.resetPada <= sekarang) peta.delete(kunci);
  }
}

/**
 * Menambah satu hitungan untuk `kunci` lalu memeriksa apakah masih di bawah
 * `batas` dalam jendela `jendelaDetik`. Mengembalikan `ok: false` saat batas
 * terlampaui.
 */
export function cekBatas(
  kunci: string,
  batas: number,
  jendelaDetik: number,
): HasilBatas {
  const sekarang = Date.now();
  const jendelaMs = jendelaDetik * 1000;

  if (peta.size > BATAS_ENTRI) bersihkanKedaluwarsa(sekarang);

  const catatan = peta.get(kunci);
  if (!catatan || catatan.resetPada <= sekarang) {
    peta.set(kunci, { jumlah: 1, resetPada: sekarang + jendelaMs });
    return { ok: true, sisa: batas - 1, cobaDalamDetik: 0 };
  }

  if (catatan.jumlah >= batas) {
    return {
      ok: false,
      sisa: 0,
      cobaDalamDetik: Math.max(
        1,
        Math.ceil((catatan.resetPada - sekarang) / 1000),
      ),
    };
  }

  catatan.jumlah += 1;
  return { ok: true, sisa: batas - catatan.jumlah, cobaDalamDetik: 0 };
}

/** Menghapus hitungan (mis. setelah login berhasil). */
export function hapusBatas(kunci: string) {
  peta.delete(kunci);
}

/** Pesan siap pakai saat sebuah aksi dibatasi. */
export function pesanTerlaluSering(cobaDalamDetik: number) {
  const menit = Math.max(1, Math.ceil(cobaDalamDetik / 60));
  return `Terlalu banyak percobaan. Silakan coba lagi dalam ${menit} menit.`;
}

// ------------------------------------------------------------------- login DB

const MENIT_JENDELA_LOGIN = 15;
const BATAS_GAGAL_EMAIL = 5;
const BATAS_GAGAL_IP = 25;

export type HasilBatasLogin =
  | { ok: true }
  | { ok: false; pesan: string };

/**
 * Membatasi percobaan login yang gagal, baik per akun (email) maupun per alamat
 * IP, memakai catatan `audit_log`. Perhitungan di database membuat batas tetap
 * berlaku walau permintaan dilayani instance berbeda.
 */
export async function periksaBatasLogin(
  email: string,
  ip: string,
): Promise<HasilBatasLogin> {
  const sejak = new Date(Date.now() - MENIT_JENDELA_LOGIN * 60 * 1000);

  const [gagalEmail, gagalIp] = await Promise.all([
    prisma.auditLog.count({
      where: { aksi: "LOGIN_GAGAL", entitasId: email, createdAt: { gte: sejak } },
    }),
    ip === "lokal"
      ? Promise.resolve(0)
      : prisma.auditLog.count({
          where: { aksi: "LOGIN_GAGAL", ip, createdAt: { gte: sejak } },
        }),
  ]);

  if (gagalEmail >= BATAS_GAGAL_EMAIL) {
    return {
      ok: false,
      pesan: `Akun ini terkunci sementara karena terlalu banyak percobaan gagal. Coba lagi dalam ${MENIT_JENDELA_LOGIN} menit atau hubungi admin.`,
    };
  }
  if (gagalIp >= BATAS_GAGAL_IP) {
    return {
      ok: false,
      pesan: `Terlalu banyak percobaan masuk dari jaringan ini. Coba lagi dalam ${MENIT_JENDELA_LOGIN} menit.`,
    };
  }
  return { ok: true };
}

/** Menghapus riwayat gagal sebuah email setelah login berhasil. */
export async function bersihkanGagalLogin(email: string) {
  await prisma.auditLog.deleteMany({
    where: { aksi: "LOGIN_GAGAL", entitasId: email },
  });
}

// -------------------------------------------------------------------- jebakan

/**
 * True bila jebakan terisi — indikasi kuat pengirim adalah bot. Formulir
 * menyembunyikan field ini dari pengguna; hanya bot yang mengisinya.
 */
export function jebakanTerisi(formData: FormData) {
  return String(formData.get(FIELD_JEBAKAN) ?? "").trim().length > 0;
}

/**
 * True bila formulir dikirim terlalu cepat untuk mungkin diisi manusia.
 * Bersifat lunak: hanya menolak bila penanda waktu ikut terkirim.
 */
export function terisiTerlaluCepat(formData: FormData) {
  const mentah = String(formData.get(FIELD_WAKTU) ?? "");
  const waktu = Number(mentah);
  if (!mentah || !Number.isFinite(waktu) || waktu <= 0) return false;
  return Date.now() - waktu < WAKTU_MINIMAL_ISI_MS;
}
