"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Logo } from "@/components/ui/Logo";
import { navPublik } from "@/lib/config";
import { cn } from "@/lib/utils";

type Identitas = {
  nama: string;
  telepon: string;
  whatsapp: string;
  email: string;
  jamOperasional: string;
};

export function Header({ identitas }: { identitas: Identitas }) {
  const [buka, setBuka] = useState(false);
  const pathname = usePathname();

  const wa = `https://wa.me/${identitas.whatsapp}?text=${encodeURIComponent(
    `Halo ${identitas.nama}, saya ingin bertanya tentang layanan psikologi.`,
  )}`;

  return (
    <header className="sticky top-0 z-50">
      {/* Bar informasi */}
      <div className="hidden bg-brand-800 text-white/85 lg:block">
        <div className="wadah flex h-9 items-center justify-between gap-4 text-[0.72rem]">
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-sand-300" />
              {identitas.jamOperasional}
            </span>
            <a href={`mailto:${identitas.email}`} className="hover:text-white">
              {identitas.email}
            </a>
          </div>
          <div className="flex items-center gap-5">
            <a href={`tel:+${identitas.telepon.replace(/\D/g, "")}`} className="hover:text-white">
              ☎ {identitas.telepon}
            </a>
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-sand-200 hover:text-white"
            >
              Chat Admin →
            </a>
          </div>
        </div>
      </div>

      {/* Navigasi utama */}
      <div className="border-b border-line bg-paper/90 backdrop-blur-md">
        <div className="wadah flex h-16 items-center justify-between gap-4">
          <Logo nama={identitas.nama} />

          <nav className="hidden items-center gap-7 lg:flex">
            {navPublik.map((item) => {
              const aktif =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "tautan-nav relative py-1",
                    aktif && "font-semibold text-brand-700",
                  )}
                >
                  {item.label}
                  {aktif && (
                    <span className="absolute -bottom-0.5 left-0 h-[2px] w-full rounded-full bg-brand-500" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <Link href="/cek-status" className="tautan-nav">
              Cek Status
            </Link>
            <Link href="/masuk" className="tombol tombol-garis">
              Masuk
            </Link>
            <Link href="/daftar" className="tombol tombol-utama">
              Daftar Sekarang
            </Link>
          </div>

          <button
            type="button"
            aria-label="Buka menu"
            aria-expanded={buka}
            onClick={() => setBuka((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-lg border border-line lg:hidden"
          >
            <span className="flex flex-col gap-1">
              <span
                className={cn(
                  "block h-[2px] w-5 bg-ink transition-transform",
                  buka && "translate-y-[6px] rotate-45",
                )}
              />
              <span
                className={cn("block h-[2px] w-5 bg-ink transition-opacity", buka && "opacity-0")}
              />
              <span
                className={cn(
                  "block h-[2px] w-5 bg-ink transition-transform",
                  buka && "-translate-y-[6px] -rotate-45",
                )}
              />
            </span>
          </button>
        </div>

        {buka && (
          <div className="border-t border-line bg-paper lg:hidden">
            <div className="wadah flex flex-col py-3">
              {navPublik.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setBuka(false)}
                  className="rounded-lg px-2 py-3 text-sm font-medium text-ink-soft hover:bg-paper-2 hover:text-brand-700"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/cek-status"
                onClick={() => setBuka(false)}
                className="rounded-lg px-2 py-3 text-sm font-medium text-ink-soft hover:bg-paper-2 hover:text-brand-700"
              >
                Cek Status Pendaftaran
              </Link>

              <div className="mt-2 space-y-2 border-t border-line pt-3">
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tombol tombol-sage w-full"
                >
                  Chat WhatsApp
                </a>
                <div className="flex gap-2">
                  <Link
                    href="/masuk"
                    onClick={() => setBuka(false)}
                    className="tombol tombol-garis flex-1"
                  >
                    Masuk
                  </Link>
                  <Link
                    href="/daftar"
                    onClick={() => setBuka(false)}
                    className="tombol tombol-utama flex-1"
                  >
                    Daftar
                  </Link>
                </div>
                <p className="pt-1 text-center text-[0.7rem] text-muted">
                  {identitas.telepon} · {identitas.jamOperasional}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
