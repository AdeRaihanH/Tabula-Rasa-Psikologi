import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { FormPendaftaran } from "@/components/publik/FormPendaftaran";
import { sesiSaatIni } from "@/lib/auth/dal";
import { ambilLayanan, ambilPsikologPublik } from "@/lib/data-publik";
import { hargaPerMetode } from "@/lib/pembayaran";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Pendaftaran",
  description:
    "Formulir pendaftaran layanan biro psikologi untuk individu, sekolah, dan perusahaan.",
};

export default async function HalamanDaftar({
  searchParams,
}: PageProps<"/daftar">) {
  // Pendaftaran memerlukan akun agar status & hasil mudah dipantau klien.
  const sesi = await sesiSaatIni();
  if (!sesi?.userId) {
    const sp = await searchParams;
    const q = new URLSearchParams();
    q.set("dari", "/daftar");
    if (typeof sp?.layanan === "string") q.set("layanan", sp.layanan);
    if (typeof sp?.psikolog === "string") q.set("psikolog", sp.psikolog);
    redirect(`/masuk?${q.toString()}`);
  }
  if (sesi.role !== "KLIEN") redirect("/dashboard");

  const [layanan, psikolog, sp, akun, klien] = await Promise.all([
    ambilLayanan(),
    ambilPsikologPublik(),
    searchParams,
    prisma.user.findUnique({
      where: { id: sesi.userId },
      select: { nama: true, email: true, telepon: true },
    }),
    prisma.klien.findFirst({
      where: { userId: sesi.userId },
      orderBy: { createdAt: "desc" },
      select: {
        tanggalLahir: true,
        jenisKelamin: true,
        alamat: true,
        pekerjaan: true,
        institusi: true,
      },
    }),
  ]);
  const slugAwal = typeof sp?.layanan === "string" ? sp.layanan : undefined;
  const psikologAwal =
    typeof sp?.psikolog === "string" ? sp.psikolog : undefined;

  return (
    <>
      <section className="border-b border-line bg-paper-2">
        <div className="wadah py-12">
          <span className="label-kecil">Pendaftaran</span>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Formulir Pendaftaran Layanan
          </h1>
          <p className="mt-4 max-w-2xl text-ink-soft">
            Masuk sebagai <strong>{akun?.nama}</strong>. Data diri Anda sudah
            terisi dari akun — cukup lengkapi kebutuhan layanan dan pilih
            psikolog yang akan menangani Anda.
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
            hargaOnline: hargaPerMetode(l).online,
            hargaOffline: hargaPerMetode(l).offline,
            durasiMenit: l.durasiMenit,
            metode: l.metode,
          }))}
          psikolog={psikolog.map((p) => ({
            id: p.userId,
            nama: p.user.nama,
            spesialisasi: p.spesialisasi,
            fotoUrl: p.fotoUrl,
          }))}
          akun={{
            nama: akun?.nama ?? sesi.nama,
            email: akun?.email ?? "",
            telepon: akun?.telepon ?? null,
            tanggalLahir: klien?.tanggalLahir
              ? klien.tanggalLahir.toISOString().slice(0, 10)
              : null,
            jenisKelamin: klien?.jenisKelamin ?? null,
            alamat: klien?.alamat ?? null,
            pekerjaan: klien?.pekerjaan ?? null,
            institusi: klien?.institusi ?? null,
          }}
          slugAwal={slugAwal}
          psikologAwal={psikologAwal}
        />

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="kartu p-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-muted">
              Yang terjadi setelah ini
            </h2>
            <ol className="mt-4 space-y-4">
              {[
                ["Pendaftaran dan pembayaran", "Isi data diri dan selesaikan pembayaran untuk konfirmasi pendaftaran."],
                ["Pelaksanaan tes", "Sesi asesmen atau tes psikologi dilaksanakan sesuai jadwal yang dipilih."],
                ["Hasil tes", "Laporan hasil tes diserahkan beserta sesi konsultasi umpan balik."],
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
              Data diri Anda hanya dapat diakses oleh tim administrasi kami.
              Hasil asesmen dan rekam psikologis disimpan terpisah dengan hak akses terbatas.
              Psikolog lain tidak dapat melihat data Anda kecuali psikolog yang Anda pilih.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
