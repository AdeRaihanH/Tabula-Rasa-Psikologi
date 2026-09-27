"use client";

import Link from "next/link";
import { useActionState } from "react";

import { AlurStatus } from "@/components/dashboard/AlurStatus";
import { JebakanBot } from "@/components/ui/JebakanBot";
import { UnggahBuktiKlien } from "@/components/publik/UnggahBuktiKlien";
import {
  cekStatusPendaftaran,
  type HasilCekStatus,
} from "@/app/actions/pendaftaran";
import { labelStatusPendaftaran } from "@/lib/config";
import { formatRupiah, formatTanggal, formatTanggalWaktu } from "@/lib/utils";

export function FormCekStatus({ sudahLogin = false }: { sudahLogin?: boolean }) {
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
            <span className="flex flex-wrap items-center gap-2">
              <span className="pil bg-brand-600 text-white">
                {labelStatusPendaftaran[hasil.status] ?? hasil.status}
              </span>
              {hasil.pembayaranStatus === "DITOLAK" && (
                <span className="pil bg-red-600 text-white">
                  Bukti Ditolak
                </span>
              )}
            </span>
          </div>

          {/* Banner penolakan — status DITOLAK ditampilkan tegas di sini agar
              tidak terlihat seperti "menunggu pembayaran" biasa. */}
          {hasil.pembayaranStatus === "DITOLAK" && (
            <div className="mt-5 rounded-xl border border-red-300 bg-red-50 p-5">
              <p className="text-sm font-bold text-red-800">
                Bukti pembayaran DITOLAK
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-red-700">
                <span className="font-semibold">Alasan dari admin:</span>{" "}
                {hasil.catatanPembayaran ??
                  "Bukti tidak dapat diverifikasi. Silakan kirim ulang bukti yang jelas."}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-red-700/90">
                Silakan unggah ulang bukti pembayaran yang benar pada kolom di
                bawah ini.
              </p>
            </div>
          )}

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
                Tatap Muka
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
                  Bukti pembayaran sebelumnya ditolak
                  {hasil.catatanPembayaran
                    ? `: ${hasil.catatanPembayaran}`
                    : ". Silakan kirim ulang bukti yang benar ke admin."}
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

              {/* Upload bukti langsung */}
              {hasil.pembayaranId && sudahLogin && (
                <div className="mt-5 border-t border-brand-200 pt-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-700">
                    Unggah Bukti Pembayaran
                  </p>
                  <p className="mt-1 text-xs text-ink-soft">
                    Upload langsung dari sini — tidak perlu kirim ke WA atau email.
                    Admin akan memverifikasi otomatis setelah diterima.
                  </p>
                  <UnggahBuktiKlien
                    pembayaranId={hasil.pembayaranId}
                    status={
                      (hasil.pembayaranStatus as
                        | "MENUNGGU"
                        | "TERVERIFIKASI"
                        | "DITOLAK"
                        | null) ?? null
                    }
                    adaBukti={hasil.buktiAda}
                    catatan={hasil.catatanPembayaran}
                  />
                </div>
              )}

              {/* Belum login — sarankan login */}
              {hasil.pembayaranId && !sudahLogin && (
                <div className="mt-5 rounded-xl border border-brand-200 bg-brand-50/60 p-4">
                  <p className="text-xs font-semibold text-brand-800">
                    💡 Upload bukti lebih mudah dengan akun
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-brand-700">
                    Masuk ke akun Anda untuk mengunggah bukti pembayaran langsung tanpa perlu kirim via WA atau email.
                  </p>
                  <a
                    href={`/masuk?dari=/dashboard/riwayat`}
                    className="tombol tombol-utama mt-3 block w-full text-center !py-2 !text-xs"
                  >
                    Masuk untuk Upload Bukti
                  </a>
                </div>
              )}

            </div>
          )}

          {hasil.pembayaranStatus === "TERVERIFIKASI" && (
            <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-sm font-medium text-emerald-700">
                Pembayaran sudah diverifikasi. Terima kasih.
              </p>
              <p className="mt-1 text-xs leading-relaxed text-emerald-700/90">
                Tautan pengerjaan tes dari asisten tersedia di portal{" "}
                <Link
                  href="/dashboard/riwayat"
                  className="font-semibold underline"
                >
                  Riwayat Pendaftaran
                </Link>{" "}
                dan aktif mengikuti jadwal yang Anda pilih.
              </p>
            </div>
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
