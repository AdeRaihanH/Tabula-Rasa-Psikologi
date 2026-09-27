"use client";

import { useActionState, useState } from "react";

import { unggahBuktiKlien, type HasilUnggahBukti } from "@/app/actions/akun";
import { PratinjauBukti } from "@/components/dashboard/PratinjauBukti";

export function UnggahBuktiKlien({
  pembayaranId,
  status,
  adaBukti,
  catatan = null,
}: {
  pembayaranId: string;
  status: "MENUNGGU" | "TERVERIFIKASI" | "DITOLAK";
  adaBukti: boolean;
  catatan?: string | null;
}) {
  const [hasil, aksi, pending] = useActionState<HasilUnggahBukti, FormData>(
    unggahBuktiKlien,
    undefined,
  );

  // Penghitung kiriman untuk cache-buster pratinjau: setiap percobaan unggah
  // memakai query `?t=` baru agar gambar lama tidak tampil dari cache.
  // (Diperbarui di event handler, bukan di effect.)
  const [unggahanKe, setUnggahanKe] = useState(0);

  // Aturan tampil:
  // - Sudah unggah & MENUNGGU  → sembunyikan form, tampilkan status + pratinjau.
  // - TERVERIFIKASI            → sembunyikan form.
  // - DITOLAK / belum ada bukti → tampilkan form (kirim / kirim ulang).
  const sudahKirimMenunggu = status === "MENUNGGU" && adaBukti;
  const sudahTerverifikasi = status === "TERVERIFIKASI";
  const ditolak = status === "DITOLAK";
  const tampilForm = !sudahKirimMenunggu && !sudahTerverifikasi;

  return (
    <div className="mt-4 border-t border-line pt-4">
      {adaBukti && (
        <PratinjauBukti
          pembayaranId={pembayaranId}
          t={unggahanKe > 0 ? String(unggahanKe) : ""}
          tampilMini
        />
      )}

      {sudahTerverifikasi && (
        <p className="mt-2 text-xs text-emerald-700">
          Pembayaran sudah diverifikasi. Tidak perlu mengunggah ulang.
        </p>
      )}

      {sudahKirimMenunggu && (
        <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
          Bukti Anda sudah diterima dan sedang diverifikasi admin. Tidak perlu
          mengunggah ulang kecuali diminta.
        </p>
      )}

      {tampilForm && (
        <form action={aksi} onSubmit={() => setUnggahanKe((n) => n + 1)} className="mt-3">
          {ditolak && (
            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-700">
              <p className="font-bold">Bukti pembayaran DITOLAK.</p>
              <p className="mt-1">
                <span className="font-semibold">Alasan dari admin:</span>{" "}
                {catatan ??
                  "Bukti tidak dapat diverifikasi. Silakan kirim ulang bukti yang jelas."}
              </p>
              <p className="mt-1 font-medium">
                Silakan unggah ulang bukti yang benar di bawah ini.
              </p>
            </div>
          )}
          <input type="hidden" name="pembayaranId" value={pembayaranId} />
          <label className="label" htmlFor={`bukti-${pembayaranId}`}>
            {ditolak ? "Unggah ulang bukti pembayaran" : "Unggah bukti pembayaran"}
          </label>
          <input
            id={`bukti-${pembayaranId}`}
            name="berkas"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className="input !py-1.5 !text-xs file:mr-3 file:rounded-md file:border-0 file:bg-paper-2 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-ink-soft"
          />
          <button
            type="submit"
            disabled={pending}
            className="tombol tombol-utama mt-3 w-full !py-2 !text-xs disabled:opacity-60"
          >
            {pending
              ? "Mengunggah…"
              : ditolak
                ? "Kirim ulang bukti pembayaran"
                : "Kirim bukti pembayaran"}
          </button>
          <p className="mt-2 text-[0.68rem] text-muted">
            Format PDF/JPG/PNG/WEBP, maksimal 8 MB. Bukti akan diverifikasi admin.
          </p>
        </form>
      )}

      {hasil && (
        <p
          className={`mt-3 rounded-lg border px-3 py-2 text-xs ${
            hasil.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {hasil.pesan}
        </p>
      )}
    </div>
  );
}
