"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Testimoni = { kutipan: string; nama: string; peran: string };

const JEDA = 6000;
const DURASI_ALIH = 260;

/**
 * Karusel testimoni otomatis dengan navigasi titik dan panah.
 * Berhenti sejenak saat kursor atau fokus berada di atasnya.
 */
export function KaruselTestimoni({ daftar }: { daftar: readonly Testimoni[] }) {
  const [aktif, setAktif] = useState(0);
  const [fase, setFase] = useState<"masuk" | "keluar">("masuk");
  const [berhenti, setBerhenti] = useState(false);
  const aktifRef = useRef(0);
  const jumlah = daftar.length;

  useEffect(() => {
    aktifRef.current = aktif;
  }, [aktif]);

  const pindah = useCallback(
    (ke: number) => {
      if (jumlah <= 1) return;
      const tujuan = ((ke % jumlah) + jumlah) % jumlah;
      if (tujuan === aktifRef.current) return;
      setFase("keluar");
      setTimeout(() => {
        setAktif(tujuan);
        setFase("masuk");
      }, DURASI_ALIH);
    },
    [jumlah],
  );

  useEffect(() => {
    if (berhenti || jumlah <= 1) return;
    const t = setTimeout(() => pindah(aktifRef.current + 1), JEDA);
    return () => clearTimeout(t);
  }, [aktif, berhenti, jumlah, pindah]);

  if (jumlah === 0) return null;
  const t = daftar[aktif];

  return (
    <div
      className="relative"
      onMouseEnter={() => setBerhenti(true)}
      onMouseLeave={() => setBerhenti(false)}
      onFocusCapture={() => setBerhenti(true)}
      onBlurCapture={() => setBerhenti(false)}
    >
      <div className="kartu relative overflow-hidden p-8 sm:p-10">
        <span
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-14 select-none text-[9rem] font-bold leading-none text-brand-50"
        >
          &rdquo;
        </span>

        <div
          key={aktif}
          aria-live="polite"
          className={fase === "masuk" ? "slide-masuk" : "slide-keluar"}
        >
          <p className="relative text-base leading-relaxed text-ink-soft sm:text-lg">
            {t.kutipan}
          </p>
          <div className="relative mt-6 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">
              {t.nama
                .split(" ")
                .filter(Boolean)
                .slice(-1)[0]
                ?.charAt(0)
                .toUpperCase()}
            </span>
            <div>
              <p className="text-sm font-bold text-ink">{t.nama}</p>
              <p className="text-xs text-muted">{t.peran}</p>
            </div>
          </div>
        </div>
      </div>

      {jumlah > 1 && (
        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            type="button"
            aria-label="Testimoni sebelumnya"
            onClick={() => pindah(aktif - 1)}
            className="grid h-8 w-8 place-items-center rounded-full border border-line bg-white text-ink-soft transition hover:border-brand-300 hover:text-brand-700"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <div className="flex items-center gap-1.5">
            {daftar.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Testimoni ${i + 1}`}
                aria-current={i === aktif}
                onClick={() => pindah(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === aktif ? "w-6 bg-brand-600" : "w-1.5 bg-line hover:bg-brand-300"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            aria-label="Testimoni berikutnya"
            onClick={() => pindah(aktif + 1)}
            className="grid h-8 w-8 place-items-center rounded-full border border-line bg-white text-ink-soft transition hover:border-brand-300 hover:text-brand-700"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
