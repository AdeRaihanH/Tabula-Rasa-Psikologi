import type { Metadata } from "next";
import Link from "next/link";

import { ambilIdentitas } from "@/lib/data-publik";
import { jumlahLangkahKata } from "@/lib/config";

export const metadata: Metadata = {
  title: "Kontak",
  description:
    "Hubungi Tabula Rasa untuk pertanyaan layanan, kerja sama institusi, atau penjadwalan sesi.",
};

/** Prinsip kerahasiaan yang berlaku di seluruh layanan. */
const prinsip = [
  {
    judul: "Pemisahan tugas",
    isi: "Admin mengurus administrasi, asisten mengurus instrumen dan skor, psikolog menyusun interpretasi. Tidak ada peran yang memegang seluruh rantai data.",
  },
  {
    judul: "Isolasi antar-psikolog",
    isi: "Psikolog hanya dapat membuka kasus yang ditugaskan kepadanya. Daftar pasien satu psikolog tidak terlihat oleh psikolog lain.",
  },
  {
    judul: "Minimalisasi data",
    isi: "Setiap layar hanya menampilkan data yang benar-benar diperlukan untuk tugas peran tersebut.",
  },
  {
    judul: "Jejak audit",
    isi: "Setiap tindakan penting dicatat pada log audit: siapa, kapan, dan apa yang diubah.",
  },
];

export default async function HalamanKontak() {
  const identitas = await ambilIdentitas();

  const kanal = [
    {
      label: "Telepon",
      nilai: identitas.telepon,
      href: `tel:+${identitas.telepon.replace(/\D/g, "")}`,
    },
    {
      label: "WhatsApp",
      nilai: identitas.telepon,
      href: `https://wa.me/${identitas.whatsapp}`,
    },
    {
      label: "Email",
      nilai: identitas.email,
      href: `mailto:${identitas.email}`,
    },
  ];

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
              {identitas.alamat}
            </p>
            <p className="mt-1 text-sm text-ink-soft">{identitas.jamOperasional}</p>
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
                    {jumlahLangkahKata} langkah dari pendaftaran hingga hasil tes.
                  </p>
                </div>
                <span className="text-brand-600">→</span>
              </div>
            </Link>

            <Link href="/cek-status" className="kartu block p-6 transition-all hover:border-brand-300">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-ink">Cek Status Pendaftaran</h3>
                  <p className="mt-1 text-sm text-ink-soft">
                    Pantau posisi pendaftaran Anda dengan nomor dan email.
                  </p>
                </div>
                <span className="text-brand-600">→</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* PRINSIP KERAHASIAAN */}
      <section className="border-t border-line bg-paper-2 py-14">
        <div className="wadah">
          <span className="label-kecil">Kerahasiaan Data</span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-ink">
            Empat prinsip yang kami pegang
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft">
            Data psikologi bersifat sangat pribadi. Empat prinsip berikut kami
            terapkan pada setiap layanan, tanpa terkecuali.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {prinsip.map((p) => (
              <div key={p.judul} className="kartu p-6">
                <h3 className="font-bold text-ink">{p.judul}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{p.isi}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
