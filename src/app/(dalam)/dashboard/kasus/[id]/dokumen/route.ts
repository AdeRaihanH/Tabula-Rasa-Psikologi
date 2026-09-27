import { NextResponse } from "next/server";

import { sesiSaatIni } from "@/lib/auth/dal";
import { buildLaporanDocx, namaDokumenLaporan } from "@/lib/laporan-doc";
import { bangunDataDokumen } from "@/lib/laporan-arsip";
import { prisma } from "@/lib/prisma";

/**
 * Mengunduh dokumen Word laporan hasil (Zona 3).
 *
 * Hanya psikolog penanggung jawab kasus yang boleh mengunduh. Admin dan
 * asisten psikolog — juga psikolog lain — ditolak, sesuai prinsip isolasi
 * Zona 3.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sesi = await sesiSaatIni();
  if (!sesi?.userId) {
    return NextResponse.json({ pesan: "Belum masuk." }, { status: 401 });
  }
  if (sesi.role !== "PSIKOLOG") {
    return NextResponse.json(
      { pesan: "Hanya psikolog penanggung jawab yang dapat mengunduh laporan." },
      { status: 403 },
    );
  }

  const { id } = await params;

  const p = await prisma.pendaftaran.findUnique({
    where: { id },
    select: { psikologId: true, nomor: true },
  });
  if (!p) {
    return NextResponse.json({ pesan: "Kasus tidak ditemukan." }, { status: 404 });
  }
  if (p.psikologId !== sesi.userId) {
    await prisma.auditLog.create({
      data: {
        userId: sesi.userId,
        aksi: "AKSES_DOKUMEN_DITOLAK",
        entitas: "LaporanHasil",
        entitasId: id,
        detail: `Percobaan mengunduh dokumen laporan kasus ${p.nomor} yang bukan miliknya`,
      },
    });
    return NextResponse.json({ pesan: "Kasus ini bukan milik Anda." }, { status: 403 });
  }

  const bangun = await bangunDataDokumen(id);
  if (!bangun) {
    return NextResponse.json(
      { pesan: "Laporan belum disusun." },
      { status: 404 },
    );
  }

  const buffer = await buildLaporanDocx(bangun.data);
  const nama = namaDokumenLaporan(bangun.data.nomor, bangun.data.namaKlien);

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Length": String(buffer.length),
      "Content-Disposition": `attachment; filename="${encodeURIComponent(nama)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
