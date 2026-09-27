import { NextResponse } from "next/server";

import { filterPendaftaranKlien, sesiSaatIni } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { boleh } from "@/lib/rbac";

/**
 * Serve bukti pembayaran dengan aman.
 *
 * Kenapa lewat API (bukan href langsung ke `buktiUrl`)?
 * - `buktiUrl` mode lokal adalah `data:...;base64,...` yang bisa belasan MB.
 *   Menaruhnya langsung di `href`/`src` membuat HTML raksasa dan tab baru
 *   gagal dibuka (URL terlalu panjang / diblokir browser).
 * - Lewat API, halaman hanya membawa `pembayaranId` yang kecil, berkas
 *   dimuat on-demand dengan Content-Type yang benar + otorisasi.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sesi = await sesiSaatIni();
  if (!sesi?.userId) {
    return NextResponse.json({ pesan: "Belum masuk." }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { pesan: "Bukti tidak dikenali." },
      { status: 400 },
    );
  }

  const bayar = await prisma.pembayaran.findUnique({
    where: { id },
    select: {
      id: true,
      buktiUrl: true,
      pendaftaranId: true,
    },
  });
  if (!bayar?.buktiUrl) {
    return NextResponse.json(
      { pesan: "Bukti belum diunggah." },
      { status: 404 },
    );
  }

  // Otorisasi: staf dengan akses pendaftaran, atau klien pemilik.
  if (boleh(sesi.role, "pendaftaran:lihat")) {
    // ADMIN / ASISTEN / PSIKOLOG boleh melihat (sama seperti halaman detail).
  } else if (sesi.role === "KLIEN") {
    const where = await filterPendaftaranKlien(sesi);
    const milik = await prisma.pendaftaran.findFirst({
      where: { AND: [{ id: bayar.pendaftaranId }, where] },
      select: { id: true },
    });
    if (!milik) {
      return NextResponse.json({ pesan: "Bukan milik Anda." }, { status: 403 });
    }
  } else {
    return NextResponse.json({ pesan: "Tidak berhak." }, { status: 403 });
  }

  const url = bayar.buktiUrl;

  // Tautan Drive / http(s) biasa — teruskan saja.
  if (/^https?:\/\//i.test(url)) {
    return NextResponse.redirect(url, 302);
  }

  // Mode lokal: data:[mime];base64,....
  if (url.startsWith("data:")) {
    const koma = url.indexOf(",");
    if (koma === -1) {
      return NextResponse.json(
        { pesan: "Format bukti rusak." },
        { status: 500 },
      );
    }
    const kepala = url.slice(5, koma); // mis. image/jpeg;base64
    const [mimeRaw] = kepala.split(";");
    const mime = mimeRaw || "application/octet-stream";
    const isBase64 = /;base64$/i.test(kepala);
    try {
      const bin = isBase64
        ? Buffer.from(url.slice(koma + 1), "base64")
        : Buffer.from(decodeURIComponent(url.slice(koma + 1)), "utf8");
      const ekstensi =
        mime === "application/pdf"
          ? "pdf"
          : mime === "image/png"
            ? "png"
            : mime === "image/webp"
              ? "webp"
              : "jpg";
      // NextResponse dengan Buffer: bungkus sebagai Uint8Array agar tipe cocok.
      return new NextResponse(new Uint8Array(bin), {
        status: 200,
        headers: {
          "Content-Type": mime,
          "Content-Length": String(bin.length),
          "Content-Disposition": `inline; filename="bukti-${bayar.id}.${ekstensi}"`,
          "Cache-Control": "private, max-age=300",
        },
      });
    } catch {
      return NextResponse.json(
        { pesan: "Bukti tidak dapat dibaca." },
        { status: 500 },
      );
    }
  }

  return NextResponse.json(
    { pesan: "Format bukti tidak dikenali." },
    { status: 500 },
  );
}
