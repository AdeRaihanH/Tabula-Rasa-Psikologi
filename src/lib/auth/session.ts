import { cookies, headers } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

import { NAMA_COOKIE } from "@/lib/auth/cookie-name";
import { sidikPerangkat } from "@/lib/keamanan/ip";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/rbac";

const DURASI_JAM = 8;
const MS_PER_JAM = 60 * 60 * 1000;

export { NAMA_COOKIE };

function kunci() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET belum diisi. Tambahkan ke .env (mis. hasil `openssl rand -base64 32`).",
    );
  }
  return new TextEncoder().encode(secret);
}

export type IsiSesi = {
  userId: string;
  nama: string;
  role: Role;
  psikologProfilId?: string | null;
  /** ID sesi di tabel `sesi_login`. Memungkinkan pencabutan sesi dari server. */
  sid: string;
  expiresAt: string;
};

type IsiSesiBaru = Omit<IsiSesi, "expiresAt" | "sid">;

export async function enkripsiSesi(isi: IsiSesi) {
  const token = await new SignJWT({ ...isi })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${DURASI_JAM}h`)
    .sign(kunci());
  return token;
}

/**
 * Memverifikasi tanda tangan dan masa berlaku token. Tidak menyentuh database —
 * pemeriksaan sesi terhadap database dilakukan di lapisan DAL.
 */
export async function dekripsiSesi(token: string | undefined | null) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, kunci(), {
      algorithms: ["HS256"],
    });
    const isi = payload as unknown as IsiSesi;
    if (!isi.userId || !isi.sid) return null;
    return isi;
  } catch {
    return null;
  }
}

/**
 * Membuat sesi baru: mencatat baris di `sesi_login` (sumber kebenaran yang dapat
 * dicabut) lalu mengirim cookie httpOnly. ID sesi dibuat acak setiap login
 * sehingga sesi lama tidak dapat dipakai ulang (mencegah session fixation).
 */
export async function buatSesi(isi: IsiSesiBaru) {
  const sid = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + DURASI_JAM * MS_PER_JAM);

  const h = await headers();
  await prisma.sesiLogin.create({
    data: {
      userId: isi.userId,
      token: sid,
      userAgent: sidikPerangkat(h),
      ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      expiresAt,
    },
  });

  const token = await enkripsiSesi({
    ...isi,
    sid,
    expiresAt: expiresAt.toISOString(),
  });

  const cookieStore = await cookies();
  cookieStore.set(NAMA_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });

  // Bersihkan sesi kedaluwarsa sekali waktu agar tabel tidak menumpuk.
  if (Math.random() < 0.2) {
    void prisma.sesiLogin
      .deleteMany({ where: { expiresAt: { lt: new Date() } } })
      .catch(() => {});
  }

  return token;
}

/**
 * Menghapus sesi aktif: baris database dicabut lalu cookie dibersihkan dengan
 * atribut yang sama seperti saat dibuat (wajib agar `__Host-` benar-benar
 * terhapus oleh peramban).
 */
export async function hapusSesi() {
  const cookieStore = await cookies();
  const token = cookieStore.get(NAMA_COOKIE)?.value;
  const isi = await dekripsiSesi(token);

  if (isi?.sid) {
    await prisma.sesiLogin
      .deleteMany({ where: { token: isi.sid } })
      .catch(() => {});
  }

  cookieStore.set(NAMA_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/**
 * Mencabut seluruh sesi milik seorang pengguna. Dipakai setelah kata sandi
 * diubah/direset atau akun dinonaktifkan, agar sesi lama di perangkat lain tidak
 * lagi berlaku.
 */
export async function cabutSemuaSesi(userId: string) {
  await prisma.sesiLogin.deleteMany({ where: { userId } });
}

/** Mencabut satu sesi berdasarkan ID-nya. */
export async function cabutSesi(sid: string) {
  await prisma.sesiLogin.deleteMany({ where: { token: sid } });
}

/**
 * Mencabut semua sesi pengguna KECUALI sesi yang sedang dipakai. Dipakai saat
 * pengguna mengganti kata sandinya sendiri: perangkat lain dipaksa masuk ulang,
 * sementara perangkat yang dipakai sekarang tetap aktif.
 */
export async function cabutSesiLain(userId: string, kecualiSid: string) {
  await prisma.sesiLogin.deleteMany({
    where: { userId, token: { not: kecualiSid } },
  });
}

export async function ambilTokenSesi() {
  const cookieStore = await cookies();
  return cookieStore.get(NAMA_COOKIE)?.value;
}

/** True bila sesi masih tercatat di database dan belum kedaluwarsa. */
export async function sesiTercatat(sid: string, sidik: string) {
  const baris = await prisma.sesiLogin.findUnique({
    where: { token: sid },
    select: { id: true, expiresAt: true, userAgent: true },
  });
  if (!baris) return false;
  if (baris.expiresAt <= new Date()) return false;
  // Ikat ke perangkat: cookie yang dipakai di peramban lain ditolak.
  if (baris.userAgent && baris.userAgent !== sidik) return false;
  return true;
}
