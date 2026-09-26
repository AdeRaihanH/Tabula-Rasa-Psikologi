import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { FormMasuk } from "@/components/publik/FormMasuk";
import { Logo } from "@/components/ui/Logo";
import { sesiSaatIni } from "@/lib/auth/dal";
import { rumahDashboard } from "@/lib/rbac";

export const metadata: Metadata = {
  title: "Masuk",
  description: "Portal internal Tabula Rasa untuk admin, asisten psikolog, dan psikolog.",
};

const zona = [
  { kode: "Zona 1", pemegang: "Admin", warna: "var(--color-zona1)" },
  { kode: "Zona 2", pemegang: "Asisten Psikolog", warna: "var(--color-zona2)" },
  { kode: "Zona 3", pemegang: "Psikolog", warna: "var(--color-zona3)" },
];

export default async function HalamanMasuk() {
  const sesi = await sesiSaatIni();
  if (sesi?.userId) redirect(rumahDashboard(sesi.role));

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Panel kiri */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-brand-800 p-12 text-white lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(circle, var(--color-sand-300) 0%, transparent 70%)",
          }}
        />
        <Logo terang />

        <div className="relative">
          <h1 className="max-w-md text-3xl font-bold leading-tight">
            Portal Internal
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">
            Setiap peran hanya dapat mengakses zona datanya sendiri. Psikolog
            tidak dapat melihat data pasien psikolog lain.
          </p>

          <ul className="mt-8 space-y-3">
            {zona.map((z) => (
              <li
                key={z.kode}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3"
              >
                <span className="h-2 w-2 rounded-full" style={{ background: z.warna }} />
                <span className="text-sm font-semibold">{z.kode}</span>
                <span className="ml-auto text-xs text-white/55">{z.pemegang}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/40">
          Akses tidak sah dicatat pada log audit.
        </p>
      </div>

      {/* Panel kanan */}
      <div className="flex flex-col justify-center bg-paper px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="lg:hidden">
            <Logo />
          </div>

          <div className="mt-10 lg:mt-0">
            <h2 className="text-2xl font-bold tracking-tight text-ink">
              Masuk ke akun Anda
            </h2>
            <p className="mt-2 text-sm text-ink-soft">
              Gunakan email dan kata sandi yang diberikan administrator.
            </p>
          </div>

          <div className="mt-8">
            <FormMasuk />
          </div>

          <div className="mt-6 rounded-xl border border-line bg-white p-4">
            <p className="text-xs font-semibold text-ink-soft">Akun demo</p>
            <ul className="mt-2 space-y-1 text-xs text-muted">
              <li>admin@tabularasa.id — Administrator</li>
              <li>asisten@tabularasa.id — Asisten Psikolog</li>
              <li>psikolog1@tabularasa.id — Psikolog</li>
            </ul>
            <p className="mt-2 text-xs text-muted">
              Kata sandi: <span className="font-mono">TabulaRasa123!</span>
            </p>
          </div>

          <p className="mt-8 text-center text-xs text-muted">
            <Link href="/" className="font-semibold text-brand-700 hover:underline">
              ← Kembali ke situs publik
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
