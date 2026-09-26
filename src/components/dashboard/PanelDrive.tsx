"use client";

import { useActionState } from "react";

import {
  buatFolderDrive,
  unggahBuktiPembayaran,
  unggahDokumenPendaftaran,
  type HasilDriveAksi,
} from "@/app/actions/drive";

function Pesan({ hasil }: { hasil: HasilDriveAksi }) {
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

export function PanelDrive({
  pendaftaranId,
  folderUrl,
  driveSiap,
}: {
  pendaftaranId: string;
  folderUrl: string | null;
  driveSiap: boolean;
}) {
  const [hasilFolder, aksiFolder, pendingFolder] = useActionState<
    HasilDriveAksi,
    FormData
  >(buatFolderDrive, undefined);
  const [hasilDok, aksiDok, pendingDok] = useActionState<HasilDriveAksi, FormData>(
    unggahDokumenPendaftaran,
    undefined,
  );

  return (
    <section className="kartu p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-ink-soft">
          Arsip Google Drive
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

      {folderUrl ? (
        <a
          href={folderUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-line bg-paper-2 px-4 py-3 text-sm font-medium text-ink transition-colors hover:border-brand-300"
        >
          Buka folder arsip kasus ini
          <span className="text-brand-600">↗</span>
        </a>
      ) : (
        <p className="mt-3 text-xs leading-relaxed text-ink-soft">
          Folder arsip belum dibuat. Folder ini dipakai untuk menyimpan ringkasan
          pendaftaran, bukti pembayaran, dan dokumen kasus.
        </p>
      )}

      <form action={aksiFolder} className="mt-4">
        <input type="hidden" name="pendaftaranId" value={pendaftaranId} />
        <button
          disabled={pendingFolder || !driveSiap}
          className="tombol tombol-garis w-full disabled:opacity-50"
        >
          {pendingFolder
            ? "Menyiapkan…"
            : folderUrl
              ? "Sinkronkan folder Drive"
              : "Buat folder arsip di Drive"}
        </button>
      </form>
      <Pesan hasil={hasilFolder} />

      {driveSiap && (
        <form action={aksiDok} className="mt-5 border-t border-line pt-5">
          <input type="hidden" name="pendaftaranId" value={pendaftaranId} />
          <label className="label" htmlFor="berkas">
            Unggah dokumen ke folder kasus
          </label>
          <input
            id="berkas"
            name="berkas"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
            className="input !py-1.5 !text-xs file:mr-3 file:rounded-md file:border-0 file:bg-paper-2 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-ink-soft"
          />
          <button
            disabled={pendingDok}
            className="tombol tombol-utama mt-3 w-full !py-2 !text-xs disabled:opacity-60"
          >
            {pendingDok ? "Mengunggah…" : "Unggah dokumen"}
          </button>
          <p className="mt-2 text-[0.68rem] text-muted">
            Maksimal 8 MB per berkas. Tautan tersimpan otomatis pada folder kasus.
          </p>
          <Pesan hasil={hasilDok} />
        </form>
      )}
    </section>
  );
}

export function UnggahBukti({
  pembayaranId,
  buktiUrl,
  driveSiap,
}: {
  pembayaranId: string;
  buktiUrl: string | null;
  driveSiap: boolean;
}) {
  const [hasil, aksi, pending] = useActionState<HasilDriveAksi, FormData>(
    unggahBuktiPembayaran,
    undefined,
  );

  return (
    <div className="mt-2">
      {buktiUrl && (
        <a
          href={buktiUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[0.7rem] font-semibold text-brand-700 hover:underline"
        >
          Lihat bukti ↗
        </a>
      )}

      {driveSiap && (
        <form action={aksi} className="mt-2 flex flex-wrap items-center gap-1.5">
          <input type="hidden" name="pembayaranId" value={pembayaranId} />
          <input
            name="berkas"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="w-40 text-[0.68rem] file:mr-2 file:rounded file:border-0 file:bg-paper-2 file:px-2 file:py-1 file:text-[0.68rem] file:text-ink-soft"
          />
          <button
            disabled={pending}
            className="pil bg-brand-50 text-brand-700 disabled:opacity-50"
          >
            {pending ? "…" : "Unggah"}
          </button>
        </form>
      )}

      <Pesan hasil={hasil} />
    </div>
  );
}
