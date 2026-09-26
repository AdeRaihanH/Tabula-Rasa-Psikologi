import type { Metadata } from "next";
import Link from "next/link";

import { KartuPsikolog } from "@/components/publik/KartuPsikolog";
import { ambilPsikologPublik } from "@/lib/data-publik";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Tim Psikolog",
  description:
    "Psikolog berizin praktik yang menangani tes & asesmen serta layanan Psikologi Industri & Organisasi.",
};

export default async function HalamanTim() {
  const psikolog = await ambilPsikologPublik();

  return (
    <>
      <section className="border-b border-line bg-paper-2">
        <div className="wadah py-14 lg:py-16">
          <span className="label-kecil">Tim</span>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl">
            Ditangani psikolog berizin praktik
          </h1>
          <p className="mt-5 max-w-2xl text-ink-soft">
            Pilih psikolog yang paling sesuai dengan kebutuhan Anda. Setiap
            psikolog hanya mengakses data klien yang ditugaskan kepadanya —
            psikolog lain tidak dapat melihatnya.
          </p>
        </div>
      </section>

      <section className="wadah py-14">
        {psikolog.length === 0 ? (
          <div className="kartu p-10 text-center text-ink-soft">
            Data tim belum tersedia.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {psikolog.map((p) => (
              <KartuPsikolog
                key={p.id}
                p={{
                  userId: p.userId,
                  nama: p.user.nama,
                  spesialisasi: p.spesialisasi,
                  gelar: p.gelar,
                  fotoUrl: p.fotoUrl,
                  bio: p.bio,
                  pengalaman: p.pengalaman,
                  sipp: p.sipp,
                  str: p.str,
                }}
              />
            ))}
          </div>
        )}

        <div className="kartu mt-10 flex flex-col items-center justify-between gap-5 bg-brand-600 p-8 text-white sm:flex-row">
          <div>
            <h2 className="text-lg font-bold">
              Sudah tahu psikolog pilihan Anda?
            </h2>
            <p className="mt-1.5 text-sm text-white/75">
              Pilih psikolog saat mengisi formulir pendaftaran.
            </p>
          </div>
          <Link href="/daftar" className="tombol tombol-sand shrink-0">
            Daftar Sekarang
          </Link>
        </div>
      </section>
    </>
  );
}
