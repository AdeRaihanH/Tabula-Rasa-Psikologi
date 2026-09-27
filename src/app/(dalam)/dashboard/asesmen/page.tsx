import Link from "next/link";

import type { Prisma } from "@/generated/prisma/client";
import { BadgeStatus, BadgeZona, JudulHalaman, Kosong, Tabel, Td, Th } from "@/components/dashboard/ui";
import { Paginasi } from "@/components/dashboard/Paginasi";
import { wajibKemampuan } from "@/lib/auth/dal";
import { labelStatusPendaftaran } from "@/lib/config";
import { parsePreferensiJadwal } from "@/lib/jadwal";
import { UKURAN_HALAMAN, hitungPaginasi } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import { formatTanggal, formatTanggalWaktu } from "@/lib/utils";

export default async function HalamanAsesmen({
  searchParams,
}: PageProps<"/dashboard/asesmen">) {
  await wajibKemampuan("lembartes:lihat");
  const sp = await searchParams;
  const { hal, skip, take } = hitungPaginasi(sp?.hal);

  const where: Prisma.PendaftaranWhereInput = {
    AND: [
      {
        status: {
          in: ["TERVERIFIKASI", "PELAKSANAAN", "PENGOLAHAN_DATA"],
        },
      },
      { pembayaran: { some: { status: "TERVERIFIKASI" } } },
    ],
  };

  const [daftar, total] = await Promise.all([
    prisma.pendaftaran.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take,
      include: {
        klien: { select: { nama: true } },
        layanan: { select: { nama: true } },
        konfirmasiTesOleh: { select: { nama: true } },
        jadwal: { orderBy: { mulai: "asc" }, take: 1, select: { mulai: true } },
      },
    }),
    prisma.pendaftaran.count({ where }),
  ]);

  return (
    <>
      <JudulHalaman
        judul="Konfirmasi Pelaksanaan Tes"
        keterangan="Zona 2 — operasional asesmen. Konfirmasi bahwa klien sudah melaksanakan tes secara Tatap Muka di biro."
        aksi={<BadgeZona zona="ZONA_2" />}
      />

      {daftar.length === 0 ? (
        <Kosong
          judul="Belum ada kasus untuk dikonfirmasi"
          keterangan="Kasus muncul di sini setelah pembayaran klien terverifikasi oleh admin."
        />
      ) : (
        <Tabel>
          <thead>
            <tr>
              <Th>Nomor</Th>
              <Th>Klien</Th>
              <Th>Layanan</Th>
              <Th>Jadwal Pilihan Klien</Th>
              <Th>Konfirmasi</Th>
              <Th>Status</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {daftar.map((p) => {
              const sudah = Boolean(p.konfirmasiTesPada);
              const preferensi =
                !p.jadwal[0] ? parsePreferensiJadwal(p.kebutuhan) : null;
              return (
                <tr key={p.id} className="hover:bg-paper-2/40">
                  <Td>
                    <Link
                      href={`/dashboard/asesmen/${p.id}`}
                      className="font-semibold text-brand-700 hover:underline"
                    >
                      {p.nomor}
                    </Link>
                  </Td>
                  <Td className="font-medium text-ink">{p.klien.nama}</Td>
                  <Td className="max-w-[12rem] truncate text-xs">{p.layanan.nama}</Td>
                  <Td className="whitespace-nowrap text-xs">
                    {p.jadwal[0] ? (
                      formatTanggalWaktu(p.jadwal[0].mulai)
                    ) : preferensi ? (
                      <span>
                        {formatTanggal(
                          new Date(`${preferensi.tanggal}T00:00:00+07:00`),
                        )}{" "}
                        · {preferensi.waktu}
                        <span className="block text-muted">
                          pilihan formulir
                        </span>
                      </span>
                    ) : (
                      "—"
                    )}
                  </Td>
                  <Td className="text-xs">
                    {sudah ? (
                      <span className="font-semibold text-emerald-700">
                        ✓ Sudah
                      </span>
                    ) : (
                      <span className="font-semibold text-amber-700">
                        Belum
                      </span>
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
                      href={`/dashboard/asesmen/${p.id}`}
                      className={
                        sudah
                          ? "text-xs font-semibold text-brand-700 hover:underline"
                          : "tombol tombol-utama !px-3 !py-1.5 !text-xs whitespace-nowrap"
                      }
                    >
                      {sudah ? "Lihat →" : "Konfirmasi →"}
                    </Link>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Tabel>
      )}

      <Paginasi
        jalur="/dashboard/asesmen"
        hal={hal}
        total={total}
        ukuran={UKURAN_HALAMAN}
      />
    </>
  );
}
