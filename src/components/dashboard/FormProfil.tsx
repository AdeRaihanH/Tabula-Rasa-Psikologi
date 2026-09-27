"use client";

import { useActionState } from "react";

import {
  simpanProfil,
  ubahPasswordSendiri,
  type HasilProfil,
} from "@/app/actions/profil";
import { InputSandi } from "@/components/ui/InputSandi";

function Pesan({ hasil }: { hasil: HasilProfil }) {
  if (!hasil) return null;
  return (
    <div
      className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
        hasil.ok
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      {hasil.pesan}
    </div>
  );
}

export function FormProfil({
  role,
  awal,
}: {
  role: string;
  awal: {
    nama: string;
    email: string;
    terdaftarSejak: string;
    telepon: string;
    spesialisasi: string;
    gelar: string;
    sipp: string;
    str: string;
    bio: string;
    pengalaman: number;
    publik: boolean;
  };
}) {
  const [hasil, aksi, pending] = useActionState<HasilProfil, FormData>(
    simpanProfil,
    undefined,
  );
  const [hasilSandi, aksiSandi, pendingSandi] = useActionState<HasilProfil, FormData>(
    ubahPasswordSendiri,
    undefined,
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <form action={aksi} className="kartu p-6">
        <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-ink-soft">
          Profil Saya
        </h2>
        <Pesan hasil={hasil} />

        {/* Data akun */}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="email">
              Email (akun)
            </label>
            <input
              id="email"
              type="email"
              defaultValue={awal.email}
              readOnly
              className="input bg-paper-2 text-muted"
            />
            <p className="mt-1 text-[0.68rem] text-muted">
              Email dipakai untuk masuk dan tidak dapat diubah sendiri. Hubungi
              admin bila perlu diganti.
            </p>
          </div>
          <div>
            <label className="label" htmlFor="nama">
              Nama lengkap
            </label>
            <input id="nama" name="nama" defaultValue={awal.nama} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="telepon">
              Telepon / WhatsApp
            </label>
            <input id="telepon" name="telepon" defaultValue={awal.telepon} className="input" />
          </div>
        </div>

        <dl className="mt-4 space-y-2 rounded-xl bg-paper-2 px-4 py-3 text-xs">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Terdaftar sejak</dt>
            <dd className="font-medium text-ink-soft">{awal.terdaftarSejak}</dd>
          </div>
        </dl>

        {role === "PSIKOLOG" && (
          <div className="mt-6 grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <p className="rounded-xl bg-paper-2 px-4 py-2.5 text-xs text-ink-soft">
                Data berikut tampil pada halaman publik{" "}
                <span className="font-semibold">/tim</span> bila profil
                ditandai publik.
              </p>
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="spesialisasi">
                Spesialisasi
              </label>
              <input
                id="spesialisasi"
                name="spesialisasi"
                defaultValue={awal.spesialisasi}
                className="input"
                placeholder="mis. Psikolog Klinis"
              />
            </div>
            <div>
              <label className="label" htmlFor="gelar">
                Gelar
              </label>
              <input id="gelar" name="gelar" defaultValue={awal.gelar} className="input" />
            </div>
            <div>
              <label className="label" htmlFor="pengalaman">
                Pengalaman (tahun)
              </label>
              <input
                id="pengalaman"
                name="pengalaman"
                type="number"
                min="0"
                defaultValue={awal.pengalaman}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="sipp">
                Nomor SIPP
              </label>
              <input id="sipp" name="sipp" defaultValue={awal.sipp} className="input" />
            </div>
            <div>
              <label className="label" htmlFor="str">
                Nomor STR
              </label>
              <input id="str" name="str" defaultValue={awal.str} className="input" />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="bio">
                Bio singkat
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={4}
                defaultValue={awal.bio}
                className="input"
                placeholder="Bidang penanganan dan pendekatan Anda."
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-ink-soft sm:col-span-2">
              <input
                type="checkbox"
                name="publik"
                defaultChecked={awal.publik}
                className="h-4 w-4 accent-brand-600"
              />
              Tampilkan profil saya di halaman publik
            </label>
          </div>
        )}

        <button type="submit" disabled={pending} className="tombol tombol-utama mt-6 disabled:opacity-60">
          {pending ? "Menyimpan…" : "Simpan profil"}
        </button>
      </form>

      <form action={aksiSandi} className="kartu h-fit p-6">
        <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-ink-soft">
          Ubah Kata Sandi
        </h2>
        <Pesan hasil={hasilSandi} />

        <div className="mt-5 space-y-4">
          <div>
            <label className="label" htmlFor="lama">
              Kata sandi lama
            </label>
            <InputSandi
              id="lama"
              name="lama"
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="label" htmlFor="baru">
              Kata sandi baru (min. 8 karakter)
            </label>
            <InputSandi
              id="baru"
              name="baru"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="label" htmlFor="ulang">
              Ulangi kata sandi baru
            </label>
            <InputSandi
              id="ulang"
              name="ulang"
              autoComplete="new-password"
            />
          </div>
        </div>

        <button type="submit" disabled={pendingSandi} className="tombol tombol-garis mt-6 w-full disabled:opacity-60">
          {pendingSandi ? "Memproses…" : "Ubah kata sandi"}
        </button>
      </form>
    </div>
  );
}
