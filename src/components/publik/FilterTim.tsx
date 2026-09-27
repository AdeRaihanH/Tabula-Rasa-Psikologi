"use client";

import { useMemo, useState } from "react";

import {
  KartuPsikolog,
  type PsikologTampil,
} from "@/components/publik/KartuPsikolog";
import { cn } from "@/lib/utils";

/**
 * Daftar psikolog dengan pencarian nama/spesialisasi dan penyaring
 * berdasarkan spesialisasi.
 */
export function FilterTim({ daftar }: { daftar: PsikologTampil[] }) {
  const [cari, setCari] = useState("");
  const [pilih, setPilih] = useState("Semua");

  const spesialisasi = useMemo(
    () =>
      Array.from(new Set(daftar.map((p) => p.spesialisasi).filter(Boolean))),
    [daftar],
  );

  const hasil = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return daftar.filter((p) => {
      const cocokPilih = pilih === "Semua" || p.spesialisasi === pilih;
      const cocokCari =
        !q ||
        p.nama.toLowerCase().includes(q) ||
        p.spesialisasi.toLowerCase().includes(q);
      return cocokPilih && cocokCari;
    });
  }, [daftar, cari, pilih]);

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-xs">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
          </span>
          <input
            type="search"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari nama atau spesialisasi…"
            aria-label="Cari psikolog"
            className="input !pl-9"
          />
        </div>

        {spesialisasi.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {["Semua", ...spesialisasi].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setPilih(s)}
                aria-pressed={pilih === s}
                className={cn(
                  "pil border-line transition-colors",
                  pilih === s
                    ? "border-brand-700 bg-brand-700 text-white"
                    : "bg-white text-ink-soft hover:border-brand-300 hover:text-brand-700",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-muted" aria-live="polite">
        {hasil.length} dari {daftar.length} psikolog ditampilkan
      </p>

      {hasil.length === 0 ? (
        <div className="kartu mt-6 p-10 text-center">
          <p className="text-sm text-ink-soft">
            Tidak ada psikolog yang cocok dengan pencarian Anda.
          </p>
          <button
            type="button"
            onClick={() => {
              setCari("");
              setPilih("Semua");
            }}
            className="tombol tombol-garis mt-4 !text-xs"
          >
            Reset pencarian
          </button>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {hasil.map((p, i) => (
            <div
              key={p.userId}
              className="slide-masuk flex"
              style={{ animationDelay: `${Math.min(i, 8) * 55}ms` }}
            >
              <KartuPsikolog p={p} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
