"use client";

import { useActionState } from "react";

import { AlurStatus } from "@/components/dashboard/AlurStatus";
import {
  cekStatusPendaftaran,
  type HasilCekStatus,
} from "@/app/actions/pendaftaran";
import { labelStatusPendaftaran } from "@/lib/config";
import { formatTanggal, formatTanggalWaktu } from "@/lib/utils";

export function FormCekStatus() {
  const [hasil, aksi, pending] = useActionState<HasilCekStatus, FormData>(
    cekStatusPendaftaran,
    undefined,
  );

  return (
    <div>
      <form action={aksi} className="kartu p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="nomor">
              Nomor pendaftaran
            </label>
            <input
              id="nomor"
              name="nomor"
              className="input"
              placeholder="TR-2026-00001"
            />
          </div>
          <div>
            <label className="label" htmlFor="email">
              Email yang didaftarkan
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="input"
              placeholder="nama@email.com"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="tombol tombol-utama mt-5 w-full disabled:opacity-60"
        >
          {pending ? "Memeriksa…" : "Cek status"}
        </button>
      </form>

      {hasil && !hasil.ok && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {hasil.pesan}
        </div>
      )}

      {hasil?.ok && (
        <div className="kartu animasi-naik mt-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">
                Nomor pendaftaran
              </p>
              <p className="mt-1 text-lg font-bold tracking-wide text-ink">
                {hasil.nomor}
              </p>
            </div>
            <span className="pil bg-brand-600 text-white">
              {labelStatusPendaftaran[hasil.status] ?? hasil.status}
            </span>
          </div>

          <dl className="mt-5 space-y-2.5 text-sm">
            <div className="flex justify-between gap-4 border-b border-line pb-2.5">
              <dt className="text-muted">Layanan</dt>
              <dd className="text-right font-medium text-ink">{hasil.layanan}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-line pb-2.5">
              <dt className="text-muted">Tanggal pendaftaran</dt>
              <dd className="text-right font-medium text-ink">
                {formatTanggal(hasil.tanggal)}
              </dd>
            </div>
            {hasil.psikolog && (
              <div className="flex justify-between gap-4 border-b border-line pb-2.5">
                <dt className="text-muted">Psikolog</dt>
                <dd className="text-right font-medium text-ink">{hasil.psikolog}</dd>
              </div>
            )}
            {hasil.jadwal && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Jadwal sesi</dt>
                <dd className="text-right font-medium text-ink">
                  {formatTanggalWaktu(hasil.jadwal)}
                </dd>
              </div>
            )}
          </dl>

          <div className="mt-5">
            <AlurStatus status={hasil.status} />
          </div>

          <p className="mt-5 rounded-xl bg-paper-2 px-4 py-3 text-xs leading-relaxed text-ink-soft">
            Halaman ini hanya menampilkan status administratif. Hasil asesmen
            dan laporan psikolog tidak ditampilkan di sini — keduanya diserahkan
            langsung melalui sesi umpan balik oleh psikolog penanggung jawab.
          </p>
        </div>
      )}
    </div>
  );
}
