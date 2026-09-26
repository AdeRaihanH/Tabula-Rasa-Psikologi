import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

import { NAMA_COOKIE } from "@/lib/auth/cookie-name";

const METODE_AMAN = new Set(["GET", "HEAD", "OPTIONS"]);

/** Path yang umumnya hanya dipakai pemindai kerentanan — langsung ditolak. */
const PATH_DICURIGAI = [
  "/.env",
  "/.git",
  "/.ssh",
  "/.aws",
  "/wp-admin",
  "/wp-login",
  "/wp-content",
  "/xmlrpc.php",
  "/phpmyadmin",
  "/phpinfo",
  "/vendor/phpunit",
  "/actuator",
  "/config.json",
  "/server-status",
];

// ------------------------------------------------- throttle kasar per instance
// Catatan: state ini hidup per instance server. Di lingkungan serverless
// (Vercel), batas ini bersifat best-effort sebagai lapisan pertama. Perlindungan
// DDoS sesungguhnya disediakan platform (Vercel) dan sebaiknya dilengkapi WAF.

type Catatan = { jumlah: number; resetPada: number };
const hitungan = new Map<string, Catatan>();
const JENDELA_MS = 60_000;
const BATAS_PER_MENIT = 300;
const BATAS_ENTRI = 20_000;

function ipPermintaan(request: NextRequest) {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) {
    const pertama = fwd.split(",")[0]?.trim();
    if (pertama) return pertama;
  }
  return (
    request.headers.get("x-real-ip")?.trim() ??
    request.headers.get("cf-connecting-ip")?.trim() ??
    "lokal"
  );
}

function throttle(ip: string) {
  const sekarang = Date.now();

  if (hitungan.size > BATAS_ENTRI) {
    for (const [kunci, nilai] of hitungan) {
      if (nilai.resetPada <= sekarang) hitungan.delete(kunci);
    }
  }

  const catatan = hitungan.get(ip);
  if (!catatan || catatan.resetPada <= sekarang) {
    hitungan.set(ip, { jumlah: 1, resetPada: sekarang + JENDELA_MS });
    return { ok: true as const, detik: 0 };
  }
  if (catatan.jumlah >= BATAS_PER_MENIT) {
    return {
      ok: false as const,
      detik: Math.max(1, Math.ceil((catatan.resetPada - sekarang) / 1000)),
    };
  }
  catatan.jumlah += 1;
  return { ok: true as const, detik: 0 };
}

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
 * Pemeriksaan optimistik di tepi: throttle kasar, pertahanan CSRF, penolakan
 * path pemindai, dan penjagaan rute /dashboard. Otorisasi sesungguhnya
 * (termasuk validasi sesi terhadap database) tetap dilakukan di DAL dekat
 * sumber data.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = ipPermintaan(request);

  // 1) Batas laju kasar per IP.
  const batas = throttle(ip);
  if (!batas.ok) {
    return new NextResponse("Terlalu banyak permintaan.", {
      status: 429,
      headers: { "Retry-After": String(batas.detik) },
    });
  }

  // 2) Tolak path yang hanya dipakai pemindai kerentanan.
  const jalurKecil = pathname.toLowerCase();
  if (PATH_DICURIGAI.some((p) => jalurKecil.startsWith(p))) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // 3) Pertahanan CSRF: untuk permintaan yang mengubah data, Origin (bila ada)
  //    harus sama dengan Host. Server Actions Next.js sudah memeriksa ini;
  //    lapisan tambahan ini menutup jalur lain.
  if (!METODE_AMAN.has(request.method)) {
    const origin = request.headers.get("origin");
    if (origin) {
      const host = request.headers.get("host");
      let sah = false;
      try {
        sah = new URL(origin).host === host;
      } catch {
        sah = false;
      }
      if (!sah) {
        return new NextResponse("Permintaan lintas situs ditolak.", {
          status: 403,
        });
      }
    }
  }

  // 4) Penjagaan optimistik rute /dashboard (hanya membaca cookie).
  if (pathname.startsWith("/dashboard")) {
    const masuk = await sesiValid(request.cookies.get(NAMA_COOKIE)?.value);
    if (!masuk) {
      const url = new URL("/masuk", request.nextUrl);
      url.searchParams.set("dari", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpe?g|svg|webp|ico|gif|css|js|map|txt|xml|woff2?)$).*)",
  ],
};
