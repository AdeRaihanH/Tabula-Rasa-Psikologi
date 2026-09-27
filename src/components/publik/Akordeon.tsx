"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Akordeon dengan animasi buka-tutup yang halus.
 * `satuSaja` membatasi hanya satu jawaban terbuka pada satu waktu.
 */
export function Akordeon({
  daftar,
  awalTerbuka = -1,
  satuSaja = false,
  className,
}: {
  daftar: readonly { q: string; a: string }[];
  awalTerbuka?: number;
  satuSaja?: boolean;
  className?: string;
}) {
  const [buka, setBuka] = useState<number[]>(
    awalTerbuka >= 0 ? [awalTerbuka] : [],
  );

  const alih = (i: number) =>
    setBuka((kini) => {
      if (kini.includes(i)) return kini.filter((x) => x !== i);
      return satuSaja ? [i] : [...kini, i];
    });

  return (
    <div className={cn("space-y-2", className)}>
      {daftar.map((t, i) => {
        const terbuka = buka.includes(i);
        return (
          <div
            key={t.q}
            className={cn(
              "kartu overflow-hidden transition-colors",
              terbuka && "border-brand-300",
            )}
          >
            <button
              type="button"
              onClick={() => alih(i)}
              aria-expanded={terbuka}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-ink transition-colors hover:bg-paper-2/50"
            >
              <span className="garis-tumbuh">{t.q}</span>
              <span
                className={cn(
                  "grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600 transition-transform duration-300",
                  terbuka && "rotate-45 bg-brand-600 text-white",
                )}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  aria-hidden
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>
            </button>

            <div
              className={cn(
                "grid transition-all duration-300 ease-out",
                terbuka
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-4 text-sm leading-relaxed text-ink-soft">
                  {t.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
