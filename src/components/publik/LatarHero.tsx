"use client";

import { useEffect, useRef } from "react";

/**
 * Dekorasi latar hero: lingkaran gradien yang bergeser mengikuti kursor
 * dan titik-titik halus yang melayang. Nonaktif bila pengguna memilih
 * "reduce motion".
 */
export function LatarHero() {
  const wadah = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wadah.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const saatGerak = (e: PointerEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const x = e.clientX / window.innerWidth - 0.5;
        const y = e.clientY / window.innerHeight - 0.5;
        el.style.setProperty("--px", x.toFixed(3));
        el.style.setProperty("--py", y.toFixed(3));
      });
    };

    window.addEventListener("pointermove", saatGerak, { passive: true });
    return () => {
      window.removeEventListener("pointermove", saatGerak);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const titik = [
    { kiri: "12%", atas: "22%", ukuran: 6, tunda: "0s" },
    { kiri: "24%", atas: "68%", ukuran: 4, tunda: "0.8s" },
    { kiri: "68%", atas: "18%", ukuran: 5, tunda: "1.4s" },
    { kiri: "82%", atas: "58%", ukuran: 7, tunda: "0.4s" },
    { kiri: "48%", atas: "80%", ukuran: 4, tunda: "1.1s" },
    { kiri: "8%", atas: "48%", ukuran: 5, tunda: "1.8s" },
    { kiri: "90%", atas: "30%", ukuran: 4, tunda: "2.2s" },
    { kiri: "58%", atas: "42%", ukuran: 3, tunda: "0.6s" },
  ];

  return (
    <div ref={wadah} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full opacity-50 transition-transform duration-500 ease-out"
        style={{
          background:
            "radial-gradient(circle, var(--color-brand-200) 0%, transparent 70%)",
          transform:
            "translate3d(calc(var(--px, 0) * 40px), calc(var(--py, 0) * 40px), 0)",
        }}
      />
      <div
        className="absolute -bottom-40 -left-24 h-96 w-96 rounded-full opacity-40 transition-transform duration-500 ease-out"
        style={{
          background:
            "radial-gradient(circle, var(--color-sage-100) 0%, transparent 70%)",
          transform:
            "translate3d(calc(var(--px, 0) * -30px), calc(var(--py, 0) * -30px), 0)",
        }}
      />
      <div
        className="absolute -right-10 bottom-10 h-56 w-56 rounded-full opacity-30 transition-transform duration-500 ease-out"
        style={{
          background:
            "radial-gradient(circle, var(--color-cream-200) 0%, transparent 70%)",
          transform:
            "translate3d(calc(var(--px, 0) * 24px), calc(var(--py, 0) * 24px), 0)",
        }}
      />

      {titik.map((d, i) => (
        <span
          key={i}
          className="denyut absolute rounded-full bg-brand-400"
          style={{
            left: d.kiri,
            top: d.atas,
            width: d.ukuran,
            height: d.ukuran,
            opacity: 0.45,
            animationDelay: d.tunda,
          }}
        />
      ))}
    </div>
  );
}
