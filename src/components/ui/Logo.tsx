import Link from "next/link";

import { siteConfig } from "@/lib/config";

/** Ikon brain+leaf — logo SVG Tabula Rasa */
function IkonLogo({ terang }: { terang: boolean }) {
  const c = terang ? "#ffffff" : "#22612a"; // warna garis
  const c2 = terang ? "rgba(255,255,255,0.55)" : "#5da464"; // aksen
  return (
    <svg width="26" height="26" viewBox="0 0 40 40" fill="none" aria-hidden>
      {/* Leaf kiri */}
      <path
        d="M20 36 C10 30 5 22 7 13 C9 6 14 4 20 4"
        stroke={c}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Leaf kanan */}
      <path
        d="M20 36 C30 30 35 22 33 13 C31 6 26 4 20 4"
        stroke={c}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Vena tengah */}
      <path
        d="M20 4 L20 36"
        stroke={c2}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeDasharray="2 4"
      />
      {/* Kurva otak kiri */}
      <path
        d="M11 16 C8 14 8 10 12 10 C10 8 14 7 15 10"
        stroke={c}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Kurva otak kanan */}
      <path
        d="M29 16 C32 14 32 10 28 10 C30 8 26 7 25 10"
        stroke={c}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({
  terang = false,
  nama = siteConfig.nama,
}: {
  terang?: boolean;
  nama?: string;
}) {
  return (
    <Link href="/" className="group flex items-center gap-3">
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-all duration-200 group-hover:scale-105"
        style={{
          background: terang
            ? "rgba(255,255,255,0.15)"
            : "var(--color-brand-700)",
          boxShadow: terang
            ? "0 1px 8px rgba(0,0,0,0.18)"
            : "0 2px 8px rgba(34,97,42,0.25)",
        }}
      >
        <IkonLogo terang={terang} />
      </span>
      <span className="flex flex-col leading-none">
        <span
          className="text-[1.05rem] font-bold tracking-tight"
          style={{ color: terang ? "#fff" : "var(--color-ink)" }}
        >
          {nama}
        </span>
        <span
          className="text-[0.6rem] font-semibold uppercase tracking-[0.18em]"
          style={{
            color: terang ? "rgba(255,255,255,0.55)" : "var(--color-muted)",
          }}
        >
          Biro Psikologi
        </span>
      </span>
    </Link>
  );
}
