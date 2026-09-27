import type { Metadata } from "next";
import Link from "next/link";

import { FormCekStatus } from "@/components/publik/FormCekStatus";
import { sesiRingkas } from "@/lib/auth/dal";
import { TAHAP } from "@/lib/alur";

export const metadata: Metadata = {
  title: "Cek Status Pendaftaran",
  description:
    "Periksa status pendaftaran layanan tanpa login, cukup dengan nomor pendaftaran dan email terdaftar.",
};

export default async function HalamanCekStatus() {
  const sesi = await sesiRingkas();
  const sudahLogin = Boolean(sesi?.userId && sesi.role === "KLIEN");

  return (
    <>
      <section className="border-b border-line bg-paper-2">
        <div className="wadah py-14">
          <span className="label-kecil">Cek Status</span>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Pantau status pendaftaran Anda
          </h1>
          <p className="mt-4 max-w-2xl text-ink-soft">
            Cek status tanpa harus login. Masukkan nomor pendaftaran yang Anda
            terima beserta email yang didaftarkan — keduanya harus cocok untuk
            melindungi data Anda. Punya akun? Status lengkap juga tersedia di{" "}
            <Link
              href="/dashboard/riwayat"
              className="font-semibold text-brand-700 underline"
            >
              Riwayat Pendaftaran
            </Link>{" "}
            pada portal Anda.
          </p>
        </div>
      </section>

      <div className="wadah grid gap-10 py-12 lg:grid-cols-[1.2fr_1fr]">
        <FormCekStatus sudahLogin={sudahLogin} />

        <aside>
          <div className="kartu p-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-muted">
              Arti setiap status
            </h2>
            <ol className="mt-4 space-y-3">
              {TAHAP.map((t) => (
                <li key={t.kode} className="flex gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-100 text-[0.7rem] font-bold text-brand-700">
                    {t.nomor}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">{t.judul}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
                      {t.isi}
                    </p>
                    <p className="mt-0.5 text-[0.68rem] text-muted">
                      Penanggung jawab: {t.aktor}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="kartu mt-4 bg-brand-50 p-6">
            <h2 className="text-sm font-bold text-brand-800">
              Belum menerima nomor pendaftaran?
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-brand-800/75">
              Nomor ditampilkan setelah formulir berhasil dikirim. Jika Anda
              kehilangannya, hubungi admin dengan menyebutkan nama dan email
              yang didaftarkan.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/daftar" className="tombol tombol-utama !py-2 !text-xs">
                Daftar Layanan
              </Link>
              <Link href="/kontak" className="tombol tombol-garis !py-2 !text-xs">
                Hubungi Admin
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
