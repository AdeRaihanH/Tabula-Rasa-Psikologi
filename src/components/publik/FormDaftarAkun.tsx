"use client";

import Link from "next/link";
import { useActionState } from "react";

import { daftarAkunKlien, type HasilAkun } from "@/app/actions/akun";
import { InputSandi } from "@/components/ui/InputSandi";
import { JebakanBot } from "@/components/ui/JebakanBot";

function Galat({ pesan }: { pesan?: string }) {
  if (!pesan) return null;
  return <p className="mt-1 text-xs font-medium text-red-600">{pesan}</p>;
}

export function FormDaftarAkun() {
  const [hasil, aksi, pending] = useActionState<HasilAkun | undefined, FormData>(
    daftarAkunKlien,
    undefined,
  );

  const galat = hasil && !hasil.ok ? hasil.galat : undefined;

  return (
    <form action={aksi} className="space-y-5">
      <JebakanBot />
      {hasil && !hasil.ok && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {hasil.pesan}
        </div>
      )}

      <div>
        <label className="label" htmlFor="nama">
          Nama lengkap
        </label>
        <input
          id="nama"
          name="nama"
          className="input"
          placeholder="Nama sesuai identitas"
          autoComplete="name"
          required
        />
        <Galat pesan={galat?.nama} />
      </div>

      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="input"
          placeholder="nama@email.com"
          autoComplete="email"
          required
        />
        <Galat pesan={galat?.email} />
      </div>

      <div>
        <label className="label" htmlFor="telepon">
          Nomor telepon / WhatsApp
        </label>
        <input
          id="telepon"
          name="telepon"
          className="input"
          placeholder="08xxxxxxxxxx"
          autoComplete="tel"
          required
        />
        <Galat pesan={galat?.telepon} />
      </div>

      <div>
        <label className="label" htmlFor="password">
          Kata sandi
        </label>
        <InputSandi
          id="password"
          name="password"
          placeholder="Minimal 8 karakter"
          autoComplete="new-password"
        />
        <Galat pesan={galat?.password} />
      </div>

      <div>
        <label className="label" htmlFor="ulang">
          Ulangi kata sandi
        </label>
        <InputSandi
          id="ulang"
          name="ulang"
          placeholder="Ulangi kata sandi"
          autoComplete="new-password"
        />
        <Galat pesan={galat?.ulang} />
      </div>

      <label className="flex items-start gap-3 text-sm leading-relaxed text-ink-soft">
        <input
          type="checkbox"
          name="setuju"
          className="mt-0.5 h-4 w-4 accent-brand-600"
          required
        />
        <span>
          Saya menyetujui pemrosesan data saya sesuai{" "}
          <Link href="/kerahasiaan" className="font-semibold text-brand-700 underline">
            sistem kerahasiaan data
          </Link>{" "}
          biro.
        </span>
      </label>

      <button
        type="submit"
        disabled={pending}
        className="tombol tombol-utama w-full disabled:opacity-60"
      >
        {pending ? "Membuat akun…" : "Buat Akun"}
      </button>

      <p className="text-center text-xs text-muted">
        Sudah punya akun?{" "}
        <Link href="/masuk" className="font-semibold text-brand-700 hover:underline">
          Masuk di sini
        </Link>
      </p>
    </form>
  );
}
