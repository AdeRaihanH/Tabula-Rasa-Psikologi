import type { ReactNode } from "react";

import { infoZona } from "@/lib/rbac";
import { cn } from "@/lib/utils";

export function JudulHalaman({
  judul,
  keterangan,
  aksi,
}: {
  judul: string;
  keterangan?: string;
  aksi?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">{judul}</h1>
        {keterangan && (
          <p className="mt-1.5 max-w-2xl text-sm text-ink-soft">{keterangan}</p>
        )}
      </div>
      {aksi}
    </div>
  );
}

export function KartuStat({
  label,
  nilai,
  catatan,
  warna,
}: {
  label: string;
  nilai: string | number;
  catatan?: string;
  warna?: string;
}) {
  return (
    <div className="kartu p-5">
      <div className="flex items-center gap-2">
        {warna && (
          <span className="h-2 w-2 rounded-full" style={{ background: warna }} />
        )}
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
          {label}
        </p>
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight text-ink">{nilai}</p>
      {catatan && <p className="mt-1 text-xs text-muted">{catatan}</p>}
    </div>
  );
}

const warnaStatus: Record<string, { bg: string; fg: string }> = {
  BARU: { bg: "#eff6ff", fg: "#1d4ed8" },
  SKRINING: { bg: "#fffbeb", fg: "#b45309" },
  MENUNGGU_PEMBAYARAN: { bg: "#fff7ed", fg: "#c2410c" },
  TERVERIFIKASI: { bg: "#ecfdf5", fg: "#047857" },
  TERJADWAL: { bg: "#f0fdfa", fg: "#0f766e" },
  PELAKSANAAN: { bg: "#eef2ff", fg: "#4338ca" },
  PENGOLAHAN_DATA: { bg: "#f5f3ff", fg: "#6d28d9" },
  SELESAI: { bg: "#f0fdf4", fg: "#15803d" },
  DIBATALKAN: { bg: "#fef2f2", fg: "#b91c1c" },
  MENUNGGU: { bg: "#fffbeb", fg: "#b45309" },
  DITOLAK: { bg: "#fef2f2", fg: "#b91c1c" },
  DRAFT: { bg: "#f8fafc", fg: "#475569" },
  FINAL: { bg: "#f0fdf4", fg: "#15803d" },
};

export function BadgeStatus({ status, label }: { status: string; label: string }) {
  const w = warnaStatus[status] ?? { bg: "#f8fafc", fg: "#475569" };
  return (
    <span
      className="pil"
      style={{ background: w.bg, color: w.fg, borderColor: w.bg }}
    >
      {label}
    </span>
  );
}

export function BadgeZona({ zona }: { zona: "ZONA_1" | "ZONA_2" | "ZONA_3" }) {
  const info = infoZona[zona];
  return (
    <span
      className="pil"
      style={{
        background: `${info.warna}14`,
        color: info.warna,
        borderColor: `${info.warna}33`,
      }}
      title={info.isi}
    >
      {zona.replace("_", " ")}
    </span>
  );
}

export function Kosong({
  judul,
  keterangan,
  aksi,
}: {
  judul: string;
  keterangan?: string;
  aksi?: ReactNode;
}) {
  return (
    <div className="kartu flex flex-col items-center px-6 py-14 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-paper-2 text-muted">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M4 7h16M4 12h16M4 17h10" strokeLinecap="round" />
        </svg>
      </span>
      <p className="mt-4 font-semibold text-ink">{judul}</p>
      {keterangan && (
        <p className="mt-1.5 max-w-sm text-sm text-ink-soft">{keterangan}</p>
      )}
      {aksi && <div className="mt-5">{aksi}</div>}
    </div>
  );
}

export function Tabel({ children }: { children: ReactNode }) {
  return (
    <div className="kartu overflow-x-auto">
      <table className="w-full min-w-[44rem] border-collapse text-sm">{children}</table>
    </div>
  );
}

export function Th({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "border-b border-line bg-paper-2/60 px-4 py-3 text-left text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-muted",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <td className={cn("border-b border-line px-4 py-3 align-middle text-ink-soft", className)}>
      {children}
    </td>
  );
}
