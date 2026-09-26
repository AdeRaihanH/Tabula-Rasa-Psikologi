import Link from "next/link";

import { Logo } from "@/components/ui/Logo";

export default function TidakDitemukan() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center">
      <Logo />
      <p className="mt-10 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-brand-600">
        Halaman tidak ditemukan
      </p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight text-ink">404</h1>
      <p className="mt-4 max-w-md text-ink-soft">
        Halaman yang Anda cari mungkin sudah dipindahkan atau tautannya keliru.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="tombol tombol-utama">
          Kembali ke Beranda
        </Link>
        <Link href="/kontak" className="tombol tombol-garis">
          Hubungi Kami
        </Link>
      </div>
    </div>
  );
}
