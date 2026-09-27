"use client";

import { useActionState, useRef, useState } from "react";

import { unggahBuktiKlien, type HasilUnggahBukti } from "@/app/actions/akun";
import { PratinjauBukti } from "@/components/dashboard/PratinjauBukti";

export function UnggahBuktiKlien({
  pembayaranId,
  status = null,
  adaBukti = false,
  catatan = null,
  sudahAdaBukti = false,
}: {
  pembayaranId: string;
  status?: "MENUNGGU" | "TERVERIFIKASI" | "DITOLAK" | null;
  adaBukti?: boolean;
  catatan?: string | null;
  /** @deprecated pakai `status` + `adaBukti` */
  sudahAdaBukti?: boolean;
}) {
  const [hasil, aksi, pending] = useActionState<HasilUnggahBukti, FormData>(
    unggahBuktiKlien,
    undefined,
  );
  const [namaFile, setNamaFile] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const sudahBerhasil = hasil?.ok;
  const buktiTersimpan = adaBukti || sudahAdaBukti;

  // Aturan tampil (sama seperti portal klien):
  // - MENUNGGU + sudah ada bukti → sembunyikan form, tampilkan status + pratinjau.
  // - TERVERIFIKASI → sembunyikan form.
  // - DITOLAK / belum ada bukti → tampilkan form.
  const menungguTerkirim =
    (status === "MENUNGGU" && buktiTersimpan) ||
    (status === null && buktiTersimpan && !hasil);
  const terverifikasi = status === "TERVERIFIKASI";
  const ditolak = status === "DITOLAK";
  const sembunyiForm = sudahBerhasil || menungguTerkirim || terverifikasi;

  function prosesFile(file: File | null) {
    if (!file) return;
    setNamaFile(file.name);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    prosesFile(e.target.files?.[0] ?? null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && inputRef.current) {
      const dt = new DataTransfer();
      dt.items.add(file);
      inputRef.current.files = dt.files;
      prosesFile(file);
    }
  }

  if (sudahBerhasil) {
    return (
      <div className="mt-4">
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-600 text-white">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 13l4 4L19 7"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div>
            <p className="text-sm font-semibold text-emerald-800">
              Bukti pembayaran berhasil dikirim!
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-emerald-700">
              {hasil.pesan}
            </p>
          </div>
        </div>
        <div className="mt-3">
          <PratinjauBukti pembayaranId={pembayaranId} />
        </div>
      </div>
    );
  }

  if (sembunyiForm) {
    return (
      <div className="mt-4 space-y-3">
        {terverifikasi ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            Pembayaran sudah diverifikasi. Terima kasih.
          </p>
        ) : (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium leading-relaxed text-amber-800">
            Bukti pembayaran Anda sudah diterima dan sedang diverifikasi admin.
            Tidak perlu mengunggah ulang. Pantau status lewat halaman ini atau
            menu Riwayat.
          </p>
        )}
        <PratinjauBukti pembayaranId={pembayaranId} tampilMini />
      </div>
    );
  }

  return (
    <div className="mt-4">
      {ditolak ? (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-700">
          <p className="font-bold">Bukti pembayaran DITOLAK.</p>
          <p className="mt-1">
            <span className="font-semibold">Alasan dari admin:</span>{" "}
            {catatan ??
              "Bukti tidak dapat diverifikasi. Silakan kirim ulang bukti yang jelas."}
          </p>
          <p className="mt-1 font-medium">
            Silakan kirim ulang bukti yang benar di bawah ini.
          </p>
        </div>
      ) : (
        buktiTersimpan &&
        !hasil && (
          <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
            Bukti sebelumnya sudah diunggah. Unggah ulang untuk memperbarui.
          </p>
        )
      )}

      <form action={aksi}>
        <input type="hidden" name="pembayaranId" value={pembayaranId} />

        {/* Drop zone */}
        <div
          role="button"
          tabIndex={0}
          className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
            dragOver
              ? "border-brand-400 bg-brand-50"
              : namaFile
                ? "border-emerald-300 bg-emerald-50/60"
                : "border-line bg-paper-2 hover:border-brand-300 hover:bg-brand-50/40"
          }`}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            name="berkas"
            type="file"
            accept=".jpg,.jpeg,.png,.pdf,.webp"
            className="sr-only"
            onChange={handleChange}
          />

          {preview ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Preview bukti"
                className="mx-auto max-h-36 rounded-xl object-contain shadow-sm ring-2 ring-emerald-200"
              />
              <span className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-emerald-500 text-white shadow">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 13l4 4L19 7"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
          ) : (
            <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-100 text-brand-600">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </span>
          )}

          {namaFile ? (
            <div>
              <p className="text-sm font-semibold text-emerald-800">{namaFile}</p>
              <p className="mt-0.5 text-xs text-muted">Klik untuk ganti file</p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-semibold text-ink">
                Klik atau seret gambar ke sini
              </p>
              <p className="mt-1 text-xs text-muted">
                JPG, PNG, WEBP, atau PDF · Maks. 5 MB
              </p>
            </div>
          )}
        </div>

        {hasil && !hasil.ok && (
          <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {hasil.pesan}
          </p>
        )}

        <button
          type="submit"
          disabled={pending || !namaFile}
          className="tombol tombol-utama mt-3 w-full disabled:opacity-50"
        >
          {pending ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Mengunggah…
            </span>
          ) : ditolak ? (
            "Kirim Ulang Bukti Pembayaran"
          ) : (
            "Kirim Bukti Pembayaran"
          )}
        </button>
      </form>
    </div>
  );
}
