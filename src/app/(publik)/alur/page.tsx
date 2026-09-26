import type { Metadata } from "next";
import Link from "next/link";

import { alurLayanan } from "@/lib/config";

export const metadata: Metadata = {
  title: "Alur Layanan",
  description:
    "Delapan tahap layanan: pendaftaran, skrining, persetujuan, penjadwalan, pelaksanaan, pengolahan data, penyerahan hasil, evaluasi, dan pengarsipan.",
};

const catatan = [
  {
    judul: "Informed consent wajib",
    isi: "Klien menandatangani persetujuan sebelum asesmen dimulai, termasuk penjelasan tujuan, alat tes, dan penggunaan hasil.",
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
          <span className="label-kecil">Alur Pendaftaran & Layanan</span>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl">
            Proses yang terstruktur, dari pendaftaran hingga pengarsipan
          </h1>
          <p className="mt-5 max-w-2xl text-ink-soft">
            Setiap tahap memiliki penanggung jawab dan zona data yang jelas,
            sehingga informasi sensitif tidak berpindah tangan tanpa kendali.
          </p>
        </div>
      </section>

      <section className="wadah py-14">
        <ol className="relative space-y-8 border-l border-line pl-8">
          {alurLayanan.map((a) => (
            <li key={a.nomor} className="relative">
              <span className="absolute -left-[2.55rem] grid h-8 w-8 place-items-center rounded-full border border-line bg-white text-xs font-bold text-brand-700">
                {a.nomor}
              </span>
              <div className="kartu p-6">
                <h2 className="text-lg font-bold text-ink">{a.judul}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {a.isi}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-14 grid gap-4 sm:grid-cols-2">
          {catatan.map((c) => (
            <div key={c.judul} className="kartu bg-paper-2 p-6">
              <h2 className="font-bold text-ink">{c.judul}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{c.isi}</p>
            </div>
          ))}
        </div>

        <div className="kartu mt-10 flex flex-col items-center justify-between gap-5 p-8 sm:flex-row">
          <div>
            <h2 className="text-lg font-bold text-ink">
              Sudah siap memulai tahap pertama?
            </h2>
            <p className="mt-1.5 text-sm text-ink-soft">
              Pendaftaran daring hanya memerlukan beberapa menit.
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
        </div>
      </section>
    </>
  );
}
