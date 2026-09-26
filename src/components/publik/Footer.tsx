import Link from "next/link";

import { Logo } from "@/components/ui/Logo";
import { ambilIdentitas } from "@/lib/data-publik";

const kolom = [
  {
    judul: "Layanan",
    tautan: [
      { href: "/layanan#tes-asesmen", label: "Tes & Asesmen" },
      { href: "/layanan#perusahaan", label: "Untuk Perusahaan (B2B)" },
      { href: "/layanan/tes-iq", label: "Tes IQ" },
      { href: "/layanan/tes-minat-bakat", label: "Tes Minat Bakat" },
      { href: "/layanan/tes-kesiapan-sekolah", label: "Tes Kesiapan Sekolah" },
      { href: "/layanan/pio", label: "Psikologi Industri & Organisasi" },
    ],
  },
  {
    judul: "Biro",
    tautan: [
      { href: "/tim", label: "Tim Psikolog" },
      { href: "/biaya", label: "Biaya Layanan" },
      { href: "/alur", label: "Alur Layanan" },
      { href: "/kerahasiaan", label: "Sistem Kerahasiaan" },
      { href: "/faq", label: "FAQ" },
      { href: "/kontak", label: "Kontak" },
    ],
  },
  {
    judul: "Akses",
    tautan: [
      { href: "/daftar", label: "Pendaftaran Klien" },
      { href: "/cek-status", label: "Cek Status Pendaftaran" },
      { href: "/masuk", label: "Portal Internal" },
    ],
  },
];

export async function Footer() {
  const identitas = await ambilIdentitas();

  const wa = `https://wa.me/${identitas.whatsapp}?text=${encodeURIComponent(
    `Halo ${identitas.nama}, saya ingin bertanya tentang layanan psikologi.`,
  )}`;

  return (
    <footer className="mt-auto bg-brand-800 text-white/80">
      <div className="wadah grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Logo terang nama={identitas.nama} />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/65">
            {identitas.deskripsi}
          </p>

          <div className="mt-5 space-y-1.5 text-sm text-white/70">
            <p>{identitas.alamat}</p>
            <p>{identitas.jamOperasional}</p>
            <p className="font-semibold text-white">{identitas.telepon}</p>
            <p>{identitas.email}</p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="tombol tombol-sage !py-2 !text-xs"
            >
              Chat WhatsApp
            </a>
            <Link href="/daftar" className="tombol tombol-sand !py-2 !text-xs">
              Daftar Layanan
            </Link>
          </div>
        </div>

        {kolom.map((k) => (
          <div key={k.judul}>
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-sage-300">
              {k.judul}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {k.tautan.map((t) => (
                <li key={t.href}>
                  <Link
                    href={t.href}
                    className="text-sm text-white/70 transition-colors hover:text-white"
                  >
                    {t.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="wadah flex flex-col gap-2 py-5 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {identitas.nama}. Seluruh hak dilindungi.
          </p>
          <p>
            Data klien dilindungi dengan klasifikasi kerahasiaan berlapis
            (Zona 1–3).
          </p>
        </div>
      </div>
    </footer>
  );
}
