import { JudulHalaman, Kosong } from "@/components/dashboard/ui";
import {
  FormHargaLayanan,
  type DataLayanan,
} from "@/components/dashboard/FormHargaLayanan";
import { wajibKemampuan } from "@/lib/auth/dal";
import { labelKategori } from "@/lib/config";
import { keAngka } from "@/lib/pembayaran";
import { prisma } from "@/lib/prisma";

export default async function HalamanLayanan() {
  await wajibKemampuan("layanan:kelola");

  const daftar = await prisma.layanan.findMany({
    orderBy: [{ urutan: "asc" }, { nama: "asc" }],
    include: { _count: { select: { pendaftaran: true } } },
  });

  const data: DataLayanan[] = daftar.map((l) => ({
    id: l.id,
    nama: l.nama,
    slug: l.slug,
    kategori: labelKategori[l.kategori] ?? l.kategori,
    durasiMenit: l.durasiMenit,
    hargaOffline: keAngka(l.hargaOffline) ?? keAngka(l.harga),
    aktif: l.aktif,
    jumlahPendaftar: l._count.pendaftaran,
  }));

  const tanpaHarga = data.filter((d) => d.hargaOffline === null).length;

  return (
    <>
      <JudulHalaman
        judul="Katalog & Harga Layanan"
        keterangan="Harga yang diisi di sini otomatis menjadi tagihan saat klien mendaftar, dan tampil pada halaman layanan publik."
      />

      {tanpaHarga > 0 && (
        <div className="kartu mb-6 border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-semibold text-amber-800">
            {tanpaHarga} layanan belum memiliki harga
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-amber-800/80">
            Klien yang memilih layanan tanpa harga tidak akan menerima tagihan
            otomatis; admin perlu mencatat tagihan secara manual pada detail
            pendaftaran.
          </p>
        </div>
      )}

      {daftar.length === 0 ? (
        <Kosong
          judul="Katalog kosong"
          keterangan="Jalankan seed untuk mengisi katalog awal."
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {data.map((d) => (
            <FormHargaLayanan key={d.id} data={d} />
          ))}
        </div>
      )}
    </>
  );
}
