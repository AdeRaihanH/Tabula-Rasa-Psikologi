"use client";

import Image from "next/image";
import { useActionState } from "react";

import {
  siapkanSpreadsheetPsikolog,
  simpanPsikolog,
  type HasilAksi,
} from "@/app/actions/psikolog";

export type DataPsikolog = {
  profilId: string;
  nama: string;
  email: string;
  spesialisasi: string;
  gelar: string;
  sipp: string;
  str: string;
  bio: string;
  pengalaman: number;
  publik: boolean;
  fotoUrl: string;
  driveFolderUrl: string;
  spreadsheetUrl: string | null;
  jumlahKasus: number;
};

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

export function FormPsikolog({
  data,
  driveSiap,
}: {
  data: DataPsikolog;
  driveSiap: boolean;
}) {
  const [hasilSimpan, aksiSimpan, pendingSimpan] = useActionState<
    HasilAksi,
    FormData
  >(simpanPsikolog, undefined);
  const [hasilSheet, aksiSheet, pendingSheet] = useActionState<
    HasilAksi,
    FormData
  >(siapkanSpreadsheetPsikolog, undefined);

  return (
    <div className="kartu p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="relative block h-20 w-20 shrink-0 overflow-hidden rounded-full ring-4 ring-brand-50">
            {data.fotoUrl ? (
              <Image
                src={data.fotoUrl}
                alt={data.nama}
                width={80}
                height={80}
                sizes="80px"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="grid h-full w-full place-items-center bg-brand-100 text-lg font-bold text-brand-700">
                {data.nama.slice(0, 1)}
              </span>
            )}
          </span>
          <div>
            <h2 className="text-base font-bold text-ink">{data.nama}</h2>
            <p className="text-xs text-muted">{data.email}</p>
            <p className="mt-1 text-xs text-ink-soft">
              {data.spesialisasi} · {data.jumlahKasus} kasus
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span
            className="pil"
            style={
              data.publik
                ? { background: "#f0fdf4", color: "#15803d" }
                : { background: "#f8fafc", color: "#475569" }
            }
          >
            {data.publik ? "Tampil di situs" : "Disembunyikan"}
          </span>
          {data.spreadsheetUrl ? (
            <a
              href={data.spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-brand-700 hover:underline"
            >
              Buka spreadsheet arsip ↗
            </a>
          ) : (
            <span className="text-xs text-muted">Spreadsheet belum dibuat</span>
          )}
        </div>
      </div>

      <form action={aksiSimpan} className="mt-5 border-t border-line pt-5">
        <input type="hidden" name="profilId" value={data.profilId} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor={`nama-${data.profilId}`}>
              Nama lengkap
            </label>
            <input
              id={`nama-${data.profilId}`}
              name="nama"
              defaultValue={data.nama}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor={`spesialisasi-${data.profilId}`}>
              Spesialisasi
            </label>
            <input
              id={`spesialisasi-${data.profilId}`}
              name="spesialisasi"
              defaultValue={data.spesialisasi}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor={`foto-${data.profilId}`}>
              Foto (path di folder public)
            </label>
            <input
              id={`foto-${data.profilId}`}
              name="fotoUrl"
              defaultValue={data.fotoUrl}
              placeholder="/psikolog/nama.jpeg"
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor={`folder-${data.profilId}`}>
              Tautan folder Google Drive psikolog
            </label>
            <input
              id={`folder-${data.profilId}`}
              name="driveFolderUrl"
              defaultValue={data.driveFolderUrl}
              placeholder="https://drive.google.com/drive/folders/..."
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor={`gelar-${data.profilId}`}>
              Gelar
            </label>
            <input
              id={`gelar-${data.profilId}`}
              name="gelar"
              defaultValue={data.gelar}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor={`pengalaman-${data.profilId}`}>
              Pengalaman (tahun)
            </label>
            <input
              id={`pengalaman-${data.profilId}`}
              name="pengalaman"
              type="number"
              min="0"
              defaultValue={data.pengalaman}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor={`sipp-${data.profilId}`}>
              Nomor SIPP
            </label>
            <input
              id={`sipp-${data.profilId}`}
              name="sipp"
              defaultValue={data.sipp}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor={`str-${data.profilId}`}>
              Nomor STR
            </label>
            <input
              id={`str-${data.profilId}`}
              name="str"
              defaultValue={data.str}
              className="input"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor={`bio-${data.profilId}`}>
              Bio singkat
            </label>
            <textarea
              id={`bio-${data.profilId}`}
              name="bio"
              rows={3}
              defaultValue={data.bio}
              className="input"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-soft sm:col-span-2">
            <input
              type="checkbox"
              name="publik"
              defaultChecked={data.publik}
              className="h-4 w-4 accent-brand-600"
            />
            Tampilkan profil di halaman publik /tim
          </label>
        </div>

        <button
          type="submit"
          disabled={pendingSimpan}
          className="tombol tombol-utama mt-5 !py-2 !text-xs disabled:opacity-60"
        >
          {pendingSimpan ? "Menyimpan…" : "Simpan profil"}
        </button>
        <Pesan hasil={hasilSimpan} />
      </form>

      <form action={aksiSheet} className="mt-4 border-t border-line pt-4">
        <input type="hidden" name="profilId" value={data.profilId} />
        <button
          disabled={pendingSheet || !driveSiap}
          className="tombol tombol-garis w-full !py-2 !text-xs disabled:opacity-50"
        >
          {pendingSheet
            ? "Menyiapkan…"
            : data.spreadsheetUrl
              ? "Buka ulang / perbarui spreadsheet arsip"
              : "Siapkan spreadsheet arsip psikolog"}
        </button>
        <p className="mt-2 text-[0.68rem] text-muted">
          Spreadsheet ini menampung hasil pendaftaran yang memilih psikolog ini.
        </p>
        <Pesan hasil={hasilSheet} />
      </form>
    </div>
  );
}
