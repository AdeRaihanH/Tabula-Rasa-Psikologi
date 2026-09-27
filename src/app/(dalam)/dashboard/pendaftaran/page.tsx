import Link from "next/link";

import {
  BadgeStatus,
  JudulHalaman,
  Kosong,
  Tabel,
  Td,
  Th,
} from "@/components/dashboard/ui";
import { wajibKemampuan } from "@/lib/auth/dal";
import { labelStatusPendaftaran } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import { formatRupiah, formatTanggal } from "@/lib/utils";

const urutanStatus = [
  "BARU",
  "SKRINING",
  "MENUNGGU_PEMBAYARAN",
  "TERVERIFIKASI",
  "TERJADWAL",
  "PELAKSANAAN",
  "PENGOLAHAN_DATA",
  "SELESAI",
  "DIBATALKAN",
];

export default async function HalamanPendaftaran({
  searchParams,
}: PageProps<"/dashboard/pendaftaran">) {
  await wajibKemampuan("pendaftaran:lihat");
  const sp = await searchParams;
  const filter = typeof sp?.status === "string" ? sp.status : "";

  const [daftar, hitung, buktiMasuk] = await Promise.all([
    prisma.pendaftaran.findMany({
      where: filter ? { status: filter as never } : undefined,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        klien: { select: { nama: true, telepon: true, institusi: true } },
        layanan: { select: { nama: true } },
        psikolog: { select: { nama: true } },
        pembayaran: {
          select: { id: true, jumlah: true, status: true },
        },
      },
    }),
    prisma.pendaftaran.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.pembayaran.count({
      where: { status: "MENUNGGU", buktiUrl: { not: null } },
    }),
  ]);

  const petaHitung = new Map<string, number>(
    hitung.map((h) => [h.status as string, h._count._all]),
  );
  const total = hitung.reduce((a, b) => a + b._count._all, 0);

  // Ada/tidaknya bukti tanpa memuat isi berkas (hemat memori & HTML).
  const buktiAdaPembayaran = new Set(
    (
      await prisma.pembayaran.findMany({
        where: {
          pendaftaranId: { in: daftar.map((p) => p.id) },
          buktiUrl: { not: null },
        },
        select: { id: true },
      })
    ).map((b) => b.id),
  );

  return (
    <>
      <JudulHalaman
        judul="Pendaftaran"
        keterangan="Kelola pendaftaran masuk: skrining, verifikasi pembayaran, penugasan psikolog, dan penjadwalan."
      />

      {buktiMasuk > 0 && (
        <div className="mb-5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          Ada {buktiMasuk} bukti pembayaran baru dari klien yang menunggu
          verifikasi. Buka detail pendaftaran bertanda “Bukti masuk”.
        </div>
      )}

      <div className="mb-5 flex flex-wrap gap-2">
        <Link
          href="/dashboard/pendaftaran"
          className={`pil border-line ${filter === "" ? "bg-brand-600 text-white" : "bg-white text-ink-soft"}`}
        >
          Semua ({total})
        </Link>
        {urutanStatus.map((s) => (
          <Link
            key={s}
            href={`/dashboard/pendaftaran?status=${s}`}
            className={`pil border-line ${
              filter === s ? "bg-brand-600 text-white" : "bg-white text-ink-soft"
            }`}
          >
            {labelStatusPendaftaran[s]} ({petaHitung.get(s) ?? 0})
          </Link>
        ))}
      </div>

      {daftar.length === 0 ? (
        <Kosong
          judul="Tidak ada pendaftaran"
          keterangan={
            filter
              ? "Tidak ada pendaftaran dengan status ini."
              : "Pendaftaran dari situs publik akan muncul di sini."
          }
        />
      ) : (
        <Tabel>
          <thead>
            <tr>
              <Th>Nomor</Th>
              <Th>Klien</Th>
              <Th>Layanan</Th>
              <Th>Metode</Th>
              <Th>Pembayaran</Th>
              <Th>Psikolog</Th>
              <Th>Status</Th>
              <Th>Masuk</Th>
            </tr>
          </thead>
          <tbody>
            {daftar.map((p) => {
              const bayar = p.pembayaran[p.pembayaran.length - 1];
              const adaBukti = bayar ? buktiAdaPembayaran.has(bayar.id) : false;
              return (
                <tr key={p.id} className="hover:bg-paper-2/40">
                  <Td>
                    <Link
                      href={`/dashboard/pendaftaran/${p.id}`}
                      className="font-semibold text-brand-700 hover:underline"
                    >
                      {p.nomor}
                    </Link>
                  </Td>
                  <Td>
                    <span className="font-medium text-ink">{p.klien.nama}</span>
                    <span className="block text-xs text-muted">{p.klien.telepon}</span>
                  </Td>
                  <Td className="max-w-[13rem] truncate">{p.layanan.nama}</Td>
                  <Td className="text-xs">
                    {p.metode === "ONLINE" ? "Daring" : "Tatap muka"}
                  </Td>
                  <Td className="text-xs">
                    {bayar ? (
                      <span className="flex flex-col gap-1">
                        <span>{formatRupiah(bayar.jumlah.toString())}</span>
                        <span className="text-muted">{bayar.status}</span>
                        {bayar.status === "MENUNGGU" && adaBukti && (
                          <span className="inline-block w-fit rounded-full bg-amber-100 px-2 py-0.5 text-[0.65rem] font-bold text-amber-800">
                            Bukti masuk
                          </span>
                        )}
                        {bayar.status === "MENUNGGU" && !adaBukti && (
                          <span className="text-[0.65rem] text-muted">
                            Belum ada bukti
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </Td>
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
              );
            })}
          </tbody>
        </Tabel>
      )}
    </>
  );
}
