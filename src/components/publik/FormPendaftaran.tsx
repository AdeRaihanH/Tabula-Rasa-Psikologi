"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState } from "react";

import { kirimPendaftaran, type HasilPendaftaran } from "@/app/actions/pendaftaran";
import { labelKategori } from "@/lib/config";
import { cn, formatRupiah } from "@/lib/utils";

type LayananRingkas = {
  id: string;
  nama: string;
  kategori: string;
  slug: string;
  harga: string | null;
  durasiMenit: number | null;
  metode: string[];
};

type PsikologRingkas = {
  id: string;
  nama: string;
  spesialisasi: string;
  fotoUrl: string | null;
};

function Galat({ pesan }: { pesan?: string }) {
  if (!pesan) return null;
  return <p className="mt-1 text-xs font-medium text-red-600">{pesan}</p>;
}

export function FormPendaftaran({
  layanan,
  psikolog,
  slugAwal,
  psikologAwal,
}: {
  layanan: LayananRingkas[];
  psikolog: PsikologRingkas[];
  slugAwal?: string;
  psikologAwal?: string;
}) {
  const [hasil, aksi, pending] = useActionState<HasilPendaftaran | undefined, FormData>(
    kirimPendaftaran,
    undefined,
  );

  if (hasil?.ok) {
    return (
      <div className="kartu animasi-naik p-10 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-100 text-brand-700">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 13l4 4L19 7"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <h2 className="mt-5 text-2xl font-bold text-ink">Pendaftaran terkirim</h2>
        <p className="mt-3 text-ink-soft">
          Simpan nomor pendaftaran Anda untuk ditanyakan kepada admin:
        </p>
        <p className="mt-4 inline-block rounded-xl bg-brand-600 px-6 py-3 text-lg font-bold tracking-wider text-white">
          {hasil.nomor}
        </p>
        <p className="mt-6 text-sm text-ink-soft">
          Tim admin akan memverifikasi kebutuhan Anda dalam 1×24 jam kerja
          melalui email atau telepon yang Anda cantumkan.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="tombol tombol-garis">
            Kembali ke Beranda
          </Link>
          <Link href="/alur" className="tombol tombol-utama">
            Lihat Alur Layanan
          </Link>
        </div>
      </div>
    );
  }

  const galat = hasil && !hasil.ok ? hasil.galat : undefined;

  return (
    <form action={aksi} className="space-y-8">
      {hasil && !hasil.ok && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {hasil.pesan}
        </div>
      )}

      {/* Data diri — Zona 1 */}
      <section className="kartu p-6">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--color-zona1)" }} />
          <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-ink-soft">
            Zona 1 — Data Diri
          </h2>
        </div>
        <p className="mt-2 text-xs text-muted">
          Hanya admin yang dapat melihat bagian ini.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="nama">
              Nama lengkap *
            </label>
            <input id="nama" name="nama" className="input" placeholder="Nama sesuai identitas" />
            <Galat pesan={galat?.nama} />
          </div>

          <div>
            <label className="label" htmlFor="email">
              Email *
            </label>
            <input id="email" name="email" type="email" className="input" placeholder="nama@email.com" />
            <Galat pesan={galat?.email} />
          </div>

          <div>
            <label className="label" htmlFor="telepon">
              Nomor telepon / WhatsApp *
            </label>
            <input id="telepon" name="telepon" className="input" placeholder="08xxxxxxxxxx" />
            <Galat pesan={galat?.telepon} />
          </div>

          <div>
            <label className="label" htmlFor="tanggalLahir">
              Tanggal lahir
            </label>
            <input id="tanggalLahir" name="tanggalLahir" type="date" className="input" />
          </div>

          <div>
            <label className="label" htmlFor="jenisKelamin">
              Jenis kelamin
            </label>
            <select id="jenisKelamin" name="jenisKelamin" className="input" defaultValue="">
              <option value="">Pilih…</option>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="label" htmlFor="alamat">
              Alamat domisili
            </label>
            <input id="alamat" name="alamat" className="input" placeholder="Kota / kabupaten" />
          </div>

          <div>
            <label className="label" htmlFor="pekerjaan">
              Pekerjaan
            </label>
            <input id="pekerjaan" name="pekerjaan" className="input" placeholder="mis. Karyawan swasta" />
          </div>

          <div>
            <label className="label" htmlFor="institusi">
              Institusi / perusahaan
            </label>
            <input id="institusi" name="institusi" className="input" placeholder="Isi jika mendaftar atas nama lembaga" />
          </div>
        </div>
      </section>

      {/* Kebutuhan layanan */}
      <section className="kartu p-6">
        <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-ink-soft">
          Kebutuhan Layanan
        </h2>

        <div className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="layananId">
              Layanan yang diinginkan *
            </label>
            <select
              id="layananId"
              name="layananId"
              className="input"
              defaultValue={
                slugAwal ? (layanan.find((l) => l.slug === slugAwal)?.id ?? "") : ""
              }
            >
              <option value="">Pilih layanan…</option>
              {layanan.map((l) => (
                <option key={l.id} value={l.id}>
                  {labelKategori[l.kategori] ?? l.kategori} — {l.nama}
                  {l.harga ? ` (${formatRupiah(l.harga)})` : ""}
                </option>
              ))}
            </select>
            <Galat pesan={galat?.layananId} />
          </div>

          <div>
            <span className="label">Metode pelaksanaan</span>
            <div className="flex flex-wrap gap-3">
              {[
                { v: "OFFLINE", t: "Tatap muka" },
                { v: "ONLINE", t: "Daring" },
              ].map((m, i) => (
                <label
                  key={m.v}
                  className="flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm has-checked:border-brand-400 has-checked:bg-brand-50"
                >
                  <input
                    type="radio"
                    name="metode"
                    value={m.v}
                    defaultChecked={i === 0}
                    className="accent-brand-600"
                  />
                  {m.t}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="label" htmlFor="kebutuhan">
              Ceritakan kebutuhan Anda
            </label>
            <textarea
              id="kebutuhan"
              name="kebutuhan"
              rows={4}
              className="input"
              placeholder="mis. Seleksi 20 kandidat untuk posisi staf, atau jadwal konseling pribadi."
            />
          </div>
        </div>
      </section>

      {/* Pilih psikolog */}
      <section className="kartu p-6">
        <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-ink-soft">
          Pilih Psikolog *
        </h2>
        <p className="mt-2 text-xs text-muted">
          Pilih psikolog yang akan menangani Anda. Hasil asesmen akan diarsipkan
          pada folder psikolog yang dipilih dan hanya dapat diakses olehnya.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {psikolog.map((p) => (
            <label
              key={p.id}
              className={cn(
                "group flex cursor-pointer items-center gap-4 rounded-2xl border border-line bg-white p-4 transition-colors",
                "has-checked:border-brand-400 has-checked:bg-brand-50/50",
              )}
            >
              <input
                type="radio"
                name="psikologId"
                value={p.id}
                defaultChecked={psikologAwal === p.id}
                className="sr-only"
                required
              />
              <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full ring-2 ring-line transition-shadow group-has-checked:ring-brand-400">
                {p.fotoUrl ? (
                  <Image
                    src={p.fotoUrl}
                    alt={p.nama}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : (
                  <span className="grid h-full w-full place-items-center bg-brand-100 text-sm font-bold text-brand-700">
                    {p.nama.slice(0, 1)}
                  </span>
                )}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-ink">{p.nama}</span>
                <span className="block text-xs text-muted">{p.spesialisasi}</span>
              </span>
            </label>
          ))}

          {psikolog.length === 0 && (
            <p className="rounded-xl bg-paper-2 px-4 py-3 text-xs text-muted sm:col-span-2">
              Data psikolog belum tersedia. Silakan hubungi admin.
            </p>
          )}
        </div>
        <Galat pesan={galat?.psikologId} />
      </section>

      {/* Persetujuan */}
      <section className="kartu p-6">
        <label
          className={cn(
            "flex cursor-pointer items-start gap-3 text-sm leading-relaxed",
            galat?.informedConsent && "text-red-700",
          )}
        >
          <input
            type="checkbox"
            name="informedConsent"
            className="mt-0.5 h-4 w-4 accent-brand-600"
          />
          <span className="text-ink-soft">
            Saya menyetujui pemrosesan data saya sesuai{" "}
            <Link href="/kerahasiaan" className="font-semibold text-brand-700 underline">
              sistem kerahasiaan data
            </Link>{" "}
            dan bersedia menandatangani informed consent sebelum layanan dimulai. *
          </span>
        </label>
        <Galat pesan={galat?.informedConsent} />

        <button type="submit" disabled={pending} className="tombol tombol-utama mt-6 w-full disabled:opacity-60">
          {pending ? "Mengirim…" : "Kirim Pendaftaran"}
        </button>
        <p className="mt-3 text-center text-xs text-muted">
          Tahap berikutnya: skrining kebutuhan oleh admin, lalu persetujuan dan
          pembayaran.
        </p>
      </section>
    </form>
  );
}
