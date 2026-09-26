import type { Metadata } from "next";
import Link from "next/link";

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
      "Pendaftaran daring dan skrining kebutuhan",
      "Penjadwalan sesi bersama psikolog",
      "Pelaksanaan asesmen (tatap muka/daring)",
      "Pengolahan data dan penyusunan laporan",
      "Sesi umpan balik penyerahan hasil",
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
          <span className="label-kecil">Layanan</span>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl">
            Solusi psikologi untuk individu, sekolah, dan perusahaan
          </h1>
          <p className="mt-5 max-w-2xl text-ink-soft">
            Setiap layanan dirancang dan ditandatangani psikolog berizin praktik,
            serta dapat disesuaikan dengan konteks Anda.
          </p>

          <nav className="mt-8 flex flex-wrap gap-2">
            {kategoriUrut.map((k) => (
              <a
                key={k}
                href={`#${anchorKategori[k]}`}
                className="pil border-line bg-white text-ink-soft hover:border-brand-300 hover:text-brand-700"
              >
                {labelKategori[k]}
              </a>
            ))}
          </nav>
        </div>
      </section>

      <div className="wadah space-y-16 py-16">
        {kategoriUrut.map((kat, idx) => {
          const item = layanan.filter((l) => l.kategori === kat);
          const info = penjelasan[kat];

          return (
            <section key={kat} id={anchorKategori[kat]} className="scroll-mt-28">
              <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
                <div>
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
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:content-start">
                  {item.map((l) => {
                    const harga = hargaPerMetode(l);
                    return (
                    <Link
                      key={l.id}
                      href={`/layanan/${l.slug}`}
                      className="kartu group flex flex-col p-6 transition-all hover:-translate-y-1 hover:border-brand-300"
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
                          {l.metode.map((m) => (
                            <span
                              key={m}
                              className="rounded bg-paper-2 px-1.5 py-0.5 font-medium text-ink-soft"
                            >
                              {m === "ONLINE" ? "Daring" : "Tatap muka"}
                            </span>
                          ))}
                        </div>

                        <div className="mt-1 flex flex-col gap-3">
                          <div className="flex flex-col gap-1 text-[0.75rem] text-muted">
                            {l.metode.includes("ONLINE") && (
                              <div className="flex justify-between border-b border-line/50 pb-1">
                                <span>Daring</span>
                                <span className="font-semibold text-brand-700">
                                  {harga.online
                                    ? formatRupiah(harga.online)
                                    : "Hubungi kami"}
                                </span>
                              </div>
                            )}
                            {l.metode.includes("OFFLINE") && (
                              <div className="flex justify-between">
                                <span>Tatap muka</span>
                                <span className="font-semibold text-brand-700">
                                  {harga.offline
                                    ? formatRupiah(harga.offline)
                                    : "Hubungi kami"}
                                </span>
                              </div>
                            )}
                          </div>
                          <span className="w-full rounded-lg bg-brand-700 px-3 py-2 text-center font-semibold text-white transition hover:bg-brand-800">
                            Detail Layanan
                          </span>
                        </div>
                      </div>
                    </Link>
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
