import type { Metadata } from "next";
import Link from "next/link";

import { siteConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "Kontak",
  description:
    "Hubungi Tabula Rasa untuk pertanyaan layanan, kerja sama institusi, atau penjadwalan sesi.",
};

const kanal = [
  {
    label: "Telepon",
    nilai: siteConfig.telepon,
    href: `tel:+${siteConfig.telepon.replace(/\D/g, "")}`,
  },
  {
    label: "WhatsApp",
    nilai: siteConfig.telepon,
    href: `https://wa.me/${siteConfig.whatsapp}`,
  },
  {
    label: "Email",
    nilai: siteConfig.email,
    href: `mailto:${siteConfig.email}`,
  },
];

export default function HalamanKontak() {
  return (
    <>
      <section className="border-b border-line bg-paper-2">
        <div className="wadah py-14 lg:py-16">
          <span className="label-kecil">Kontak</span>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl">
            Mari bicarakan kebutuhan Anda
          </h1>
          <p className="mt-5 max-w-2xl text-ink-soft">
            Untuk pertanyaan umum, kerja sama institusi, maupun penjadwalan
            sesi, tim kami siap membantu pada jam operasional.
          </p>
        </div>
      </section>

      <section className="wadah grid gap-10 py-14 lg:grid-cols-2">
        <div>
          <h2 className="text-xl font-bold text-ink">Informasi kontak</h2>
          <dl className="mt-6 space-y-4">
            {kanal.map((k) => (
              <div key={k.label} className="kartu flex items-center justify-between gap-4 p-5">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">
                    {k.label}
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-ink">{k.nilai}</dd>
                </div>
                <a
                  href={k.href}
                  target={k.href.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="tombol tombol-garis"
                >
                  Buka
                </a>
              </div>
            ))}
          </dl>

          <div className="kartu mt-4 p-5">
            <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">
              Alamat & Jam Operasional
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              {siteConfig.alamat}
            </p>
            <p className="mt-1 text-sm text-ink-soft">{siteConfig.jamOperasional}</p>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-ink">Mulai dari sini</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Cara tercepat untuk memulai layanan adalah melalui formulir
            pendaftaran. Setelah dikirim, admin akan memverifikasi kebutuhan
            Anda dalam 1×24 jam kerja.
          </p>

          <div className="mt-6 space-y-3">
            <Link href="/daftar" className="kartu block p-6 transition-all hover:border-brand-300">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-ink">Formulir Pendaftaran</h3>
                  <p className="mt-1 text-sm text-ink-soft">
                    Untuk individu, sekolah, maupun korporasi.
                  </p>
                </div>
                <span className="text-brand-600">→</span>
              </div>
            </Link>

            <Link href="/alur" className="kartu block p-6 transition-all hover:border-brand-300">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-ink">Pelajari Alur Layanan</h3>
                  <p className="mt-1 text-sm text-ink-soft">
                    Delapan tahap dari pendaftaran hingga pengarsipan.
                  </p>
                </div>
                <span className="text-brand-600">→</span>
              </div>
            </Link>

            <Link href="/kerahasiaan" className="kartu block p-6 transition-all hover:border-brand-300">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-ink">Sistem Kerahasiaan</h3>
                  <p className="mt-1 text-sm text-ink-soft">
                    Bagaimana data Anda diklasifikasi dan dilindungi.
                  </p>
                </div>
                <span className="text-brand-600">→</span>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
