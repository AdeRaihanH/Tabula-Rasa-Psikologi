import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

import type { Role } from "@/lib/rbac";

const NAMA_COOKIE = "tr_session";
const DURASI_JAM = 8;

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
  expiresAt: string;
};

export async function enkripsiSesi(isi: Omit<IsiSesi, "expiresAt">) {
  const expiresAt = new Date(Date.now() + DURASI_JAM * 60 * 60 * 1000);
  const token = await new SignJWT({ ...isi, expiresAt: expiresAt.toISOString() })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${DURASI_JAM}h`)
    .sign(kunci());
  return { token, expiresAt };
}

export async function dekripsiSesi(token: string | undefined | null) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, kunci(), { algorithms: ["HS256"] });
    return payload as unknown as IsiSesi;
  } catch {
    return null;
  }
}

export async function buatSesi(isi: Omit<IsiSesi, "expiresAt">) {
  const { token, expiresAt } = await enkripsiSesi(isi);
  const cookieStore = await cookies();
  cookieStore.set(NAMA_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
  return token;
}

export async function hapusSesi() {
  const cookieStore = await cookies();
  cookieStore.delete(NAMA_COOKIE);
}

export async function ambilTokenSesi() {
  const cookieStore = await cookies();
  return cookieStore.get(NAMA_COOKIE)?.value;
}

export { NAMA_COOKIE };
