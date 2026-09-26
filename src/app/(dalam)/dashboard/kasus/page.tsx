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
import { prisma } from "@/lib/prisma";
import { formatTanggalWaktu } from "@/lib/utils";

export default async function HalamanKasus() {
  const sesi = await wajibPeran("PSIKOLOG");

  const daftar = await prisma.pendaftaran.findMany({
    where: { psikologId: sesi.userId },
    orderBy: { updatedAt: "desc" },
    include: {
      klien: { select: { nama: true } },
      layanan: { select: { nama: true } },
      laporan: { select: { status: true } },
      lembarTes: { select: { id: true, status: true } },
      jadwal: { orderBy: { mulai: "desc" }, take: 1, select: { mulai: true } },
    },
  });

  const belumLaporan = daftar.filter((p) => !p.laporan).length;
  const draft = daftar.filter((p) => p.laporan?.status === "DRAFT").length;
  const final = daftar.filter((p) => p.laporan?.status === "FINAL").length;

  return (
    <>
      <JudulHalaman
        judul="Kasus Saya"
        keterangan="Zona 3 — hanya kasus yang ditugaskan kepada Anda. Kasus psikolog lain tidak dapat diakses."
        aksi={<BadgeZona zona="ZONA_3" />}
      />

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
              <Th>Lembar Tes</Th>
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
                <Td className="text-xs">{p.lembarTes.length} lembar</Td>
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
    </>
  );
}
