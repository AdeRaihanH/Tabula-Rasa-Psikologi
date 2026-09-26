"use client";

import { useActionState } from "react";

import { simpanLayanan, type HasilLayanan } from "@/app/actions/layanan";

export type DataLayanan = {
  id: string;
  nama: string;
  slug: string;
  kategori: string;
  metode: string[];
  durasiMenit: number | null;
  hargaOnline: number | null;
  hargaOffline: number | null;
  aktif: boolean;
  jumlahPendaftar: number;
};

function Pesan({ hasil }: { hasil: HasilLayanan }) {
  if (!hasil) return null;
  return (
    <p
      className={`mt-2 text-xs ${
        hasil.ok ? "text-emerald-700" : "text-red-700"
      }`}
    >
      {hasil.pesan}
    </p>
  );
}

export function FormHargaLayanan({ data }: { data: DataLayanan }) {
  const [hasil, aksi, pending] = useActionState<HasilLayanan, FormData>(
    simpanLayanan,
    undefined,
  );

  const bisaOnline = data.metode.includes("ONLINE");
  const bisaOffline = data.metode.includes("OFFLINE");

  return (
    <form action={aksi} className="kartu p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-ink">{data.nama}</h2>
          <p className="mt-0.5 text-xs text-muted">
            /{data.slug} · {data.kategori}
            {data.durasiMenit ? ` · ${data.durasiMenit} menit` : ""} ·{" "}
            {data.jumlahPendaftar} pendaftar
          </p>
        </div>
        <span
          className="pil"
          style={
            data.aktif
              ? { background: "#f0fdf4", color: "#15803d" }
              : { background: "#f8fafc", color: "#475569" }
          }
        >
          {data.aktif ? "Aktif" : "Nonaktif"}
        </span>
      </div>

      <input type="hidden" name="id" value={data.id} />

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor={`online-${data.id}`}>
            Harga daring (Rp)
          </label>
          <input
            id={`online-${data.id}`}
            name="hargaOnline"
            inputMode="numeric"
            disabled={!bisaOnline}
            defaultValue={data.hargaOnline ?? ""}
            placeholder={bisaOnline ? "375000" : "tidak tersedia"}
            className="input disabled:bg-paper-2 disabled:text-muted"
          />
          {!bisaOnline && (
            <p className="mt-1 text-[0.68rem] text-muted">
              Layanan ini tidak menyediakan metode daring.
            </p>
          )}
        </div>
        <div>
          <label className="label" htmlFor={`offline-${data.id}`}>
            Harga tatap muka (Rp)
          </label>
          <input
            id={`offline-${data.id}`}
            name="hargaOffline"
            inputMode="numeric"
            disabled={!bisaOffline}
            defaultValue={data.hargaOffline ?? ""}
            placeholder={bisaOffline ? "545000" : "tidak tersedia"}
            className="input disabled:bg-paper-2 disabled:text-muted"
          />
          {!bisaOffline && (
            <p className="mt-1 text-[0.68rem] text-muted">
              Layanan ini hanya tatap muka.
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <label className="flex items-center gap-2 text-xs text-ink-soft">
          <input
            type="checkbox"
            name="aktif"
            defaultChecked={data.aktif}
            className="h-4 w-4 accent-brand-600"
          />
          Tampilkan di situs publik
        </label>
        <button
          type="submit"
          disabled={pending}
          className="tombol tombol-utama ml-auto !py-2 !text-xs disabled:opacity-60"
        >
          {pending ? "Menyimpan…" : "Simpan harga"}
        </button>
      </div>

      <p className="mt-2 text-[0.68rem] leading-relaxed text-muted">
        Kosongkan bila biaya belum ditetapkan (mis. program korporasi). Nominal
        ini otomatis menjadi tagihan saat klien mendaftar.
      </p>
      <Pesan hasil={hasil} />
    </form>
  );
}
