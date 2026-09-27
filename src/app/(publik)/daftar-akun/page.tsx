import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { FormDaftarAkun } from "@/components/publik/FormDaftarAkun";
import { sesiSaatIni } from "@/lib/auth/dal";
import { rumahDashboard } from "@/lib/rbac";

export const metadata: Metadata = {
  title: "Buat Akun Klien",
  description:
    "Buat akun untuk memantau status pendaftaran, jadwal, dan hasil layanan psikologi Anda.",
};

const manfaat = [
  {
    judul: "Pantau status real-time",
    isi: "Lihat posisi pendaftaran Anda pada 5 tahap layanan tanpa perlu bertanya ke admin.",
  },
  {
    judul: "Riwayat terkumpul",
    isi: "Semua pendaftaran, jadwal, dan arsip berkas Anda tersimpan dalam satu portal.",
  },
  {
    judul: "Unggah bukti pembayaran",
    isi: "Kirim bukti transfer langsung dari portal, tanpa perlu bolak-balik chat.",
  },
  {
    judul: "Data tetap terlindungi",
    isi: "Anda hanya dapat melihat data milik sendiri. Psikolog lain pun tidak dapat mengaksesnya.",
  },
];

export default async function HalamanDaftarAkun() {
  const sesi = await sesiSaatIni();
  if (sesi?.userId) redirect(rumahDashboard(sesi.role));

  return (
    <>
      <section className="border-b border-line bg-paper-2">
        <div className="wadah py-12">
          <span className="label-kecil">Akun Klien</span>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Buat akun untuk mulai mendaftar
          </h1>
          <p className="mt-4 max-w-2xl text-ink-soft">
            Satu akun untuk semua kebutuhan Anda — mendaftar layanan, memantau
            status, mengirim bukti pembayaran, dan mengakses riwayat.
          </p>
        </div>
      </section>

      <div className="wadah grid gap-10 py-12 lg:grid-cols-[1fr_1fr]">
        <div className="mx-auto w-full max-w-md lg:mx-0">
          <div className="kartu p-6 sm:p-8">
            <h2 className="text-lg font-bold text-ink">Data akun</h2>
            <p className="mt-1.5 text-sm text-ink-soft">
              Isi data berikut. Kolom bertanda wajib harus diisi.
            </p>
            <div className="mt-6">
              <FormDaftarAkun />
            </div>
          </div>
        </div>

        <aside className="lg:pt-4">
          <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-muted">
            Manfaat punya akun
          </h2>
          <ul className="mt-5 space-y-4">
            {manfaat.map((m) => (
              <li key={m.judul} className="kartu p-5">
                <h3 className="font-bold text-ink">{m.judul}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                  {m.isi}
                </p>
              </li>
            ))}
          </ul>

          <div className="kartu mt-4 bg-brand-50 p-5">
            <h3 className="text-sm font-bold text-brand-800">
              Sudah pernah mendaftar tanpa akun?
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-brand-800/75">
              Tidak masalah. Buat akun dengan <strong>email yang sama</strong>{" "}
              seperti saat mendaftar dulu — riwayat pendaftaran Anda akan
              otomatis muncul di portal.
            </p>
            <Link
              href="/cek-status"
              className="tombol tombol-garis mt-4 !py-2 !text-xs"
            >
              Cek status tanpa akun
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
