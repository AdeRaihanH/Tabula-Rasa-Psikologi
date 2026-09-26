import Link from "next/link";

import { siteConfig } from "@/lib/config";

export function Logo({
  terang = false,
  nama = siteConfig.nama,
}: {
  terang?: boolean;
  nama?: string;
}) {
  return (
    <Link href="/" className="flex items-center gap-2.5 group">
      <span
        className="grid h-9 w-9 place-items-center rounded-xl shrink-0 transition-transform group-hover:-rotate-6"
        style={{
          background: terang ? "rgba(255,255,255,0.14)" : "var(--color-brand-600)",
        }}
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M6 3.5h9.5L20 8v12.5H6z"
            stroke={terang ? "#fff" : "#eef7f5"}
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M15 3.5V8h5"
            stroke={terang ? "#fff" : "#eef7f5"}
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M9 12.5h7M9 16h5"
            stroke={terang ? "#c98a4b" : "#ddba86"}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span
          className="text-[1.05rem] font-bold tracking-tight"
          style={{ color: terang ? "#fff" : "var(--color-ink)" }}
        >
          {nama}
        </span>
        <span
          className="text-[0.62rem] font-semibold tracking-[0.16em] uppercase"
          style={{ color: terang ? "rgba(255,255,255,0.6)" : "var(--color-muted)" }}
        >
          Biro Psikologi
        </span>
      </span>
    </Link>
  );
}
