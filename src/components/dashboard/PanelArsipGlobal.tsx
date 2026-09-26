"use client";

import { useActionState } from "react";

import {
  siapkanSpreadsheetKlien,
  sinkronAdmin,
  type HasilAksi,
} from "@/app/actions/psikolog";

function Pesan({ hasil }: { hasil: HasilAksi }) {
  if (!hasil) return null;
  return (
    <p
      className={`mt-3 rounded-lg border px-3 py-2 text-xs ${
        hasil.ok
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      {hasil.pesan}
    </p>
  );
}

export function PanelArsipGlobal({
  driveSiap,
  clientSheetUrl,
  adminFolderUrl,
  clientFolderUrl,
}: {
  driveSiap: boolean;
  clientSheetUrl: string | null;
  adminFolderUrl: string | null;
  clientFolderUrl: string | null;
}) {
  const [hasilKlien, aksiKlien, pendingKlien] = useActionState<HasilAksi, FormData>(
    siapkanSpreadsheetKlien,
    undefined,
  );
  const [hasilAdmin, aksiAdmin, pendingAdmin] = useActionState<HasilAksi, FormData>(
    sinkronAdmin,
    undefined,
  );

  return (
    <div className="kartu p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-ink-soft">
          Arsip Digital Keseluruhan
        </h2>
        <span
          className="pil"
          style={
            driveSiap
              ? { background: "#f0fdf4", color: "#15803d" }
              : { background: "#fffbeb", color: "#b45309" }
          }
        >
          {driveSiap ? "Terhubung" : "Belum dikonfigurasi"}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-line bg-paper-2 p-4">
          <p className="text-xs font-semibold text-ink">Data keseluruhan klien</p>
          <p className="mt-1 text-[0.7rem] leading-relaxed text-ink-soft">
            Spreadsheet master berisi seluruh pendaftaran dari semua psikolog.
          </p>
          {clientSheetUrl && (
            <a
              href={clientSheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-xs font-semibold text-brand-700 hover:underline"
            >
              Buka spreadsheet master ↗
            </a>
          )}
          {clientFolderUrl && (
            <a
              href={clientFolderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-3 mt-2 inline-block text-xs font-semibold text-brand-700 hover:underline"
            >
              Folder Data Klien ↗
            </a>
          )}
          <form action={aksiKlien} className="mt-3">
            <button
              disabled={pendingKlien || !driveSiap}
              className="tombol tombol-garis w-full !py-2 !text-xs disabled:opacity-50"
            >
              {pendingKlien
                ? "Menyiapkan…"
                : clientSheetUrl
                  ? "Perbarui spreadsheet master"
                  : "Siapkan spreadsheet master klien"}
            </button>
          </form>
          <Pesan hasil={hasilKlien} />
        </div>

        <div className="rounded-xl border border-line bg-paper-2 p-4">
          <p className="text-xs font-semibold text-ink">
            Folder admin (melihat semua)
          </p>
          <p className="mt-1 text-[0.7rem] leading-relaxed text-ink-soft">
            Berisi tautan pintas ke folder tiap psikolog dan folder data klien.
          </p>
          {adminFolderUrl && (
            <a
              href={adminFolderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-xs font-semibold text-brand-700 hover:underline"
            >
              Buka folder admin ↗
            </a>
          )}
          <form action={aksiAdmin} className="mt-3">
            <button
              disabled={pendingAdmin || !driveSiap}
              className="tombol tombol-garis w-full !py-2 !text-xs disabled:opacity-50"
            >
              {pendingAdmin ? "Menyinkronkan…" : "Sinkronkan tautan folder admin"}
            </button>
          </form>
          <Pesan hasil={hasilAdmin} />
        </div>
      </div>
    </div>
  );
}
