import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const NAMA_COOKIE = "tr_session";

async function sesiValid(token: string | undefined) {
  if (!token) return false;
  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ["HS256"],
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Pemeriksaan optimistik: hanya membaca cookie, tanpa menyentuh database.
 * Otorisasi sesungguhnya tetap dilakukan di DAL dekat sumber data.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(NAMA_COOKIE)?.value;
  const masuk = await sesiValid(token);

  if (pathname.startsWith("/dashboard") && !masuk) {
    const url = new URL("/masuk", request.nextUrl);
    url.searchParams.set("dari", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
