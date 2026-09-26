import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ambilLayanan, ambilLayananSlug } from "@/lib/data-publik";
import { anchorKategori, labelKategori, siteConfig } from "@/lib/config";
import { formatRupiah } from "@/lib/utils";

export const revalidate = 300;

export async function generateStaticParams() {
  const layanan = await ambilLayanan();
  return layanan.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/layanan/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const layanan = await ambilLayananSlug(slug);
  if (!layanan) return { title: "Layanan tidak ditemukan" };
  return { title: layanan.nama, description: layanan.ringkasan };
}

export default async function DetailLayanan({
  params,
}: PageProps<"/layanan/[slug]">) {
  const { slug } = await params;
  const layanan = await ambilLayananSlug(slug);
  if (!layanan) notFound();

  const lain = (await ambilLayanan())
    .filter((l) => l.kategori === layanan.kategori && l.id !== layanan.id)
    .slice(0, 3);

  const poin = [
    { label: "Durasi", nilai: layanan.durasiMenit ? `${layanan.durasiMenit} menit` : "Menyesuaikan" },
    {
      label: "Metode",
      nilai: layanan.metode
        .map((m) => (m === "ONLINE" ? "Daring" : "Tatap muka"))
        .join(" / "),
    },
    { label: "Investasi", nilai: layanan.harga ? formatRupiah(layanan.harga.toString()) : "Hubungi kami" },
  ];

  return (
    <>
      <section className="border-b border-line bg-paper-2">
        <div className="wadah py-12">
          <nav className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <Link href="/layanan" className="hover:text-brand-700">
              Layanan
            </Link>
            <span>/</span>
            <Link
              href={`/layanan#${anchorKategori[layanan.kategori]}`}
              className="hover:text-brand-700"
            >
              {labelKategori[layanan.kategori] ?? layanan.kategori}
            </Link>
          </nav>

          <h1 className="mt-5 max-w-3xl text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            {layanan.nama}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-soft">
            {layanan.ringkasan}
          </p>
        </div>
      </section>

      <div className="wadah grid gap-10 py-14 lg:grid-cols-[1.6fr_1fr]">
        <article>
          <h2 className="text-xl font-bold text-ink">Tentang layanan ini</h2>
          <p className="mt-4 whitespace-pre-line leading-relaxed text-ink-soft">
            {layanan.deskripsi ?? layanan.ringkasan}
          </p>

          <h2 className="mt-10 text-xl font-bold text-ink">
            Bagaimana alurnya?
          </h2>
          <ol className="mt-4 space-y-4">
            {[
              "Pendaftaran dan skrining kebutuhan oleh admin.",
              "Persetujuan, informed consent, dan pembayaran.",
              "Penjadwalan bersama psikolog yang sesuai.",
              "Pelaksanaan asesmen atau sesi.",
              "Pengolahan data dan penyusunan laporan.",
              "Penyerahan hasil beserta umpan balik.",
            ].map((t, i) => (
              <li key={t} className="flex gap-4">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                  {i + 1}
                </span>
                <p className="pt-0.5 text-sm leading-relaxed text-ink-soft">{t}</p>
              </li>
            ))}
          </ol>
        </article>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="kartu p-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-muted">
              Ringkasan
            </h2>
            <dl className="mt-4 space-y-3">
              {poin.map((p) => (
                <div
                  key={p.label}
                  className="flex items-center justify-between border-b border-line pb-3 last:border-0 last:pb-0"
                >
                  <dt className="text-sm text-muted">{p.label}</dt>
                  <dd className="text-sm font-semibold text-ink">{p.nilai}</dd>
                </div>
              ))}
            </dl>

            <Link
              href={`/daftar?layanan=${layanan.slug}`}
              className="tombol tombol-utama mt-6 w-full"
            >
              Daftar Layanan Ini
            </Link>
            <a
              href={`https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(
                `Halo ${siteConfig.nama}, saya ingin bertanya tentang layanan ${layanan.nama}.`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="tombol tombol-garis mt-3 w-full"
            >
              Tanya via WhatsApp
            </a>
          </div>

          {lain.length > 0 && (
            <div className="kartu mt-4 p-6">
              <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-muted">
                Layanan terkait
              </h2>
              <ul className="mt-4 space-y-3">
                {lain.map((l) => (
                  <li key={l.id}>
                    <Link
                      href={`/layanan/${l.slug}`}
                      className="block text-sm font-medium text-ink-soft transition-colors hover:text-brand-700"
                    >
                      {l.nama}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
