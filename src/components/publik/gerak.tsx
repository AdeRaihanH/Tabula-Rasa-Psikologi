"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type Arah = "naik" | "kiri" | "kanan" | "zoom" | "redup";

/**
 * Membungkus elemen agar muncul dengan halus saat memasuki viewport.
 * Animasi dimatikan otomatis bila pengguna mengaktifkan "reduce motion".
 */
export function Muncul({
  children,
  className,
  arah = "naik",
  tunda = 0,
  sebagai = "div",
  ambang = 0.15,
  style,
  id,
}: {
  children: ReactNode;
  className?: string;
  arah?: Arah;
  /** Jeda animasi dalam milidetik — untuk efek bertingkat pada daftar. */
  tunda?: number;
  sebagai?: "div" | "li" | "section" | "article" | "aside";
  /** Bagian elemen yang harus terlihat sebelum animasi dipicu (0–1). */
  ambang?: number;
  style?: CSSProperties;
  id?: string;
}) {
  const wadah = useRef<HTMLElement | null>(null);
  const [tampil, setTampil] = useState(false);

  useEffect(() => {
    const el = wadah.current;
    if (!el) return;

    // Peramban tanpa IntersectionObserver: tampilkan langsung.
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("tampil");
      return;
    }

    const pengamat = new IntersectionObserver(
      (masuk) => {
        for (const m of masuk) {
          if (m.isIntersecting) {
            setTampil(true);
            pengamat.disconnect();
          }
        }
      },
      { threshold: ambang, rootMargin: "0px 0px -48px 0px" },
    );

    pengamat.observe(el);
    return () => pengamat.disconnect();
  }, [ambang]);

  const atr = {
    ref: (el: HTMLElement | null) => {
      wadah.current = el;
    },
    id,
    "data-arah": arah,
    style: tunda ? { transitionDelay: `${tunda}ms`, ...style } : style,
    className: cn("muncul", tampil && "tampil", className),
  };

  if (sebagai === "li") return <li {...atr}>{children}</li>;
  if (sebagai === "section") return <section {...atr}>{children}</section>;
  if (sebagai === "article") return <article {...atr}>{children}</article>;
  if (sebagai === "aside") return <aside {...atr}>{children}</aside>;
  return <div {...atr}>{children}</div>;
}

/**
 * Angka yang berhitung naik saat pertama kali terlihat — untuk statistik.
 */
export function AngkaBergulir({
  nilai,
  awalan = "",
  sufiks = "",
  durasi = 1400,
  className,
}: {
  nilai: number;
  awalan?: string;
  sufiks?: string;
  durasi?: number;
  className?: string;
}) {
  const wadah = useRef<HTMLSpanElement>(null);
  const [angka, setAngka] = useState(0);

  useEffect(() => {
    const el = wadah.current;
    if (!el) return;

    let raf = 0;
    let sudahJalan = false;

    const jalankan = () => {
      if (sudahJalan) return;
      sudahJalan = true;

      const kurangGerak =
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
      const total = kurangGerak ? 1 : durasi;
      const awal = performance.now();

      const langkah = (kini: number) => {
        const t = Math.min(1, (kini - awal) / total);
        const halus = 1 - Math.pow(1 - t, 3);
        setAngka(Math.round(nilai * halus));
        if (t < 1) raf = requestAnimationFrame(langkah);
      };
      raf = requestAnimationFrame(langkah);
    };

    if (typeof IntersectionObserver === "undefined") {
      jalankan();
      return () => cancelAnimationFrame(raf);
    }

    const pengamat = new IntersectionObserver(
      (masuk) => {
        for (const m of masuk) {
          if (m.isIntersecting) {
            pengamat.disconnect();
            jalankan();
          }
        }
      },
      { threshold: 0.4 },
    );

    pengamat.observe(el);
    return () => {
      pengamat.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [nilai, durasi]);

  return (
    <span ref={wadah} className={className}>
      {awalan}
      {angka.toLocaleString("id-ID")}
      {sufiks}
    </span>
  );
}
