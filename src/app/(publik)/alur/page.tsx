import type { Metadata } from "next";
import Link from "next/link";

import { Muncul } from "@/components/publik/gerak";
import { alurLayanan, jumlahLangkahKata } from "@/lib/config";

export const metadata: Metadata = {
  title: "Alur Layanan",
  description: `Alur layanan dalam ${jumlahLangkahKata} tahap utama: pendaftaran, verifikasi, pelaksanaan tes, pelaporan hasil, hingga umpan balik.`,
};

/**
 * Hal-hal yang berlaku di sepanjang proses — bukan bagian dari urutan tahap,
 * jadi ditampilkan terpisah di bawah daftar langkah.
 */
const catatan = [
  {
    judul: "Informed consent wajib",
    isi: "Klien menandatangani persetujuan sebelum asesmen dimulai, termasuk penjelasan tujuan asesmen dan penggunaan hasil.",
  },
  {
    judul: "MOU untuk korporasi",
    isi: "Kebutuhan institusi dituangkan dalam kesepakatan kerja sama yang mencakup lingkup, jadwal, dan kerahasiaan data.",
  },
  {
    judul: "Umpan balik, bukan sekadar angka",
    isi: "Hasil diserahkan dalam sesi umpan balik agar dapat dipahami dan ditindaklanjuti, bukan hanya berupa dokumen.",
  },
  {
    judul: "Masa retensi arsip",
    isi: "Data disimpan dengan klasifikasi kerahasiaan dan masa retensi yang disepakati, lalu dimusnahkan secara aman.",
  },
];

export default function HalamanAlur() {
  return (
    <>
      <section className="border-b border-line bg-paper-2">
        <div className="wadah py-14 lg:py-16">
          <Muncul className="max-w-3xl">
            <span className="label-kecil">Alur Pendaftaran & Layanan</span>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl">
              Proses layanan praktis dalam {jumlahLangkahKata} langkah
            </h1>
            <p className="mt-5 text-ink-soft">
              Proses yang cepat, ringkas, dan jelas dari awal hingga Anda menerima laporan.
            </p>
          </Muncul>
        </div>
      </section>

      <section className="wadah py-14">
        <ol className="relative space-y-8 border-l border-line pl-8">
          {alurLayanan.map((a, i) => (
            <Muncul
              key={a.nomor}
              sebagai="li"
              tunda={i * 90}
              className="group relative"
            >
              <span className="absolute -left-[2.55rem] grid h-8 w-8 place-items-center rounded-full border border-line bg-white text-xs font-bold text-brand-700 transition-colors group-hover:border-brand-500 group-hover:bg-brand-600 group-hover:text-white">
                {a.nomor}
              </span>
              <div className="kartu kartu-hidup p-6">
                <h2 className="text-lg font-bold text-ink">{a.judul}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {a.isi}
                </p>
              </div>
            </Muncul>
          ))}
        </ol>

        {/* Catatan penting — berlaku di sepanjang proses, bukan bagian urutan */}
        <div className="mt-16">
          <Muncul className="max-w-2xl">
            <span className="label-kecil">Catatan Penting</span>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-ink">
              Yang berlaku di sepanjang proses
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              Empat hal berikut tidak termasuk dalam urutan langkah di atas, namun
              berlaku pada setiap layanan yang Anda ambil.
            </p>
          </Muncul>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {catatan.map((c, i) => (
              <Muncul
                key={c.judul}
                tunda={i * 80}
                className="kartu kartu-hidup bg-paper-2 p-6"
              >
                <h3 className="font-bold text-ink">{c.judul}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{c.isi}</p>
              </Muncul>
            ))}
          </div>
        </div>

        <Muncul className="kartu mt-10 flex flex-col items-center justify-between gap-5 p-8 sm:flex-row">
          <div>
            <h2 className="text-lg font-bold text-ink">
              Sudah siap memulai tahap pertama?
            </h2>
            <p className="mt-1.5 text-sm text-ink-soft">
              Pendaftaran melalui situs hanya memerlukan beberapa menit.
            </p>
          </div>
          <div className="flex shrink-0 gap-3">
            <Link href="/daftar" className="tombol tombol-utama">
              Daftar
            </Link>
            <Link href="/kerahasiaan" className="tombol tombol-garis">
              Kerahasiaan
            </Link>
          </div>
        </Muncul>
      </section>
    </>
  );
}
