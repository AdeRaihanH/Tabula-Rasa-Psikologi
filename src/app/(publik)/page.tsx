import Link from "next/link";

import { Akordeon } from "@/components/publik/Akordeon";
import { AngkaBergulir, Muncul } from "@/components/publik/gerak";
import { KaruselTestimoni } from "@/components/publik/KaruselTestimoni";
import { KartuPsikolog } from "@/components/publik/KartuPsikolog";
import { LatarHero } from "@/components/publik/LatarHero";
import { ambilIdentitas, ambilLayanan, ambilPsikologPublik } from "@/lib/data-publik";
import {
  alurLayanan,
  anchorKategori,
  faqSingkat,
  jumlahLangkahKata,
  kategoriUrut,
  keunggulan,
  labelKategori,
  ringkasKategori,
  testimoni,
} from "@/lib/config";

export const revalidate = 300;

function IkonKeunggulan({ nama }: { nama: string }) {
  const umum = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (nama) {
    case "lisensi":
      return (
        <svg {...umum}>
          <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    case "digital":
      return (
        <svg {...umum}>
          <path d="M4 7a2 2 0 012-2h5l2 2h5a2 2 0 012 2v7a2 2 0 01-2 2H6a2 2 0 01-2-2z" />
          <path d="M9 13l2 2 4-4" />
        </svg>
      );
    case "privasi":
      return (
        <svg {...umum}>
          <rect x="4" y="10" width="16" height="10" rx="2" />
          <path d="M8 10V7a4 4 0 018 0v3" />
        </svg>
      );
    default:
      return (
        <svg {...umum}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
  }
}

export default async function Beranda() {
  const [layanan, psikolog, identitas] = await Promise.all([
    ambilLayanan(),
    ambilPsikologPublik(),
    ambilIdentitas(),
  ]);

  const wa = `https://wa.me/${identitas.whatsapp}?text=${encodeURIComponent(
    `Halo ${identitas.nama}, saya ingin bertanya tentang layanan psikologi.`,
  )}`;





  return (
    <>
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden border-b border-line bg-paper-2">
        <LatarHero />

        <div className="wadah relative py-12 lg:py-16">
          <div className="animasi-naik mx-auto max-w-3xl text-center flex flex-col items-center">
            

            {/* Badge baris */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="pil bg-brand-100 text-brand-700">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                5,0 &middot; 2.000+ klien terlayani
              </span>
              <span className="pil bg-sage-50 text-sage-600">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/>
                  <path d="M9 12l2 2 4-4"/>
                </svg>
                Psikolog berizin praktik
              </span>
            </div>

            {/* Judul utama */}
            <h1 className="mt-6 text-4xl font-bold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-[3.6rem]">
              Kenali diri,
              <br />
              <span className="text-brand-600">tumbuh dengan terarah.</span>
            </h1>

            {/* Kalimat penjelas */}
            <p className="mx-auto mt-6 max-w-xl text-[1.02rem] leading-relaxed text-ink-soft">
              {identitas.nama} menyediakan tes dan asesmen psikologi untuk individu,
              anak, dan sekolah, serta layanan Psikologi Industri &amp; Organisasi
              untuk perusahaan — dengan kerahasiaan yang dijaga berlapis.
            </p>

            {/* Tombol aksi */}
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link href="/daftar" className="tombol tombol-utama">
                Daftar Sekarang
              </Link>
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="tombol tombol-sage"
              >
                Chat WhatsApp
              </a>
              <Link href="/layanan" className="tombol tombol-garis">
                Lihat Layanan
              </Link>
            </div>

            {/* Statistik */}
            <dl className="mx-auto mt-12 grid max-w-sm grid-cols-3 gap-x-8 gap-y-6 sm:max-w-md">
              <div className="text-center">
                <dt className="text-2xl font-bold text-brand-700">
                  {psikolog.length ? <AngkaBergulir nilai={psikolog.length} /> : "—"}
                </dt>
                <dd className="mt-0.5 text-xs font-medium text-muted">Psikolog</dd>
              </div>
              <div className="text-center">
                <dt className="text-2xl font-bold text-brand-700">
                  <AngkaBergulir nilai={layanan.length} />
                </dt>
                <dd className="mt-0.5 text-xs font-medium text-muted">Layanan</dd>
              </div>
              <div className="text-center">
                <dt className="text-2xl font-bold text-brand-700">
                  <AngkaBergulir nilai={2000} sufiks="+" />
                </dt>
                <dd className="mt-0.5 text-xs font-medium text-muted">
                  Klien Terlayani
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* ============ LAYANAN ============ */}
      <section className="wadah py-20">
        <Muncul className="max-w-3xl">
          <span className="label-kecil">Layanan</span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Dua lini layanan, satu standar profesional
          </h2>
          <p className="mt-4 text-ink-soft">
            Untuk kebutuhan pribadi maupun perusahaan, semuanya ditangani psikolog berizin praktik.
          </p>
        </Muncul>

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          {kategoriUrut.map((kat, i) => {
            const item = layanan.filter((l) => l.kategori === kat);
            const utama = kat === "TES_ASESMEN";
            return (
              <Muncul key={kat} tunda={i * 120} className="flex">
              <div
                className={`kartu kartu-hidup flex w-full flex-col p-7 ${
                  utama ? "" : "bg-sage-50/60"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span
                      className={`pil ${
                        utama ? "bg-brand-50 text-brand-700" : "bg-sage-100 text-sage-600"
                      }`}
                    >
                      {kat === "TES_ASESMEN" ? "Layanan 1" : "Layanan 2"}
                    </span>
                    <h3 className="mt-4 text-xl font-bold text-ink">
                      {labelKategori[kat]}
                    </h3>
                  </div>
                  <span className="text-3xl font-bold text-line">
                    {String(kategoriUrut.indexOf(kat) + 1).padStart(2, "0")}
                  </span>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                  {ringkasKategori[kat]}
                </p>

                <ul className="mt-5 flex-1 space-y-2.5">
                  {item.map((l) => (
                    <li key={l.id}>
                      <Link
                        href={`/layanan/${l.slug}`}
                        className="group flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 transition-colors hover:border-brand-300"
                      >
                        <span
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                            utama ? "bg-brand-400" : "bg-sage-400"
                          }`}
                        />
                        <span className="flex-1 text-sm font-medium text-ink">
                          {l.nama}
                        </span>
                        <span className="text-xs text-muted transition-transform group-hover:translate-x-0.5">
                          →
                        </span>
                      </Link>
                    </li>
                  ))}
                  {item.length === 0 && (
                    <li className="rounded-xl bg-paper-2 px-4 py-3 text-xs text-muted">
                      Belum ada layanan pada kategori ini.
                    </li>
                  )}
                </ul>

                <Link
                  href={`/layanan#${anchorKategori[kat]}`}
                  className="tombol tombol-garis mt-5"
                >
                  Selengkapnya
                </Link>
              </div>
              </Muncul>
            );
          })}
        </div>
      </section>

      {/* ============ KEUNGGULAN ============ */}
      <section className="border-y border-line bg-white py-20">
        <div className="wadah">
          <Muncul className="max-w-2xl">
            <span className="label-kecil">Mengapa kami</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink">
              Yang membuat proses ini terasa aman
            </h2>
          </Muncul>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {keunggulan.map((k, i) => (
              <Muncul
                key={k.judul}
                tunda={i * 90}
                className="kartu-hidup group rounded-2xl border border-line bg-paper p-6"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                  <IkonKeunggulan nama={k.ikon} />
                </span>
                <h3 className="mt-4 text-base font-bold text-ink">{k.judul}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{k.isi}</p>
              </Muncul>
            ))}
          </div>
        </div>
      </section>

      {/* ============ TIM ============ */}
      {psikolog.length > 0 && (
        <section className="wadah py-20">
          <Muncul className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-xl">
              <span className="label-kecil">Tim</span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink">
                Psikolog berizin praktik
              </h2>
              <p className="mt-3 text-ink-soft">
                Nomor SIPP dan STR dicantumkan agar dapat Anda verifikasi.
              </p>
            </div>
            <Link href="/tim" className="tombol tombol-garis">
              Semua psikolog
            </Link>
          </Muncul>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {psikolog.slice(0, 3).map((p, i) => (
              <Muncul key={p.id} tunda={i * 110} className="flex">
                <KartuPsikolog
                  ringkas
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
              </Muncul>
            ))}
          </div>
        </section>
      )}

      {/* ============ ALUR SINGKAT ============ */}
      <section className="border-y border-line bg-brand-800 py-20 text-white">
        <div className="wadah">
          <Muncul className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <span className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-sage-300">
                Alur Pendaftaran &amp; Layanan
              </span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                {jumlahLangkahKata} langkah untuk memulai
              </h2>
            </div>
            <Link href="/alur" className="tombol bg-white/15 text-white hover:bg-white/25">
              Lihat alur lengkap
            </Link>
          </Muncul>

          <ol
            className="mt-12 grid gap-8 sm:grid-cols-2"
            style={{
              gridTemplateColumns: `repeat(auto-fit, minmax(14rem, 1fr))`,
            }}
          >
            {alurLayanan.map((a, i) => (
              <Muncul
                key={a.nomor}
                sebagai="li"
                tunda={i * 90}
                className="group border-t border-white/15 pt-5"
              >
                <span className="text-sm font-bold text-sage-300">{a.nomor}</span>
                <h3 className="mt-2 font-semibold transition-colors group-hover:text-sage-300">
                  {a.judul}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/60">{a.isi}</p>
              </Muncul>
            ))}
          </ol>
        </div>
      </section>

      {/* ============ TESTIMONI ============ */}
      <section className="border-y border-line bg-paper-2 py-20">
        <div className="wadah">
          <Muncul className="max-w-2xl">
            <span className="label-kecil">Testimoni</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink">
              Kata mereka yang telah kami dampingi
            </h2>
          </Muncul>

          <Muncul className="mt-10" arah="zoom" ambang={0.05}>
            <KaruselTestimoni daftar={testimoni} />
          </Muncul>
        </div>
      </section>

      {/* ============ FAQ SINGKAT ============ */}
      <section className="wadah py-20">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <Muncul>
            <span className="label-kecil">FAQ</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink">
              Pertanyaan yang sering diajukan
            </h2>
            <p className="mt-4 text-ink-soft">
              Belum menemukan jawabannya? Tim kami siap membantu.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/faq" className="tombol tombol-garis">
                Semua FAQ
              </Link>
              <Link href="/kontak" className="tombol tombol-utama">
                Hubungi Kami
              </Link>
            </div>
          </Muncul>

          <Muncul arah="kanan" tunda={120}>
            <Akordeon daftar={faqSingkat} satuSaja />
          </Muncul>
        </div>
      </section>

      {/* ============ CTA AKHIR ============ */}
      <section className="wadah pb-20">
        <Muncul
          arah="zoom"
          className="kartu gradien-gerak relative overflow-hidden p-10 text-center text-white sm:p-14"
          style={{
            backgroundImage:
              "linear-gradient(120deg, var(--color-brand-700), var(--color-brand-500), var(--color-brand-800))",
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full opacity-25"
            style={{
              background:
                "radial-gradient(circle, var(--color-sand-300) 0%, transparent 70%)",
            }}
          />
          <h2 className="relative text-3xl font-bold tracking-tight sm:text-4xl">
            Siap memulai proses yang lebih terarah?
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-white/75">
            Isi formulir pendaftaran, tim kami akan memverifikasi kebutuhan Anda
            dalam 1×24 jam kerja.
          </p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/daftar" className="tombol tombol-sand">
              Daftar Sekarang
            </Link>
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="tombol bg-white/15 text-white hover:bg-white/25"
            >
              Chat WhatsApp
            </a>
            <Link
              href="/cek-status"
              className="tombol bg-white/15 text-white hover:bg-white/25"
            >
              Cek Status
            </Link>
          </div>
        </Muncul>
      </section>
    </>
  );
}
