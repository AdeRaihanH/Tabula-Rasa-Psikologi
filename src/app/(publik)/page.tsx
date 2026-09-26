import Link from "next/link";

import { ambilIdentitas, ambilLayanan, ambilPsikologPublik } from "@/lib/data-publik";
import {
  anchorKategori,
  faqSingkat,
  kategoriUrut,
  keunggulan,
  labelKategori,
  ringkasKategori,
  testimoni,
} from "@/lib/config";
import { infoZona } from "@/lib/rbac";
import { inisial } from "@/lib/utils";

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

  const zona = [
    {
      kode: "Zona 1",
      pemegang: "Admin",
      isi: "Data diri klien, kontak, dan jadwal sesi.",
      warna: infoZona.ZONA_1.warna,
    },
    {
      kode: "Zona 2",
      pemegang: "Asisten Psikolog",
      isi: "Lembar tes, skor mentah, dan catatan pelaksanaan.",
      warna: infoZona.ZONA_2.warna,
    },
    {
      kode: "Zona 3",
      pemegang: "Psikolog",
      isi: "Laporan hasil, interpretasi, dan rekomendasi.",
      warna: infoZona.ZONA_3.warna,
    },
  ];

  return (
    <>
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden border-b border-line bg-paper-2">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full opacity-70"
          style={{
            background:
              "radial-gradient(circle, var(--color-sand-200) 0%, transparent 70%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full opacity-50"
          style={{
            background:
              "radial-gradient(circle, var(--color-sage-100) 0%, transparent 70%)",
          }}
        />

        <div className="wadah relative grid items-center gap-14 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div className="animasi-naik">
            <div className="flex flex-wrap items-center gap-2">
              <span className="pil bg-sand-100 text-sand-500">
                ★ 5,0 · 2.000+ klien terlayani
              </span>
              <span className="pil bg-sage-50 text-sage-600">
                Psikolog berizin praktik
              </span>
            </div>

            <h1 className="mt-5 text-4xl font-bold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-[3.5rem]">
              Kenali diri,
              <br />
              <span className="text-brand-600">tumbuh dengan terarah.</span>
            </h1>

            <p className="mt-6 max-w-xl text-[1.02rem] leading-relaxed text-ink-soft">
              {identitas.nama} menyediakan tes dan asesmen psikologi untuk
              individu, anak, dan sekolah, serta layanan Psikologi Industri &
              Organisasi untuk perusahaan — dengan kerahasiaan yang dijaga
              berlapis.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
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

            <dl className="mt-11 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
              {[
                { a: `${psikolog.length || "—"}`, l: "Psikolog" },
                { a: `${layanan.length}`, l: "Layanan" },
                { a: "3", l: "Zona kerahasiaan" },
                { a: "8", l: "Tahap layanan" },
              ].map((s) => (
                <div key={s.l}>
                  <dt className="text-2xl font-bold text-brand-700">{s.a}</dt>
                  <dd className="mt-0.5 text-xs font-medium text-muted">{s.l}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Panel visual */}
          <div className="animasi-naik" style={{ animationDelay: "120ms" }}>
            <div className="kartu overflow-hidden p-1.5">
              <div className="rounded-[0.8rem] bg-brand-800 p-6 text-white">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sand-300">
                    Matriks Hak Akses
                  </p>
                  <span className="pil bg-white/10 text-white/80">Terisolasi</span>
                </div>
                <div className="mt-5 space-y-2.5">
                  {zona.map((z) => (
                    <div
                      key={z.kode}
                      className="rounded-xl border border-white/10 bg-white/[0.06] p-4"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: z.warna }}
                        />
                        <span className="text-sm font-semibold">{z.kode}</span>
                        <span className="ml-auto text-[0.7rem] font-medium text-white/55">
                          {z.pemegang}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-white/60">
                        {z.isi}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 px-5 py-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <p className="text-xs leading-relaxed text-ink-soft">
                  Setiap psikolog hanya dapat mengakses data pasien yang
                  ditugaskan kepadanya.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ LAYANAN ============ */}
      <section className="wadah py-20">
        <div className="max-w-2xl">
          <span className="label-kecil">Layanan</span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Dua lini layanan, satu standar profesional
          </h2>
          <p className="mt-4 text-ink-soft">
            Untuk kebutuhan pribadi maupun perusahaan, semuanya ditangani
            psikolog berizin praktik.
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          {kategoriUrut.map((kat) => {
            const item = layanan.filter((l) => l.kategori === kat);
            const utama = kat === "TES_ASESMEN";
            return (
              <div
                key={kat}
                className={`kartu flex flex-col p-7 ${
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
            );
          })}
        </div>
      </section>

      {/* ============ KEUNGGULAN ============ */}
      <section className="border-y border-line bg-white py-20">
        <div className="wadah">
          <div className="max-w-2xl">
            <span className="label-kecil">Mengapa kami</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink">
              Yang membuat proses ini terasa aman
            </h2>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {keunggulan.map((k) => (
              <div key={k.judul} className="rounded-2xl border border-line bg-paper p-6">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
                  <IkonKeunggulan nama={k.ikon} />
                </span>
                <h3 className="mt-4 text-base font-bold text-ink">{k.judul}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{k.isi}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ TIM ============ */}
      {psikolog.length > 0 && (
        <section className="wadah py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
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
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {psikolog.slice(0, 3).map((p) => (
              <div key={p.id} className="kartu p-6">
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                    {inisial(p.user.nama)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-ink">
                      {p.user.nama}
                    </p>
                    <p className="text-xs text-muted">{p.spesialisasi}</p>
                  </div>
                </div>
                {p.bio && (
                  <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-ink-soft">
                    {p.bio}
                  </p>
                )}
                <p className="mt-4 text-xs text-muted">
                  {p.pengalaman} tahun pengalaman
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ============ ALUR SINGKAT ============ */}
      <section className="border-y border-line bg-brand-800 py-20 text-white">
        <div className="wadah">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <span className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-sand-300">
                Alur Pendaftaran
              </span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Empat langkah untuk memulai
              </h2>
            </div>
            <Link href="/alur" className="tombol bg-white/15 text-white hover:bg-white/25">
              Lihat alur lengkap
            </Link>
          </div>

          <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["01", "Daftar", "Isi formulir pendaftaran daring, dapatkan nomor pendaftaran."],
              ["02", "Skrining", "Admin memverifikasi kebutuhan Anda dalam 1×24 jam kerja."],
              ["03", "Jadwal & Asesmen", "Sesi dijadwalkan bersama psikolog yang sesuai."],
              ["04", "Hasil", "Laporan diserahkan melalui sesi umpan balik."],
            ].map(([nomor, judul, isi]) => (
              <li key={nomor} className="border-t border-white/15 pt-5">
                <span className="text-sm font-bold text-sand-300">{nomor}</span>
                <h3 className="mt-2 font-semibold">{judul}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/60">{isi}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ============ KERAHASIAAN ============ */}
      <section className="wadah py-20">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <span className="label-kecil">Kerahasiaan Data</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Data sensitif dijaga berlapis
            </h2>
            <p className="mt-4 text-ink-soft">
              Kami membagi data ke dalam tiga zona dengan hak akses terpisah.
              Tidak ada satu peran pun yang dapat melihat seluruh isi data
              seorang klien.
            </p>
            <Link href="/kerahasiaan" className="tombol tombol-garis mt-7">
              Pelajari sistem kerahasiaan
            </Link>
          </div>

          <div className="grid gap-4">
            {zona.map((z) => (
              <div key={z.kode} className="kartu flex gap-4 p-5">
                <span
                  className="mt-0.5 w-1 shrink-0 rounded-full"
                  style={{ background: z.warna, minHeight: "2.5rem" }}
                />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-ink">{z.kode}</h3>
                    <span className="pil bg-paper-2 text-ink-soft">{z.pemegang}</span>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                    {z.isi}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ TESTIMONI ============ */}
      <section className="border-y border-line bg-paper-2 py-20">
        <div className="wadah">
          <div className="max-w-2xl">
            <span className="label-kecil">Testimoni</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink">
              Kata mereka yang telah kami dampingi
            </h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {testimoni.map((t) => (
              <figure key={t.nama} className="kartu flex flex-col p-6">
                <span className="text-2xl leading-none text-sand-400">“</span>
                <blockquote className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">
                  {t.kutipan}
                </blockquote>
                <figcaption className="mt-5 border-t border-line pt-4">
                  <p className="text-sm font-bold text-ink">{t.nama}</p>
                  <p className="text-xs text-muted">{t.peran}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FAQ SINGKAT ============ */}
      <section className="wadah py-20">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
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
          </div>

          <div className="space-y-2">
            {faqSingkat.map((f) => (
              <details key={f.q} className="kartu group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-ink marker:content-none">
                  {f.q}
                  <span className="shrink-0 text-brand-600 transition-transform group-open:rotate-45">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA AKHIR ============ */}
      <section className="wadah pb-20">
        <div className="kartu relative overflow-hidden bg-brand-600 p-10 text-center text-white sm:p-14">
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
        </div>
      </section>
    </>
  );
}
