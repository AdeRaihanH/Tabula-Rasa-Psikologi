"use client";

import { useActionState } from "react";

import { AlurStatus } from "@/components/dashboard/AlurStatus";
import { JebakanBot } from "@/components/ui/JebakanBot";
import {
  cekStatusPendaftaran,
  type HasilCekStatus,
} from "@/app/actions/pendaftaran";
import { labelStatusPendaftaran } from "@/lib/config";
import { formatRupiah, formatTanggal, formatTanggalWaktu } from "@/lib/utils";

export function FormCekStatus() {
  const [hasil, aksi, pending] = useActionState<HasilCekStatus, FormData>(
    cekStatusPendaftaran,
    undefined,
  );

  return (
    <div>
      <form action={aksi} className="kartu p-6">
        <JebakanBot />
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="pil bg-sage-100 text-sage-600">
            Tanpa login
          </span>
          <p className="text-xs text-muted">
            Cukup nomor pendaftaran dan email — tidak perlu membuat akun.
          </p>
        </div>
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
            <div className="flex justify-between gap-4 border-b border-line pb-2.5">
              <dt className="text-muted">Metode</dt>
              <dd className="text-right font-medium text-ink">
                {hasil.metode === "ONLINE" ? "Daring" : "Tatap muka"}
              </dd>
            </div>
            {hasil.jadwal && (
              <div className="flex justify-between gap-4 border-b border-line pb-2.5">
                <dt className="text-muted">Jadwal sesi</dt>
                <dd className="text-right font-medium text-ink">
                  {formatTanggalWaktu(hasil.jadwal)}
                </dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Biaya layanan</dt>
              <dd className="text-right text-base font-bold text-brand-700">
                {hasil.biaya ? formatRupiah(hasil.biaya) : "Menunggu konfirmasi admin"}
              </dd>
            </div>
          </dl>

          {/* Instruksi pembayaran */}
          {hasil.biaya && hasil.pembayaranStatus !== "TERVERIFIKASI" && (
            <div className="mt-5 rounded-xl border border-brand-200 bg-brand-50/60 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-700">
                Pembayaran
              </p>

              {hasil.pembayaranStatus === "DITOLAK" && (
                <p className="mt-2 text-sm font-medium text-red-700">
                  Bukti pembayaran sebelumnya ditolak. Silakan kirim ulang bukti
                  yang benar ke admin.
                </p>
              )}

              {hasil.rekening.bank && hasil.rekening.nomor && (
                <div className="mt-3 rounded-lg bg-white p-4">
                  <p className="font-bold text-ink">{hasil.rekening.bank}</p>
                  <p className="mt-1 font-mono text-lg font-bold tracking-wider text-brand-700">
                    {hasil.rekening.nomor}
                  </p>
                  {hasil.rekening.atasNama && (
                    <p className="mt-1 text-xs text-ink-soft">
                      a.n. {hasil.rekening.atasNama}
                    </p>
                  )}
                </div>
              )}

              <p className="mt-3 text-xs leading-relaxed text-ink-soft">
                {hasil.rekening.instruksi ??
                  "Transfer sesuai nominal, lalu kirim bukti transfer ke admin dengan menyebutkan nomor pendaftaran Anda."}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {hasil.whatsapp && (
                  <a
                    href={`https://wa.me/${hasil.whatsapp}?text=${encodeURIComponent(
                      `Halo, saya ingin mengirim bukti pembayaran untuk pendaftaran ${hasil.nomor}.`,
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tombol tombol-sage !py-2 !text-xs"
                  >
                    Kirim bukti via WhatsApp
                  </a>
                )}
                {hasil.email && (
                  <a
                    href={`mailto:${hasil.email}?subject=${encodeURIComponent(
                      `Bukti pembayaran ${hasil.nomor}`,
                    )}`}
                    className="tombol tombol-garis !py-2 !text-xs"
                  >
                    Kirim via Email
                  </a>
                )}
              </div>
            </div>
          )}

          {hasil.pembayaranStatus === "TERVERIFIKASI" && (
            <p className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              Pembayaran sudah diverifikasi. Terima kasih.
            </p>
          )}

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
