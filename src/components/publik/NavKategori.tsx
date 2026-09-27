"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Navigasi kategori layanan yang menempel di atas saat digulir dan
 * menyorot kategori yang sedang terlihat.
 */
export function NavKategori({
  item,
}: {
  item: readonly { id: string; label: string }[];
}) {
  const [aktif, setAktif] = useState(item[0]?.id ?? "");

  useEffect(() => {
    const ids = item.map((i) => i.id);
    if (ids.length === 0) return;

    let raf = 0;
    const hitung = () => {
      raf = 0;
      let sekarang = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 160) sekarang = id;
      }
      setAktif(sekarang);
    };
    const saatGulir = () => {
      if (!raf) raf = requestAnimationFrame(hitung);
    };

    hitung();
    window.addEventListener("scroll", saatGulir, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", saatGulir);
    };
  }, [item]);

  return (
    <nav className="flex flex-wrap gap-2">
      {item.map((i) => (
        <a
          key={i.id}
          href={`#${i.id}`}
          aria-current={aktif === i.id}
          className={cn(
            "pil border transition-all duration-200",
            aktif === i.id
              ? "border-brand-700 bg-brand-700 text-white"
              : "border-line bg-white text-ink-soft hover:border-brand-300 hover:text-brand-700",
          )}
        >
          {i.label}
        </a>
      ))}
    </nav>
  );
}
