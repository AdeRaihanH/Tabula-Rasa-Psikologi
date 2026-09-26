import type { Metadata } from "next";

import { FormPendaftaran } from "@/components/publik/FormPendaftaran";
import { ambilLayanan } from "@/lib/data-publik";

export const metadata: Metadata = {
  title: "Pendaftaran",
  description:
    "Formulir pendaftaran layanan biro psikologi untuk individu, sekolah, dan korporasi.",
};

export default async function HalamanDaftar({
  searchParams,
}: PageProps<"/daftar">) {
  const [layanan, sp] = await Promise.all([ambilLayanan(), searchParams]);
  const slugAwal = typeof sp?.layanan === "string" ? sp.layanan : undefined;

  return (
    <>
      <section className="border-b border-line bg-paper-2">
        <div className="wadah py-12">
          <span className="label-kecil">Pendaftaran</span>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Formulir Pendaftaran Layanan
          </h1>
          <p className="mt-4 max-w-2xl text-ink-soft">
            Isi data berikut dengan lengkap. Setelah dikirim, admin akan
            melakukan skrining kebutuhan sebelum tahap persetujuan dan
            pembayaran.
          </p>
        </div>
      </section>

      <div className="wadah grid gap-10 py-12 lg:grid-cols-[1.7fr_1fr]">
        <FormPendaftaran
          layanan={layanan.map((l) => ({
            id: l.id,
            nama: l.nama,
            kategori: l.kategori,
            slug: l.slug,
            harga: l.harga ? l.harga.toString() : null,
            durasiMenit: l.durasiMenit,
            metode: l.metode,
          }))}
          slugAwal={slugAwal}
        />

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="kartu p-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-muted">
              Yang terjadi setelah ini
            </h2>
            <ol className="mt-4 space-y-4">
              {[
                ["Skrining kebutuhan", "Admin memverifikasi kebutuhan Anda, termasuk proposal institusi bila ada."],
                ["Persetujuan & pembayaran", "Informed consent dan kesepakatan, lalu pembayaran diverifikasi admin."],
                ["Penjadwalan", "Sesi dijadwalkan bersama psikolog yang sesuai."],
                ["Pelaksanaan & hasil", "Asesmen berjalan, lalu laporan diserahkan beserta umpan balik."],
              ].map(([judul, isi], i) => (
                <li key={judul} className="flex gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-100 text-[0.7rem] font-bold text-brand-700">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">{judul}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
                      {isi}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="kartu mt-4 bg-brand-50 p-6">
            <h2 className="text-sm font-bold text-brand-800">Privasi Anda</h2>
            <p className="mt-2 text-xs leading-relaxed text-brand-800/75">
              Data diri Anda masuk ke Zona 1 dan hanya dapat diakses admin.
              Hasil asesmen disimpan terpisah di Zona 2 dan Zona 3 yang hanya
              dapat dibuka asisten psikolog dan psikolog penanggung jawab.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
