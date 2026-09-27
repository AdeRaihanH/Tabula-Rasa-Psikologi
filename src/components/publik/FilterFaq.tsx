"use client";

import { useMemo, useState } from "react";

import { Akordeon } from "@/components/publik/Akordeon";

type Grup = { judul: string; tanya: readonly { q: string; a: string }[] };

/**
 * FAQ dengan pencarian langsung. Bila kata kunci tidak ditemukan,
 * pengguna diberi jalan keluar yang jelas.
 */
export function FilterFaq({ grup }: { grup: readonly Grup[] }) {
  const [cari, setCari] = useState("");
  const kata = cari.trim().toLowerCase();

  const hasil = useMemo(() => {
    if (!kata) return grup.map((g) => ({ ...g, tanya: [...g.tanya] }));
    return grup
      .map((g) => ({
        ...g,
        tanya: g.tanya.filter(
          (t) =>
            t.q.toLowerCase().includes(kata) ||
            t.a.toLowerCase().includes(kata),
        ),
      }))
      .filter((g) => g.tanya.length > 0);
  }, [grup, kata]);

  const jumlah = hasil.reduce((n, g) => n + g.tanya.length, 0);

  return (
    <div>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">
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
          placeholder="Cari pertanyaan, mis. “pembayaran” atau “data”…"
          aria-label="Cari pertanyaan"
          className="input !pl-10"
        />
      </div>

      {kata && (
        <p className="mt-3 text-xs text-muted" aria-live="polite">
          {jumlah} pertanyaan cocok dengan “{cari.trim()}”
        </p>
      )}

      {hasil.length === 0 ? (
        <div className="kartu mt-6 p-10 text-center">
          <p className="text-sm text-ink-soft">
            Tidak ada pertanyaan yang cocok. Coba kata kunci lain, atau hubungi
            kami langsung.
          </p>
          <button
            type="button"
            onClick={() => setCari("")}
            className="tombol tombol-garis mt-4 !text-xs"
          >
            Bersihkan pencarian
          </button>
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          {hasil.map((g) => (
            <section key={g.judul}>
              <h2 className="text-lg font-bold text-ink">{g.judul}</h2>
              <Akordeon key={`${g.judul}-${kata}`} daftar={g.tanya} className="mt-4" />
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
