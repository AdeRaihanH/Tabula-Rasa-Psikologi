"use client";

import { useActionState } from "react";

import { unggahBuktiKlien, type HasilUnggahBukti } from "@/app/actions/akun";

export function UnggahBuktiKlien({
  pembayaranId,
  buktiUrl,
  driveSiap,
  sudahTerverifikasi,
}: {
  pembayaranId: string;
  buktiUrl: string | null;
  driveSiap: boolean;
  sudahTerverifikasi: boolean;
}) {
  const [hasil, aksi, pending] = useActionState<HasilUnggahBukti, FormData>(
    unggahBuktiKlien,
    undefined,
  );

  return (
    <div className="mt-4 border-t border-line pt-4">
      {buktiUrl && (
        <a
          href={buktiUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-xs font-semibold text-brand-700 hover:underline"
        >
          Lihat bukti yang sudah diunggah ↗
        </a>
      )}

      {sudahTerverifikasi ? (
        <p className="mt-2 text-xs text-emerald-700">
          Pembayaran sudah diverifikasi. Tidak perlu mengunggah ulang.
        </p>
      ) : !driveSiap ? (
        <p className="mt-2 text-xs leading-relaxed text-amber-700">
          Unggah berkas belum tersedia. Silakan kirim bukti pembayaran melalui
          WhatsApp atau email admin dengan menyebutkan nomor pendaftaran Anda.
        </p>
      ) : (
        <form action={aksi} className="mt-3">
          <input type="hidden" name="pembayaranId" value={pembayaranId} />
          <label className="label" htmlFor={`bukti-${pembayaranId}`}>
            Unggah bukti pembayaran
          </label>
          <input
            id={`bukti-${pembayaranId}`}
            name="berkas"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="input !py-1.5 !text-xs file:mr-3 file:rounded-md file:border-0 file:bg-paper-2 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-ink-soft"
          />
          <button
            type="submit"
            disabled={pending}
            className="tombol tombol-utama mt-3 w-full !py-2 !text-xs disabled:opacity-60"
          >
            {pending ? "Mengunggah…" : "Kirim bukti pembayaran"}
          </button>
          <p className="mt-2 text-[0.68rem] text-muted">
            Format PDF/JPG/PNG, maksimal 8 MB. Bukti akan diverifikasi admin.
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
