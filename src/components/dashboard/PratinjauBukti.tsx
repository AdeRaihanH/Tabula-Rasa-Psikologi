"use client";

import { useState } from "react";

/**
 * Penampil bukti pembayaran yang andal.
 *
 * Memakai `/api/bukti/[id]` (bukan `href` langsung ke data-URL raksasa),
 * sehingga tombol "Lihat bukti" tidak error walau berkas 5–8 MB.
 * Menampilkan modal pratinjau: gambar inline, PDF via iframe, plus
 * tautan buka tab baru & unduh.
 */
export function PratinjauBukti({
  pembayaranId,
  label = "Lihat bukti yang sudah diunggah ↗",
  className = "inline-block text-xs font-semibold text-brand-700 hover:underline",
  tampilMini = false,
  t = "",
}: {
  pembayaranId: string;
  label?: string;
  className?: string;
  tampilMini?: boolean;
  t?: string;
}) {
  const [buka, setBuka] = useState(false);
  const [gagalGambar, setGagalGambar] = useState(false);
  const [gagalMini, setGagalMini] = useState(false);
  const url = `/api/bukti/${pembayaranId}${t ? `?t=${t}` : ""}`;

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        {tampilMini && !gagalMini && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt="Bukti pembayaran"
            loading="lazy"
            onError={() => setGagalMini(true)}
            onClick={() => setBuka(true)}
            className="h-24 w-auto cursor-zoom-in rounded-lg border border-line object-cover shadow-sm"
          />
        )}
        <button type="button" onClick={() => setBuka(true)} className={className}>
          {label}
        </button>
      </div>

      {buka && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
          onClick={() => setBuka(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Pratinjau bukti pembayaran"
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
              <p className="text-sm font-bold text-ink">Bukti pembayaran</p>
              <button
                type="button"
                onClick={() => setBuka(false)}
                className="rounded-full bg-paper-2 px-3 py-1 text-xs font-semibold text-ink-soft hover:bg-line"
              >
                Tutup ✕
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto bg-paper-2 p-4">
              {!gagalGambar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={url}
                  alt="Bukti pembayaran"
                  className="mx-auto max-h-[60vh] rounded-xl object-contain shadow"
                  onError={() => setGagalGambar(true)}
                />
              ) : (
                <iframe
                  src={url}
                  title="Bukti pembayaran (PDF/dokumen)"
                  className="h-[60vh] w-full rounded-xl bg-white shadow"
                />
              )}
            </div>

            <div className="flex flex-wrap gap-2 border-t border-line px-5 py-3">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="tombol tombol-garis !py-1.5 !text-xs"
              >
                Buka di tab baru ↗
              </a>
              <a
                href={url}
                download={`bukti-${pembayaranId}`}
                className="tombol tombol-garis !py-1.5 !text-xs"
              >
                Unduh
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
