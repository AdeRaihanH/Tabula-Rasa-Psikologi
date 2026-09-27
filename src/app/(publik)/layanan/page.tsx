import type { Metadata } from "next";
import Link from "next/link";

import { Muncul } from "@/components/publik/gerak";
import { NavKategori } from "@/components/publik/NavKategori";
import { ambilLayanan } from "@/lib/data-publik";
import {
  anchorKategori,
  kategoriUrut,
  labelKategori,
  ringkasKategori,
  siteConfig,
} from "@/lib/config";
import { hargaPerMetode } from "@/lib/pembayaran";
import { formatRupiah } from "@/lib/utils";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Layanan",
  description:
    "Tes & Asesmen (Tes IQ, Tes Minat Bakat, Tes Kesiapan Sekolah) dan layanan Psikologi Industri & Organisasi untuk perusahaan.",
};

const penjelasan: Record<string, { untuk: string[]; proses: string[] }> = {
  TES_ASESMEN: {
    untuk: [
      "Orang tua yang mempersiapkan anak masuk sekolah dasar",
      "Siswa SMP/SMA yang menentukan jurusan atau studi lanjut",
      "Individu yang ingin mengenali minat dan bakat",
    ],
    proses: [
      "Pendaftaran & pembayaran melalui situs",
      "Verifikasi pembayaran oleh admin",
      "Pelaksanaan tes Tatap Muka di biro",
      "Pelaporan hasil oleh psikolog",
      "Selesai & umpan balik",
    ],
  },
  PERUSAHAAN: {
    untuk: [
      "Tim HRD yang membutuhkan asesmen rekrutmen dan promosi",
      "Perusahaan yang memetakan potensi dan talenta karyawan",
      "Institusi yang menyusun kamus kompetensi dan analisis jabatan",
    ],
    proses: [
      "Diskusi kebutuhan bersama tim HRD",
      "Penyusunan proposal dan kesepakatan (MOU)",
      "Penjadwalan dan pelaksanaan asesmen",
      "Pengolahan data dan penyusunan laporan",
      "Penyerahan hasil dan rekomendasi tindak lanjut",
    ],
  },
};

export default async function HalamanLayanan() {
  const layanan = await ambilLayanan();

  return (
    <>
      <section className="border-b border-line bg-paper-2">
        <div className="wadah py-14 lg:py-16">
          <Muncul className="max-w-3xl">
            <span className="label-kecil">Layanan</span>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl">
              Solusi psikologi untuk individu, sekolah, dan perusahaan
            </h1>
            <p className="mt-5 text-ink-soft">
              Setiap layanan dirancang dan ditandatangani psikolog berizin praktik,
              serta dapat disesuaikan dengan konteks Anda.
            </p>
          </Muncul>
        </div>
      </section>

      {/* Navigasi kategori — menempel di atas agar mudah berpindah bagian */}
      <div className="sticky top-0 z-40 border-b border-line bg-paper/95 py-3 backdrop-blur-md">
        <div className="wadah">
          <NavKategori
            item={kategoriUrut.map((k) => ({
              id: anchorKategori[k],
              label: labelKategori[k],
            }))}
          />
        </div>
      </div>

      <div className="wadah space-y-16 py-16">
        {kategoriUrut.map((kat, idx) => {
          const item = layanan.filter((l) => l.kategori === kat);
          const info = penjelasan[kat];

          return (
            <section key={kat} id={anchorKategori[kat]} className="scroll-mt-32">
              <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
                <Muncul arah="kiri">
                  <span className="label-kecil">
                    Layanan {idx + 1}
                  </span>
                  <h2 className="mt-3 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                    {labelKategori[kat]}
                  </h2>
                  <p className="mt-3 text-ink-soft">{ringkasKategori[kat]}</p>

                  {info && (
                    <>
                      <h3 className="mt-7 text-xs font-bold uppercase tracking-[0.1em] text-muted">
                        Cocok untuk
                      </h3>
                      <ul className="mt-3 space-y-2">
                        {info.untuk.map((u) => (
                          <li key={u} className="flex gap-2.5 text-sm text-ink-soft">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                            {u}
                          </li>
                        ))}
                      </ul>

                      <h3 className="mt-7 text-xs font-bold uppercase tracking-[0.1em] text-muted">
                        Tahapan
                      </h3>
                      <ol className="mt-3 space-y-2">
                        {info.proses.map((p, i) => (
                          <li key={p} className="flex gap-2.5 text-sm text-ink-soft">
                            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-50 text-[0.65rem] font-bold text-brand-700">
                              {i + 1}
                            </span>
                            {p}
                          </li>
                        ))}
                      </ol>
                    </>
                  )}
                </Muncul>

                <div className="grid gap-4 sm:grid-cols-2 lg:content-start">
                  {item.map((l, i) => {
                    const harga = hargaPerMetode(l);
                    return (
                    <Muncul key={l.id} tunda={i * 80} arah="kanan" className="flex">
                    <Link
                      href={`/layanan/${l.slug}`}
                      className="kartu kartu-hidup kilau group flex w-full flex-col p-6"
                    >
                      <h3 className="text-base font-bold text-ink">{l.nama}</h3>
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">
                        {l.ringkasan}
                      </p>

                      <div className="mt-5 flex flex-col gap-3 border-t border-line pt-4 text-xs">
                        <div className="flex flex-wrap items-center gap-2">
                          {l.durasiMenit && (
                            <span className="text-muted">{l.durasiMenit} menit</span>
                          )}
                          <span className="rounded bg-paper-2 px-1.5 py-0.5 font-medium text-ink-soft">
                            Tatap Muka
                          </span>
                        </div>

                        <div className="mt-1 flex flex-col gap-3">
                          <div className="flex flex-col gap-1 text-[0.75rem] text-muted">
                            <div className="flex justify-between">
                              <span>Biaya</span>
                              <span className="font-semibold text-brand-700">
                                {harga.offline
                                  ? formatRupiah(harga.offline)
                                  : "Hubungi kami"}
                              </span>
                            </div>
                          </div>
                          <span className="w-full rounded-lg bg-brand-700 px-3 py-2 text-center font-semibold text-white transition group-hover:bg-brand-800">
                            Detail Layanan
                          </span>
                        </div>
                      </div>
                    </Link>
                    </Muncul>
                    );
                  })}

                  {item.length === 0 && (
                    <div className="kartu p-6 text-sm text-muted">
                      Belum ada layanan pada kategori ini.
                    </div>
                  )}
                </div>
              </div>
            </section>
          );
        })}

        {layanan.length === 0 && (
          <div className="kartu p-10 text-center">
            <p className="text-ink-soft">
              Katalog layanan belum tersedia. Silakan hubungi kami di{" "}
              <span className="font-semibold text-brand-700">
                {siteConfig.telepon}
              </span>
              .
            </p>
          </div>
        )}
      </div>

      <section className="wadah pb-20">
        <div className="kartu flex flex-col items-center justify-between gap-5 bg-paper-2 p-8 sm:flex-row">
          <div>
            <h2 className="text-xl font-bold text-ink">
              Butuh layanan yang disesuaikan?
            </h2>
            <p className="mt-1.5 text-sm text-ink-soft">
              Kami dapat menyusun program khusus sesuai kebutuhan institusi Anda.
            </p>
          </div>
          <Link href="/kontak" className="tombol tombol-utama shrink-0">
            Konsultasi Kebutuhan
          </Link>
        </div>
      </section>
    </>
  );
}
