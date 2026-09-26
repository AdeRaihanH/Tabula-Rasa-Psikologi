"use client";

import { useActionState } from "react";

import {
  rapikanSemuaAksi,
  rapikanSpreadsheetKlienAksi,
  siapkanSpreadsheetKlien,
  simpanSpreadsheetKlien,
  sinkronAdmin,
  ujiSpreadsheetKlien,
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
  bisaBuat,
  clientSheetUrl,
  adminFolderUrl,
  clientFolderUrl,
}: {
  driveSiap: boolean;
  bisaBuat: boolean;
  clientSheetUrl: string | null;
  adminFolderUrl: string | null;
  clientFolderUrl: string | null;
}) {
  const [hasilSimpan, aksiSimpan, pendingSimpan] = useActionState<HasilAksi, FormData>(
    simpanSpreadsheetKlien,
    undefined,
  );
  const [hasilKlien, aksiKlien, pendingKlien] = useActionState<HasilAksi, FormData>(
    ujiSpreadsheetKlien,
    undefined,
  );
  const [hasilBuat, aksiBuat, pendingBuat] = useActionState<HasilAksi, FormData>(
    siapkanSpreadsheetKlien,
    undefined,
  );
  const [hasilAdmin, aksiAdmin, pendingAdmin] = useActionState<HasilAksi, FormData>(
    sinkronAdmin,
    undefined,
  );
  const [hasilRapiMaster, aksiRapiMaster, pendingRapiMaster] = useActionState<
    HasilAksi,
    FormData
  >(rapikanSpreadsheetKlienAksi, undefined);
  const [hasilRapiSemua, aksiRapiSemua, pendingRapiSemua] = useActionState<
    HasilAksi,
    FormData
  >(rapikanSemuaAksi, undefined);

  return (
    <div className="kartu p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-ink-soft">
          Arsip Digital Keseluruhan
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="pil"
            style={
              driveSiap
                ? { background: "#f0fdf4", color: "#15803d" }
                : { background: "#fffbeb", color: "#b45309" }
            }
          >
            {driveSiap
              ? bisaBuat
                ? "Terhubung (OAuth)"
                : "Terhubung (terbatas)"
              : "Belum dikonfigurasi"}
          </span>
          <form action={aksiRapiSemua}>
            <button
              disabled={pendingRapiSemua}
              className="tombol tombol-utama !py-1.5 !text-xs disabled:opacity-60"
            >
              {pendingRapiSemua ? "Merapikan…" : "Rapikan semua tabel"}
            </button>
          </form>
        </div>
      </div>

      <Pesan hasil={hasilRapiSemua} />

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-line bg-paper-2 p-4">
          <p className="text-xs font-semibold text-ink">
            Spreadsheet master — data keseluruhan klien
          </p>
          <p className="mt-1 text-[0.7rem] leading-relaxed text-ink-soft">
            Semua pendaftaran dari seluruh psikolog ditambahkan ke spreadsheet
            ini. Buat Google Spreadsheet, lalu{" "}
            <strong>Share → Editor</strong> ke email service account.
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

          <form action={aksiSimpan} className="mt-3">
            <input
              name="spreadsheetUrl"
              defaultValue={clientSheetUrl ?? ""}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className="input !py-1.5 !text-xs"
            />
            <button
              disabled={pendingSimpan}
              className="tombol tombol-utama mt-2 w-full !py-2 !text-xs disabled:opacity-60"
            >
              {pendingSimpan ? "Menyimpan…" : "Simpan tautan spreadsheet master"}
            </button>
          </form>
          <Pesan hasil={hasilSimpan} />

          <div className="mt-3 flex flex-wrap gap-2">
            <form action={aksiKlien}>
              <button
                disabled={pendingKlien || !clientSheetUrl}
                className="tombol tombol-garis !py-2 !text-xs disabled:opacity-50"
              >
                {pendingKlien ? "Menguji…" : "Uji tulis baris"}
              </button>
            </form>

            <form action={aksiRapiMaster}>
              <button
                disabled={pendingRapiMaster || !clientSheetUrl}
                className="tombol tombol-garis !py-2 !text-xs disabled:opacity-50"
              >
                {pendingRapiMaster ? "Merapikan…" : "Rapikan tabel"}
              </button>
            </form>

            {bisaBuat && (
              <form action={aksiBuat}>
                <button
                  disabled={pendingBuat}
                  className="tombol tombol-garis !py-2 !text-xs disabled:opacity-50"
                >
                  {pendingBuat ? "Membuat…" : "Buat otomatis"}
                </button>
              </form>
            )}
          </div>
          <Pesan hasil={hasilKlien} />
          <Pesan hasil={hasilRapiMaster} />
          <Pesan hasil={hasilBuat} />
        </div>

        <div className="rounded-xl border border-line bg-paper-2 p-4">
          <p className="text-xs font-semibold text-ink">
            Folder admin (melihat semua)
          </p>
          <p className="mt-1 text-[0.7rem] leading-relaxed text-ink-soft">
            Berisi tautan pintas ke folder tiap psikolog dan folder data klien.
            {!bisaBuat && " Memerlukan mode OAuth akun biro."}
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
          <form action={aksiAdmin} className="mt-3">
            <button
              disabled={pendingAdmin || !bisaBuat}
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
