import Link from "next/link";
import { notFound } from "next/navigation";

import {
  BadgeStatus,
  JudulHalaman,
  Tabel,
  Td,
  Th,
} from "@/components/dashboard/ui";
import { wajibKemampuan } from "@/lib/auth/dal";
import { labelStatusPendaftaran } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import { formatRupiah, formatTanggal } from "@/lib/utils";

export default async function DetailKlien({
  params,
}: PageProps<"/dashboard/klien/[id]">) {
  await wajibKemampuan("klien:lihat");
  const { id } = await params;

  const klien = await prisma.klien.findUnique({
    where: { id },
    include: {
      pendaftaran: {
        orderBy: { createdAt: "desc" },
        include: {
          layanan: { select: { nama: true } },
          psikolog: { select: { nama: true } },
          pembayaran: { select: { jumlah: true, status: true } },
        },
      },
    },
  });

  if (!klien) notFound();

  const totalTerbayar = klien.pendaftaran
    .flatMap((p) => p.pembayaran)
    .filter((b) => b.status === "TERVERIFIKASI")
    .reduce((a, b) => a + Number(b.jumlah), 0);

  return (
    <>
      <div className="mb-5">
        <Link href="/dashboard/klien" className="text-xs font-medium text-muted hover:text-brand-700">
          ← Kembali ke data klien
        </Link>
      </div>

      <JudulHalaman
        judul={klien.nama}
        keterangan={`Zona 1 — terdaftar ${formatTanggal(klien.createdAt)} · ${klien.pendaftaran.length} pendaftaran`}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
        <section className="kartu p-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-ink-soft">
            Data Diri
          </h2>
          <dl className="mt-4 space-y-2.5 text-sm">
            {[
              ["Email", klien.email],
              ["Telepon", klien.telepon],
              [
                "Tanggal lahir",
                klien.tanggalLahir ? formatTanggal(klien.tanggalLahir) : null,
              ],
              [
                "Jenis kelamin",
                klien.jenisKelamin === "L"
                  ? "Laki-laki"
                  : klien.jenisKelamin === "P"
                    ? "Perempuan"
                    : null,
              ],
              ["Alamat", klien.alamat],
              ["Pekerjaan", klien.pekerjaan],
              ["Institusi", klien.institusi],
            ].map(([label, nilai]) => (
              <div key={label as string} className="flex justify-between gap-4 border-b border-line pb-2.5 last:border-0">
                <dt className="text-muted">{label}</dt>
                <dd className="text-right font-medium text-ink">{nilai || "—"}</dd>
              </div>
            ))}
          </dl>

          {klien.catatan && (
            <div className="mt-4 rounded-xl bg-paper-2 p-4">
              <p className="text-xs font-semibold text-muted">Catatan</p>
              <p className="mt-1 text-sm text-ink-soft">{klien.catatan}</p>
            </div>
          )}

          <div className="mt-5 rounded-xl bg-brand-50 p-4">
            <p className="text-xs font-semibold text-brand-800">Total terverifikasi</p>
            <p className="mt-1 text-xl font-bold text-brand-800">
              {formatRupiah(totalTerbayar)}
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.08em] text-ink-soft">
            Riwayat Pendaftaran
          </h2>
          {klien.pendaftaran.length === 0 ? (
            <div className="kartu p-8 text-center text-sm text-muted">
              Belum ada pendaftaran untuk klien ini.
            </div>
          ) : (
          <Tabel>
            <thead>
              <tr>
                <Th>Nomor</Th>
                <Th>Layanan</Th>
                <Th>Psikolog</Th>
                <Th>Status</Th>
                <Th>Tanggal</Th>
              </tr>
            </thead>
            <tbody>
              {klien.pendaftaran.map((p) => (
                <tr key={p.id} className="hover:bg-paper-2/40">
                  <Td>
                    <Link
                      href={`/dashboard/pendaftaran/${p.id}`}
                      className="font-semibold text-brand-700 hover:underline"
                    >
                      {p.nomor}
                    </Link>
                  </Td>
                  <Td className="max-w-[12rem] truncate text-xs">{p.layanan.nama}</Td>
                  <Td className="text-xs">{p.psikolog?.nama ?? "—"}</Td>
                  <Td>
                    <BadgeStatus
                      status={p.status}
                      label={labelStatusPendaftaran[p.status] ?? p.status}
                    />
                  </Td>
                  <Td className="whitespace-nowrap text-xs">
                    {formatTanggal(p.createdAt)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Tabel>
          )}

          <div className="kartu mt-4 border-dashed p-5">
            <p className="text-xs leading-relaxed text-ink-soft">
              Konfirmasi pelaksanaan tes (Zona 2) dan laporan hasil (Zona 3)
              tidak ditampilkan di sini. Bagian tersebut hanya dapat dibuka oleh
              asisten psikolog dan psikolog penanggung jawab kasus.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
