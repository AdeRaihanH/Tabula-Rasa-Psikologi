import type { Metadata } from "next";
import Link from "next/link";

import { ambilPsikologPublik } from "@/lib/data-publik";
import { inisial } from "@/lib/utils";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Tim Psikolog",
  description:
    "Psikolog berizin praktik (SIPP/STR) yang menangani asesmen, konseling, dan pengembangan organisasi.",
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
            Nomor SIPP dan STR setiap psikolog dicantumkan agar dapat Anda
            verifikasi. Setiap psikolog hanya mengakses data pasien yang
            ditugaskan kepadanya.
          </p>
        </div>
      </section>

      <section className="wadah py-14">
        {psikolog.length === 0 ? (
          <div className="kartu p-10 text-center text-ink-soft">
            Data tim belum tersedia.
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {psikolog.map((p) => (
              <article key={p.id} className="kartu flex flex-col p-6">
                <div className="flex items-center gap-4">
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand-100 text-base font-bold text-brand-700">
                    {inisial(p.user.nama)}
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold leading-snug text-ink">
                      {p.user.nama}
                    </h2>
                    <p className="mt-0.5 text-xs font-medium text-sand-500">
                      {p.spesialisasi}
                    </p>
                  </div>
                </div>

                {p.bio && (
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-ink-soft">
                    {p.bio}
                  </p>
                )}

                <dl className="mt-5 space-y-1.5 border-t border-line pt-4 text-xs">
                  {p.sipp && (
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted">SIPP</dt>
                      <dd className="text-right font-medium text-ink-soft">
                        {p.sipp}
                      </dd>
                    </div>
                  )}
                  {p.str && (
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted">STR</dt>
                      <dd className="text-right font-medium text-ink-soft">
                        {p.str}
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">Pengalaman</dt>
                    <dd className="font-medium text-ink-soft">
                      {p.pengalaman} tahun
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        )}

        <div className="kartu mt-10 flex flex-col items-center justify-between gap-5 bg-brand-600 p-8 text-white sm:flex-row">
          <div>
            <h2 className="text-lg font-bold">Ingin berkonsultasi dengan psikolog tertentu?</h2>
            <p className="mt-1.5 text-sm text-white/75">
              Sebutkan preferensi Anda saat mendaftar, kami akan menyesuaikan
              jadwal.
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
