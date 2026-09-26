import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { FormMasuk } from "@/components/publik/FormMasuk";
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
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white p-1"
            >
              <Image src="/logo-icon.png" alt="Logo" width={32} height={32} className="object-contain" />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--color-ink)" }}>Tabula Rasa</p>
              <p className="text-[0.6rem] uppercase tracking-widest" style={{ color: "var(--color-muted)" }}>Biro Psikologi</p>
            </div>
          </div>

          {/* Heading */}
          <div className="animasi-naik">
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: "var(--color-brand-100)", color: "var(--color-brand-700)" }}
            >
              Portal Internal
            </span>
            <h2 className="mt-4 text-2xl font-bold tracking-tight" style={{ color: "var(--color-ink)" }}>
              Masuk ke akun Anda
            </h2>
            <p className="mt-1.5 text-sm" style={{ color: "var(--color-ink-soft)" }}>
              Gunakan email dan kata sandi yang diberikan administrator.
            </p>
          </div>

          {/* Form */}
          <div className="mt-8">
            <FormMasuk />
          </div>

          {/* Demo account */}
          <div
            className="mt-6 rounded-xl border p-4"
            style={{
              borderColor: "var(--color-cream-200)",
              background: "var(--color-cream-100)",
            }}
          >
            <p className="text-xs font-semibold" style={{ color: "var(--color-ink-soft)" }}>
              Akun demo
            </p>
            <ul className="mt-2 space-y-1 text-xs" style={{ color: "var(--color-muted)" }}>
              <li>admin@tabularasa.id — Administrator</li>
              <li>asisten@tabularasa.id — Asisten Psikolog</li>
              <li>psikolog1@tabularasa.id — Psikolog</li>
            </ul>
            <p className="mt-2 text-xs" style={{ color: "var(--color-muted)" }}>
              Kata sandi:{" "}
              <span
                className="rounded px-1.5 py-0.5 font-mono text-[0.72rem]"
                style={{ background: "var(--color-cream-200)", color: "var(--color-ink-soft)" }}
              >
                TabulaRasa123!
              </span>
            </p>
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
