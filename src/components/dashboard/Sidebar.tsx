"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Logo } from "@/components/ui/Logo";
import { warnaZona, type ItemNav } from "@/lib/nav-dashboard";
import { labelRole } from "@/lib/config";
import type { Role } from "@/lib/rbac";
import { cn, inisial } from "@/lib/utils";

function Ikon({ nama }: { nama: string }) {
  const umum = {
    width: 17,
    height: 17,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (nama) {
    case "ringkasan":
      return (
        <svg {...umum}>
          <rect x="3" y="3" width="7" height="9" rx="1.5" />
          <rect x="14" y="3" width="7" height="5" rx="1.5" />
          <rect x="14" y="12" width="7" height="9" rx="1.5" />
          <rect x="3" y="16" width="7" height="5" rx="1.5" />
        </svg>
      );
    case "berkas":
      return (
        <svg {...umum}>
          <path d="M14 3v5h5" />
          <path d="M19 21H5V3h9l5 5z" />
        </svg>
      );
    case "orang":
      return (
        <svg {...umum}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6" />
        </svg>
      );
    case "kalender":
      return (
        <svg {...umum}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M8 3v4M16 3v4M3 10h18" />
        </svg>
      );
    case "lembar":
      return (
        <svg {...umum}>
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M8 8h8M8 12h8M8 16h5" />
        </svg>
      );
    case "perisai":
      return (
        <svg {...umum}>
          <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
        </svg>
      );
    case "arsip":
      return (
        <svg {...umum}>
          <rect x="3" y="4" width="18" height="5" rx="1.5" />
          <path d="M5 9v10a1.5 1.5 0 001.5 1.5h11A1.5 1.5 0 0019 19V9M10 13h4" />
        </svg>
      );
    case "atur":
      return (
        <svg {...umum}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-2.9 1.2 2 2 0 11-4 0 1.7 1.7 0 00-2.9-1.2l-.1.1a2 2 0 11-2.8-2.8l.1-.1A1.7 1.7 0 004 15a2 2 0 010-4 1.7 1.7 0 001.2-2.9l-.1-.1a2 2 0 112.8-2.8l.1.1A1.7 1.7 0 0011 4.2a2 2 0 014 0 1.7 1.7 0 002.9 1.2l.1-.1a2 2 0 112.8 2.8l-.1.1A1.7 1.7 0 0020 11a2 2 0 010 4z" />
        </svg>
      );
    default:
      return (
        <svg {...umum}>
          <path d="M4 6h16M4 12h16M4 18h10" />
        </svg>
      );
  }
}

export function Sidebar({
  role,
  nama,
  items,
}: {
  role: Role;
  nama: string;
  items: ItemNav[];
}) {
  const pathname = usePathname();
  const [buka, setBuka] = useState(false);

  const daftar = (
    <nav className="flex flex-col gap-0.5">
      {items.map((item) => {
        const aktif =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setBuka(false)}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              aktif
                ? "bg-brand-600 text-white"
                : "text-ink-soft hover:bg-paper-2 hover:text-ink",
            )}
          >
            <Ikon nama={item.ikon} />
            <span className="flex-1">{item.label}</span>
            {item.zona && (
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: aktif ? "#fff" : warnaZona[item.zona] }}
                title={item.zona}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Bar atas mobile */}
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-paper/90 px-4 backdrop-blur lg:hidden">
        <Logo />
        <button
          type="button"
          onClick={() => setBuka((v) => !v)}
          aria-label="Menu dashboard"
          className="grid h-9 w-9 place-items-center rounded-lg border border-line"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </div>

      {buka && (
        <div className="border-b border-line bg-paper px-4 py-3 lg:hidden">
          {daftar}
          <Link href="/" className="mt-2 block px-3 py-2 text-xs text-muted">
            ← Situs publik
          </Link>
        </div>
      )}

      {/* Sidebar desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-white lg:flex">
        <div className="px-5 py-5">
          <Logo />
        </div>

        <div className="mx-3 mb-4 rounded-xl border border-line bg-paper p-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-600 text-[0.7rem] font-bold text-white">
              {inisial(nama)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-ink">{nama}</p>
              <p className="text-[0.68rem] text-muted">{labelRole[role]}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4">{daftar}</div>

        <div className="border-t border-line p-3">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-muted hover:bg-paper-2 hover:text-ink"
          >
            ← Situs publik
          </Link>
        </div>
      </aside>
    </>
  );
}
