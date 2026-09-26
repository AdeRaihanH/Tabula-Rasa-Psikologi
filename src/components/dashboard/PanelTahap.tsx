"use client";

import { useActionState } from "react";

import {
  batalkanPendaftaran,
  naikkanTahap,
  turunkanTahap,
  type HasilTahap,
} from "@/app/actions/alur";
import { AlurStatus } from "@/components/dashboard/AlurStatus";

function Pesan({ hasil }: { hasil: HasilTahap | undefined }) {
  if (!hasil) return null;
  return (
    <div
      className={`mt-3 rounded-xl border px-4 py-3 text-xs leading-relaxed ${
        hasil.ok
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-amber-200 bg-amber-50 text-amber-800"
      }`}
    >
      {hasil.pesan}
    </div>
  );
}

export function PanelTahap({
  pendaftaranId,
  status,
  berikut,
  syarat,
  sebelum,
  bolehNaik,
  bolehBatalkan,
  bolehKoreksi = false,
  stepperRingkas = false,
}: {
  pendaftaranId: string;
  status: string;
  berikut: { nomor: number; judul: string; aktor: string } | null;
  syarat: { ok: boolean; pesan: string };
  sebelum: { nomor: number; judul: string } | null;
  bolehNaik: boolean;
  bolehBatalkan: boolean;
  bolehKoreksi?: boolean;
  stepperRingkas?: boolean;
}) {
  const [hasilNaik, aksiNaik, pendingNaik] = useActionState<
    HasilTahap | undefined,
    FormData
  >(naikkanTahap, undefined);
  const [hasilTurun, aksiTurun, pendingTurun] = useActionState<
    HasilTahap | undefined,
    FormData
  >(turunkanTahap, undefined);
  const [hasilBatal, aksiBatal, pendingBatal] = useActionState<
    HasilTahap | undefined,
    FormData
  >(batalkanPendaftaran, undefined);

  const siap = bolehNaik && syarat.ok;

  return (
    <section className="space-y-6">
      <AlurStatus status={status} ringkas={stepperRingkas} />

      <div className="kartu p-6">
        <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-ink-soft">
          Tahap Berikutnya
        </h2>

        {berikut ? (
          <>
            <p className="mt-3 text-sm text-ink-soft">
              Tahap <span className="font-semibold text-ink">{berikut.nomor}</span> —{" "}
              <span className="font-semibold text-ink">{berikut.judul}</span>{" "}
              <span className="text-muted">({berikut.aktor})</span>
            </p>

            {!syarat.ok && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
                <span className="font-semibold">Syarat belum lengkap.</span>{" "}
                {syarat.pesan}
              </div>
            )}

            {syarat.ok && !bolehNaik && (
              <div className="mt-3 rounded-xl border border-line bg-paper-2 px-4 py-3 text-xs leading-relaxed text-ink-soft">
                Syarat sudah lengkap. Tahap ini dijalankan oleh{" "}
                <span className="font-semibold text-ink">{berikut.aktor}</span>.
              </div>
            )}

            <form action={aksiNaik} className="mt-4">
              <input type="hidden" name="id" value={pendaftaranId} />
              <button
                disabled={!siap || pendingNaik}
                title={
                  siap
                    ? `Naik ke tahap ${berikut.nomor}`
                    : syarat.ok
                      ? `Dijalankan oleh ${berikut.aktor}`
                      : syarat.pesan
                }
                className="tombol tombol-utama w-full disabled:opacity-50"
              >
                {pendingNaik
                  ? "Memproses…"
                  : `Selesaikan tahap ini → Tahap ${berikut.nomor}`}
              </button>
            </form>
            <Pesan hasil={hasilNaik} />
          </>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Kasus sudah berada di tahap terakhir. Lanjutkan ke menu{" "}
            <span className="font-semibold text-ink">Pengarsipan</span> untuk
            menyimpan berkasnya.
          </p>
        )}
      </div>

      {(sebelum && bolehKoreksi) || bolehBatalkan ? (
        <div className="kartu p-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-ink-soft">
            Koreksi
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            Gunakan hanya bila status keliru. Setiap koreksi dicatat pada log
            audit.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {sebelum && bolehKoreksi && (
              <form action={aksiTurun} className="flex-1">
                <input type="hidden" name="id" value={pendaftaranId} />
                <button
                  disabled={pendingTurun}
                  className="tombol tombol-garis w-full !py-2 !text-xs disabled:opacity-50"
                >
                  {pendingTurun
                    ? "Memproses…"
                    : `← Kembalikan ke tahap ${sebelum.nomor}`}
                </button>
              </form>
            )}

            {bolehBatalkan && status !== "DIBATALKAN" && (
              <form action={aksiBatal} className="flex-1">
                <input type="hidden" name="id" value={pendaftaranId} />
                <button
                  disabled={pendingBatal}
                  className="tombol tombol-garis w-full !py-2 !text-xs !text-red-700 disabled:opacity-50"
                >
                  {pendingBatal ? "Memproses…" : "Batalkan pendaftaran"}
                </button>
              </form>
            )}
          </div>

          <Pesan hasil={hasilTurun} />
          <Pesan hasil={hasilBatal} />
        </div>
      ) : null}
    </section>
  );
}
