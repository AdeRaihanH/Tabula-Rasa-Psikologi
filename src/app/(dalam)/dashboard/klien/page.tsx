import {
  JudulHalaman,
  Kosong,
  Tabel,
  Td,
  Th,
} from "@/components/dashboard/ui";
import { Paginasi } from "@/components/dashboard/Paginasi";
import { wajibKemampuan } from "@/lib/auth/dal";
import { UKURAN_HALAMAN, hitungPaginasi } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import { formatTanggal } from "@/lib/utils";

export default async function HalamanKlien({
  searchParams,
}: PageProps<"/dashboard/klien">) {
  await wajibKemampuan("klien:lihat");
  const sp = await searchParams;
  const { hal, skip, take } = hitungPaginasi(sp?.hal);

  const [daftar, total] = await Promise.all([
    prisma.klien.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: { _count: { select: { pendaftaran: true } } },
    }),
    prisma.klien.count(),
  ]);

  return (
    <>
      <JudulHalaman
        judul="Data Klien"
        keterangan="Zona 1 — data diri dan kontak klien. Hanya admin yang dapat mengakses halaman ini."
      />

      {daftar.length === 0 ? (
        <Kosong
          judul="Belum ada klien"
          keterangan="Data klien terbentuk otomatis saat pendaftaran masuk."
        />
      ) : (
        <Tabel>
          <thead>
            <tr>
              <Th>Nama</Th>
              <Th>Kontak</Th>
              <Th>Domisili</Th>
              <Th>Institusi</Th>
              <Th>Pendaftaran</Th>
              <Th>Terdaftar</Th>
            </tr>
          </thead>
          <tbody>
            {daftar.map((k) => (
              <tr key={k.id} className="hover:bg-paper-2/40">
                <Td>
                  <span className="font-medium text-ink">{k.nama}</span>
                  {k.pekerjaan && (
                    <span className="block text-xs text-muted">{k.pekerjaan}</span>
                  )}
                </Td>
                <Td>
                  <span className="block text-xs">{k.email}</span>
                  <span className="block text-xs text-muted">{k.telepon}</span>
                </Td>
                <Td className="text-xs">{k.alamat ?? "—"}</Td>
                <Td className="text-xs">{k.institusi ?? "—"}</Td>
                <Td className="text-xs">{k._count.pendaftaran}×</Td>
                <Td className="whitespace-nowrap text-xs">
                  {formatTanggal(k.createdAt)}
                </Td>
              </tr>
            ))}
          </tbody>
        </Tabel>
      )}

      <Paginasi
        jalur="/dashboard/klien"
        hal={hal}
        total={total}
        ukuran={UKURAN_HALAMAN}
      />
    </>
  );
}
