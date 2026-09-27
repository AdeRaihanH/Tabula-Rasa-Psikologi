"use client";

import { useEffect, useState } from "react";

/**
 * Bilah tipis di paling atas yang menunjukkan seberapa jauh halaman digulir.
 */
export function KemajuanGulir() {
  const [maju, setMaju] = useState(0);

  useEffect(() => {
    let raf = 0;

    const hitung = () => {
      raf = 0;
      const tinggi =
        document.documentElement.scrollHeight - window.innerHeight;
      const posisi = window.scrollY;
      setMaju(tinggi > 0 ? Math.min(1, Math.max(0, posisi / tinggi)) : 0);
    };

    const saatGulir = () => {
      if (!raf) raf = requestAnimationFrame(hitung);
    };

    hitung();
    window.addEventListener("scroll", saatGulir, { passive: true });
    window.addEventListener("resize", saatGulir);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", saatGulir);
      window.removeEventListener("resize", saatGulir);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 bg-transparent"
    >
      <div
        className="bilah-kemajuan h-full bg-gradient-to-r from-brand-500 via-brand-400 to-sage-400"
        style={{ transform: `scaleX(${maju})` }}
      />
    </div>
  );
}

/**
 * Tombol kembali ke atas; muncul setelah pengguna menggulir cukup jauh.
 */
export function TombolKeAtas() {
  const [tampil, setTampil] = useState(false);

  useEffect(() => {
    const saatGulir = () => setTampil(window.scrollY > 640);
    saatGulir();
    window.addEventListener("scroll", saatGulir, { passive: true });
    return () => window.removeEventListener("scroll", saatGulir);
  }, []);

  return (
    <button
      type="button"
      aria-label="Kembali ke atas"
      onClick={() =>
        window.scrollTo({
          top: 0,
          behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
        })
      }
      className={`fixed bottom-5 right-5 z-50 grid h-11 w-11 place-items-center rounded-full bg-brand-700 text-white shadow-lg transition-all duration-300 hover:bg-brand-800 ${
        tampil
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </button>
  );
}
