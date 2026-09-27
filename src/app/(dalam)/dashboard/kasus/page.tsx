import Link from "next/link";

import {
  BadgeStatus,
  BadgeZona,
  JudulHalaman,
  Kosong,
  Tabel,
  Td,
  Th,
} from "@/components/dashboard/ui";
import { wajibPeran } from "@/lib/auth/dal";
import { labelStatusPendaftaran } from "@/lib/config";
import { Paginasi } from "@/components/dashboard/Paginasi";
import { UKURAN_HALAMAN, hitungPaginasi } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import { formatTanggalWaktu } from "@/lib/utils";

export default async function HalamanKasus({
  searchParams,
}: PageProps<"/dashboard/kasus">) {
  const sesi = await wajibPeran("PSIKOLOG");
  const sp = await searchParams;
  const { hal, skip, take } = hitungPaginasi(sp?.hal);
  const where = { psikologId: sesi.userId };

  const [daftar, total, belumLaporan, draft, final, profil] = await Promise.all([
    prisma.pendaftaran.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take,
      include: {
        klien: { select: { nama: true } },
        layanan: { select: { nama: true } },
        laporan: { select: { status: true } },
        jadwal: { orderBy: { mulai: "desc" }, take: 1, select: { mulai: true } },
      },
    }),
    prisma.pendaftaran.count({ where }),
    prisma.pendaftaran.count({ where: { ...where, laporan: null } }),
    prisma.pendaftaran.count({
      where: { ...where, laporan: { status: "DRAFT" } },
    }),
    prisma.pendaftaran.count({
      where: { ...where, laporan: { status: "FINAL" } },
    }),
    prisma.profilPsikolog.findUnique({
      where: { userId: sesi.userId },
      select: { spreadsheetUrl: true, driveFolderUrl: true },
    }),
  ]);

  return (
    <>
      <JudulHalaman
        judul="Kasus Saya"
        keterangan="Zona 3 — hanya kasus yang ditugaskan kepada Anda. Kasus psikolog lain tidak dapat diakses."
        aksi={<BadgeZona zona="ZONA_3" />}
      />

      {/* Arsip digital milik psikolog */}
      <section className="kartu mb-6 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-ink-soft">
              Arsip Digital Saya
            </h2>
            <p className="mt-1 text-xs text-muted">
              Spreadsheet dan folder Drive ini hanya milik Anda — psikolog lain
              tidak dapat mengaksesnya.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {profil?.spreadsheetUrl ? (
              <a
                href={profil.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="tombol tombol-utama !py-2 !text-xs"
              >
                Buka spreadsheet arsip ↗
              </a>
            ) : (
              <span className="pil bg-paper-2 text-muted">
                Spreadsheet belum diatur
              </span>
            )}

            {profil?.driveFolderUrl && (
              <a
                href={profil.driveFolderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="tombol tombol-garis !py-2 !text-xs"
              >
                Buka folder Drive ↗
              </a>
            )}
          </div>
        </div>
      </section>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Belum ada laporan", nilai: belumLaporan },
          { label: "Draft laporan", nilai: draft },
          { label: "Laporan final", nilai: final },
        ].map((s) => (
          <div key={s.label} className="kartu p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
              {s.label}
            </p>
            <p className="mt-2 text-3xl font-bold text-ink">{s.nilai}</p>
          </div>
        ))}
      </div>

      {daftar.length === 0 ? (
        <Kosong
          judul="Belum ada kasus"
          keterangan="Admin akan menugaskan kasus kepada Anda setelah pendaftaran terverifikasi."
        />
      ) : (
        <Tabel>
          <thead>
            <tr>
              <Th>Nomor</Th>
              <Th>Klien</Th>
              <Th>Layanan</Th>
              <Th>Sesi Terakhir</Th>
              <Th>Pelaksanaan Tes</Th>
              <Th>Laporan</Th>
              <Th>Status Kasus</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {daftar.map((p) => (
              <tr key={p.id} className="hover:bg-paper-2/40">
                <Td>
                  <Link
                    href={`/dashboard/kasus/${p.id}`}
                    className="font-semibold text-brand-700 hover:underline"
                  >
                    {p.nomor}
                  </Link>
                </Td>
                <Td className="font-medium text-ink">{p.klien.nama}</Td>
                <Td className="max-w-[12rem] truncate text-xs">{p.layanan.nama}</Td>
                <Td className="whitespace-nowrap text-xs">
                  {p.jadwal[0] ? formatTanggalWaktu(p.jadwal[0].mulai) : "—"}
                </Td>
                <Td className="text-xs">
                  {p.konfirmasiTesPada ? (
                    <span className="font-semibold text-emerald-700">
                      ✓ Terkonfirmasi
                    </span>
                  ) : (
                    <span className="text-muted">Belum</span>
                  )}
                </Td>
                <Td>
                  {p.laporan ? (
                    <BadgeStatus status={p.laporan.status} label={p.laporan.status} />
                  ) : (
                    <span className="text-xs text-muted">Belum</span>
                  )}
                </Td>
                <Td>
                  <BadgeStatus
                    status={p.status}
                    label={labelStatusPendaftaran[p.status] ?? p.status}
                  />
                </Td>
                <Td>
                  <Link
                    href={`/dashboard/kasus/${p.id}`}
                    className="text-xs font-semibold text-brand-700 hover:underline"
                  >
                    Buka →
                  </Link>
                </Td>
              </tr>
            ))}
          </tbody>
        </Tabel>
      )}

      <Paginasi
        jalur="/dashboard/kasus"
        hal={hal}
        total={total}
        ukuran={UKURAN_HALAMAN}
      />
    </>
  );
}
