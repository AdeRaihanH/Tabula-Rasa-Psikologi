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

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Biaya Layanan",
  description:
    "Transparansi biaya layanan biro psikologi: asesmen individu, konseling, dan program korporasi.",
};

const catatan = [
  "Biaya asesmen institusi dihitung per program dan tercantum dalam proposal serta MOU.",
  "Tarif dapat berbeda untuk pelaksanaan di luar kota (termasuk biaya perjalanan tim).",
  "Sesi yang disepakati sebagai paket akan mendapat penyesuaian tarif.",
  "Rincian final selalu disampaikan sebelum pelaksanaan — tidak ada biaya tersembunyi.",
];

export default async function HalamanBiaya() {
  const layanan = await ambilLayanan();

  return (
    <>
      <section className="border-b border-line bg-paper-2">
        <div className="wadah py-14">
          <span className="label-kecil">Biaya</span>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl">
            Tarif yang transparan
          </h1>
          <p className="mt-5 max-w-2xl text-ink-soft">
            Biaya bergantung pada jenis layanan, durasi, dan metode pelaksanaan.
            Untuk program korporasi, rincian disusun dalam proposal.
          </p>
        </div>
      </section>

      <div className="wadah space-y-12 py-14">
        {kategoriUrut.map((kat) => {
          const item = layanan.filter((l) => l.kategori === kat);
          if (item.length === 0) return null;
          return (
            <section key={kat} id={anchorKategori[kat]} className="scroll-mt-24">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-ink sm:text-2xl">
                    {labelKategori[kat]}
                  </h2>
                  <p className="mt-1.5 max-w-2xl text-sm text-ink-soft">
                    {ringkasKategori[kat]}
                  </p>
                </div>
                <Link
                  href={`/layanan#${anchorKategori[kat]}`}
                  className="text-xs font-semibold text-brand-700 hover:underline"
                >
                  Lihat layanan →
                </Link>
              </div>

              <div className="kartu mt-5 overflow-x-auto">
                <table className="w-full min-w-[36rem] border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className="border-b border-line bg-paper-2/60 px-4 py-3 text-left text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-muted">
                        Layanan
                      </th>
                      <th className="border-b border-line bg-paper-2/60 px-4 py-3 text-left text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-muted">
                        Durasi
                      </th>
                      <th className="border-b border-line bg-paper-2/60 px-4 py-3 text-left text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-muted">
                        Metode
                      </th>
                      <th className="border-b border-line bg-paper-2/60 px-4 py-3 text-right text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-muted">
                        Tarif
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.map((l) => (
                      <tr key={l.id} className="hover:bg-paper-2/40">
                        <td className="border-b border-line px-4 py-3">
                          <Link
                            href={`/layanan/${l.slug}`}
                            className="font-medium text-ink hover:text-brand-700"
                          >
                            {l.nama}
                          </Link>
                        </td>
                        <td className="border-b border-line px-4 py-3 text-xs text-ink-soft">
                          {l.durasiMenit ? `${l.durasiMenit} menit` : "Menyesuaikan"}
                        </td>
                        <td className="border-b border-line px-4 py-3 text-xs text-ink-soft">
                          {l.metode
                            .map((m) => (m === "ONLINE" ? "Daring" : "Tatap muka"))
                            .join(", ")}
                        </td>
                        <td className="border-b border-line px-4 py-3 text-right font-semibold text-ink">
                          <div className="flex flex-col items-end gap-1 text-[0.7rem]">
                            <span className="text-muted">Daring: <span className="text-brand-700 font-semibold">Rp375.000</span></span>
                            <span className="text-muted">Tatap muka: <span className="text-brand-700 font-semibold">Rp545.000</span></span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}

        {layanan.length === 0 && (
          <div className="kartu p-10 text-center text-ink-soft">
            Daftar biaya belum tersedia. Hubungi kami di {siteConfig.telepon}.
          </div>
        )}

        <section className="kartu bg-paper-2 p-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-muted">
            Catatan
          </h2>
          <ul className="mt-4 space-y-2.5">
            {catatan.map((c) => (
              <li key={c} className="flex gap-3 text-sm leading-relaxed text-ink-soft">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                {c}
              </li>
            ))}
          </ul>
        </section>

        <div className="kartu flex flex-col items-center justify-between gap-5 bg-brand-600 p-8 text-white sm:flex-row">
          <div>
            <h2 className="text-lg font-bold">Butuh penawaran untuk institusi?</h2>
            <p className="mt-1.5 text-sm text-white/75">
              Kami menyusun proposal sesuai jumlah peserta dan lingkup asesmen.
            </p>
          </div>
          <div className="flex shrink-0 gap-3">
            <Link href="/kontak" className="tombol tombol-sand">
              Minta Penawaran
            </Link>
            <Link href="/daftar" className="tombol bg-white/15 text-white hover:bg-white/25">
              Daftar
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
