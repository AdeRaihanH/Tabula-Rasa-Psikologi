"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { JenisNotifikasi, Notifikasi } from "@/lib/notifikasi";
import { cn } from "@/lib/utils";

/** Ikon lonceng. */
function IkonLonceng() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 01-3.4 0" />
    </svg>
  );
}

const gaya: Record<JenisNotifikasi, { titik: string; latar: string }> = {
  peringatan: { titik: "bg-amber-500", latar: "bg-amber-50" },
  info: { titik: "bg-brand-500", latar: "bg-brand-50" },
  sukses: { titik: "bg-emerald-500", latar: "bg-emerald-50" },
};

/**
 * Lonceng pemberitahuan di bilah atas dashboard.
 *
 * Bulatan merah muncul bila ada pemberitahuan berjenis `peringatan` — yaitu
 * hal yang benar-benar menunggu tindakan pengguna (mis. pembayaran perlu
 * diverifikasi). Pemberitahuan `info` tetap terdaftar tanpa bulatan.
 */
export function LoncengNotifikasi({ daftar }: { daftar: Notifikasi[] }) {
  const [buka, setBuka] = useState(false);
  const wadah = useRef<HTMLDivElement>(null);

  const penting = daftar.filter((n) => n.jenis === "peringatan").length;
  const adaPenting = penting > 0;

  // Tutup saat klik di luar atau tekan Escape.
  useEffect(() => {
    if (!buka) return;

    function klikLuar(e: MouseEvent) {
      if (wadah.current && !wadah.current.contains(e.target as Node)) {
        setBuka(false);
      }
    }
    function tombolEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setBuka(false);
    }

    document.addEventListener("mousedown", klikLuar);
    document.addEventListener("keydown", tombolEsc);
    return () => {
      document.removeEventListener("mousedown", klikLuar);
      document.removeEventListener("keydown", tombolEsc);
    };
  }, [buka]);

  return (
    <div ref={wadah} className="relative">
      <button
        type="button"
        onClick={() => setBuka((v) => !v)}
        aria-label={
          adaPenting
            ? `Pemberitahuan, ${penting} perlu tindakan`
            : "Pemberitahuan"
        }
        aria-expanded={buka}
        aria-haspopup="menu"
        className="relative grid h-9 w-9 place-items-center rounded-lg border border-line text-ink-soft transition-colors hover:bg-paper-2 hover:text-ink"
      >
        <IkonLonceng />
        {adaPenting && (
          <>
            {/* Bulatan merah di ujung atas lonceng */}
            <span
              className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[0.6rem] font-bold text-white ring-2 ring-white"
              aria-hidden
            >
              {penting > 9 ? "9+" : penting}
            </span>
            <span className="sr-only">{penting} pemberitahuan perlu tindakan</span>
          </>
        )}
      </button>

      {buka && (
        <div
          role="menu"
          className="animasi-naik absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-line bg-white shadow-lg"
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-bold text-ink">Pemberitahuan</p>
            {daftar.length > 0 && (
              <span className="text-[0.68rem] text-muted">
                {daftar.length} item
              </span>
            )}
          </div>

          {daftar.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted">
              Tidak ada pemberitahuan saat ini.
            </p>
          ) : (
            <ul className="max-h-[22rem] divide-y divide-line overflow-y-auto">
              {daftar.map((n) => {
                const g = gaya[n.jenis];
                return (
                  <li key={n.id}>
                    <Link
                      href={n.href}
                      role="menuitem"
                      onClick={() => setBuka(false)}
                      className="flex gap-3 px-4 py-3 transition-colors hover:bg-paper-2"
                    >
                      <span
                        className={cn(
                          "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                          g.titik,
                        )}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-ink">
                          {n.judul}
                        </span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-ink-soft">
                          {n.isi}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="border-t border-line bg-paper-2 px-4 py-2.5">
            <p className="text-[0.68rem] text-muted">
              Pemberitahuan dihitung dari kondisi data terkini.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
