import {
  JudulHalaman,
  Kosong,
  Tabel,
  Td,
  Th,
} from "@/components/dashboard/ui";
import { wajibKemampuan } from "@/lib/auth/dal";
import { labelKategori } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/utils";

export default async function HalamanLayanan() {
  await wajibKemampuan("layanan:kelola");

  const daftar = await prisma.layanan.findMany({
    orderBy: [{ urutan: "asc" }, { nama: "asc" }],
    include: { _count: { select: { pendaftaran: true } } },
  });

  return (
    <>
      <JudulHalaman
        judul="Katalog Layanan"
        keterangan="Daftar layanan yang tampil di situs publik beserta jumlah pendaftar."
      />

      {daftar.length === 0 ? (
        <Kosong judul="Katalog kosong" keterangan="Jalankan seed untuk mengisi katalog awal." />
      ) : (
        <Tabel>
          <thead>
            <tr>
              <Th>Urutan</Th>
              <Th>Layanan</Th>
              <Th>Kategori</Th>
              <Th>Metode</Th>
              <Th>Durasi</Th>
              <Th>Harga</Th>
              <Th>Pendaftar</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {daftar.map((l) => (
              <tr key={l.id} className="hover:bg-paper-2/40">
                <Td className="text-xs text-muted">{l.urutan}</Td>
                <Td>
                  <span className="font-medium text-ink">{l.nama}</span>
                  <span className="block text-xs text-muted">/{l.slug}</span>
                </Td>
                <Td className="text-xs">{labelKategori[l.kategori] ?? l.kategori}</Td>
                <Td className="text-xs">
                  {l.metode.map((m) => (m === "ONLINE" ? "Daring" : "Tatap muka")).join(", ")}
                </Td>
                <Td className="text-xs">{l.durasiMenit ? `${l.durasiMenit} menit` : "—"}</Td>
                <Td className="text-xs">
                  {l.harga ? formatRupiah(l.harga.toString()) : "Hubungi kami"}
                </Td>
                <Td className="text-xs">{l._count.pendaftaran}×</Td>
                <Td>
                  <span
                    className="pil"
                    style={
                      l.aktif
                        ? { background: "#f0fdf4", color: "#15803d" }
                        : { background: "#f8fafc", color: "#475569" }
                    }
                  >
                    {l.aktif ? "Aktif" : "Nonaktif"}
                  </span>
                </Td>
              </tr>
            ))}
          </tbody>
        </Tabel>
      )}
    </>
  );
}
