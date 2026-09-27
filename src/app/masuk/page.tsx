import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { FormMasuk } from "@/components/publik/FormMasuk";
import { Logo } from "@/components/ui/Logo";
import { SlideshowMasuk } from "@/components/publik/SlideshowMasuk";
import { sesiSaatIni } from "@/lib/auth/dal";
import { rumahDashboard } from "@/lib/rbac";

export const metadata: Metadata = {
  title: "Masuk — Tabula Rasa",
  description: "Portal internal Tabula Rasa untuk admin, asisten psikolog, dan psikolog.",
};

export default async function HalamanMasuk() {
  const sesi = await sesiSaatIni();
  if (sesi?.userId) redirect(rumahDashboard(sesi.role));

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Panel kiri — slideshow animasi */}
      <div className="relative hidden lg:block">
        <SlideshowMasuk />
      </div>

      {/* Panel kanan — form login */}
      <div
        className="flex flex-col justify-center px-6 py-14 sm:px-12"
        style={{ background: "var(--color-cream-50)" }}
      >
        <div className="mx-auto w-full max-w-sm">

          {/* Logo mobile only */}
          <div className="mb-10 lg:hidden">
            <Logo />
          </div>

          {/* Heading */}
          <div className="animasi-naik">
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: "var(--color-brand-100)", color: "var(--color-brand-700)" }}
            >
              Portal Akun
            </span>
            <h2 className="mt-4 text-2xl font-bold tracking-tight" style={{ color: "var(--color-ink)" }}>
              Masuk ke akun Anda
            </h2>
          </div>

          {/* Form */}
          <div className="mt-8">
            <FormMasuk />
          </div>

          {/* Ajakan buat akun untuk klien */}
          <div
            className="mt-6 rounded-xl border p-4 text-center"
            style={{
              borderColor: "var(--color-brand-200)",
              background: "var(--color-brand-50)",
            }}
          >
            <p className="text-xs font-semibold" style={{ color: "var(--color-brand-800)" }}>
              Klien baru?
            </p>
            <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--color-ink-soft)" }}>
              Buat akun untuk mendaftar layanan dan memantau statusnya sendiri.
            </p>
            <a
              href="/daftar-akun"
              className="tombol tombol-utama mt-3 w-full !py-2 !text-xs"
            >
              Buat Akun Klien
            </a>
          </div>

          {/* Back link */}
          <p className="mt-8 text-center text-xs" style={{ color: "var(--color-muted)" }}>
            <Link
              href="/"
              className="font-semibold transition-colors hover:underline"
              style={{ color: "var(--color-brand-700)" }}
            >
              ← Kembali ke situs publik
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
