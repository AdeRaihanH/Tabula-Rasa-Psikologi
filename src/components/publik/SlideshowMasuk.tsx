"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { Logo } from "@/components/ui/Logo";

/* ─────────────────────────────────────────
   Ikon SVG bergaya sketsa/stroke — tanpa emoji
───────────────────────────────────────── */
function IkonPerisai() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function IkonOrang() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6" />
      <path d="M17 5l1.2 1.2 2-2" />
    </svg>
  );
}

function IkonKunci() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 018 0v3" />
      <circle cx="12" cy="15.5" r="1.2" />
      <line x1="12" y1="16.7" x2="12" y2="18" />
    </svg>
  );
}

/* Badge icon SVG — pengganti emoji */
function IkonBintang() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function IkonSertifikat() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/>
      <path d="M9 12l2 2 4-4"/>
    </svg>
  );
}

function IkonGembok() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="10" width="16" height="10" rx="2"/>
      <path d="M8 10V7a4 4 0 018 0v3"/>
    </svg>
  );
}

/* ─────────────────────────────────────────
   Data slide
───────────────────────────────────────── */
const slides = [
  {
    id: 1,
    eyebrow: "Konsultasi Psikolog #1",
    judul: ["Kesehatan mental Anda", "adalah prioritas kami"],
    deskripsi:
      "Layanan psikologi profesional dengan psikolog berizin praktik — terpercaya, terstruktur, dan terjangkau.",
    badgeIcon: <IkonBintang />,
    badgeLabel: "5,0 · 2.000+ klien terlayani",
    ikon: <IkonPerisai />,
  },
  {
    id: 2,
    eyebrow: "Terpercaya & Profesional",
    judul: ["Psikolog berpengalaman", "untuk setiap kebutuhan"],
    deskripsi:
      "Tes asesmen, konseling individu, hingga layanan Psikologi Industri & Organisasi — semua dalam satu platform terintegrasi.",
    badgeIcon: <IkonSertifikat />,
    badgeLabel: "Psikolog berizin SIPP & STR",
    ikon: <IkonOrang />,
  },
  {
    id: 3,
    eyebrow: "Kerahasiaan Terjamin",
    judul: ["Data Anda dijaga", "berlapis & aman"],
    deskripsi:
      "Sistem kerahasiaan berlapis memastikan privasi penuh. Tidak ada satu pihak pun yang dapat mengakses seluruh data klien sekaligus.",
    badgeIcon: <IkonGembok />,
    badgeLabel: "Privasi berlapis & terlindungi",
    ikon: <IkonKunci />,
  },
];

const DURASI = 5500;

/* Lingkaran dekoratif latar belakang */
const dekorasi = [
  { top: "8%",   right: "6%",   width: 160, height: 160, anim: "float-a", opacity: 0.08 },
  { top: "40%",  left: "5%",    width: 90,  height: 90,  anim: "float-b", opacity: 0.06 },
  { bottom: "12%", right: "12%", width: 120, height: 120, anim: "float-c", opacity: 0.07 },
  { bottom: "32%", left: "28%", width: 55,  height: 55,  anim: "float-a", opacity: 0.05 },
];

export function SlideshowMasuk() {
  const [aktif, setAktif] = useState(0);
  const [fase, setFase]   = useState<"masuk" | "keluar">("masuk");
  const timerRef          = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pindah = (ke: number) => {
    if (ke === aktif) return;
    setFase("keluar");
    setTimeout(() => {
      setAktif(ke);
      setFase("masuk");
    }, 280);
  };

  useEffect(() => {
    timerRef.current = setTimeout(
      () => pindah((aktif + 1) % slides.length),
      DURASI,
    );
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aktif]);

  const slide = slides[aktif];

  return (
    <div
      className="relative flex h-full flex-col overflow-hidden"
      style={{
        background:
          "linear-gradient(160deg, #163d1a 0%, #1f5225 45%, #2a6e31 100%)",
      }}
    >
      {/* Lingkaran dekoratif halus */}
      {dekorasi.map((d, i) => (
        <div
          key={i}
          aria-hidden
          className={`pointer-events-none absolute rounded-full bg-white ${d.anim}`}
          style={{ ...d } as React.CSSProperties}
        />
      ))}

      {/* Logo */}
      <div className="relative z-10 px-10 pt-10">
        <Logo terang kotakIkon />
      </div>

      {/* Konten slide — center */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-10 text-center">
        <div
          key={aktif}
          className={fase === "masuk" ? "slide-masuk" : "slide-keluar"}
        >
          {/* Ikon utama */}
          <div
            className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-2xl text-white"
            style={{
              background: "rgba(255,255,255,0.10)",
              border: "1px solid rgba(255,255,255,0.14)",
              backdropFilter: "blur(6px)",
            }}
          >
            {slide.ikon}
          </div>

          {/* Eyebrow */}
          <p className="mb-3 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-white/50">
            {slide.eyebrow}
          </p>

          {/* Judul */}
          <h1 className="text-[1.9rem] font-bold leading-[1.16] tracking-tight text-white">
            {slide.judul[0]}
            <br />
            <span style={{ color: "rgba(255,255,255,0.82)" }}>{slide.judul[1]}</span>
          </h1>

          {/* Deskripsi */}
          <p className="mx-auto mt-5 max-w-[19rem] text-sm leading-relaxed text-white/60">
            {slide.deskripsi}
          </p>

          {/* Badge — ikon SVG, tanpa emoji */}
          <div
            className="mt-7 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium text-white/80"
            style={{
              background: "rgba(255,255,255,0.09)",
              border: "1px solid rgba(255,255,255,0.14)",
            }}
          >
            <span className="text-white/70">{slide.badgeIcon}</span>
            {slide.badgeLabel}
          </div>
        </div>
      </div>

      {/* Dot navigator — hanya titik, tanpa progress bar */}
      <div className="relative z-10 flex flex-col items-center pb-10 pt-6">
        <div className="flex items-center gap-[0.4rem]">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => pindah(i)}
              aria-label={`Slide ${i + 1}`}
              style={{
                width: i === aktif ? "1.6rem" : "0.45rem",
                height: "0.45rem",
                background: i === aktif ? "#ffffff" : "rgba(255,255,255,0.28)",
                borderRadius: "999px",
                transition: "width 0.35s cubic-bezier(0.16,1,0.3,1), background 0.3s ease",
              }}
            />
          ))}
        </div>

        <p className="mt-7 text-[0.65rem] text-white/28">
          Akses tidak sah dicatat pada log audit.
        </p>
      </div>

      {/* Animasi float lingkaran */}
      <style>{`
        .float-a { animation: fltA 7s ease-in-out infinite; }
        .float-b { animation: fltB 9s ease-in-out infinite 1.2s; }
        .float-c { animation: fltC 6s ease-in-out infinite 0.6s; }
        @keyframes fltA { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-16px)} }
        @keyframes fltB { 0%,100%{transform:translateY(0)} 50%{transform:translateY(13px)} }
        @keyframes fltC { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-10px) scale(1.05)} }
      `}</style>
    </div>
  );
}
