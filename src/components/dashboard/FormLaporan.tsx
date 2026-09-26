"use client";

import { useActionState } from "react";

import { simpanLaporan, type HasilLaporan } from "@/app/actions/laporan";

export function FormLaporan({
  pendaftaranId,
  awal,
  jumlahLembar,
  jumlahLembarTanpaSkor,
}: {
  pendaftaranId: string;
  awal: {
    ringkasan: string;
    interpretasi: string;
    kesimpulan: string;
    rekomendasi: string;
  };
  jumlahLembar: number;
  jumlahLembarTanpaSkor: number;
}) {
  const [hasil, aksi, pending] = useActionState<HasilLaporan, FormData>(
    simpanLaporan,
    undefined,
  );

  const siapFinal = jumlahLembar > 0 && jumlahLembarTanpaSkor === 0;

  return (
    <form action={aksi} className="mt-5 space-y-4">
      <input type="hidden" name="pendaftaranId" value={pendaftaranId} />

      {hasil && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            hasil.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {hasil.pesan}
        </div>
      )}

      {!siapFinal && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
          <span className="font-semibold">Belum bisa difinalkan.</span>{" "}
          {jumlahLembar === 0
            ? "Belum ada lembar tes. Asisten psikolog harus menambahkan lembar tes dan mengisi skor mentah terlebih dahulu."
            : `${jumlahLembarTanpaSkor} lembar tes belum memiliki skor mentah. Lengkapi skor terlebih dahulu.`}{" "}
          Anda masih dapat menyimpan sebagai draft.
        </div>
      )}

      <div>
        <label className="label" htmlFor="ringkasan">
          Ringkasan hasil
        </label>
        <textarea
          id="ringkasan"
          name="ringkasan"
          rows={3}
          className="input"
          defaultValue={awal.ringkasan}
          placeholder="Gambaran umum hasil asesmen."
        />
      </div>

      <div>
        <label className="label" htmlFor="interpretasi">
          Interpretasi psikologis
        </label>
        <textarea
          id="interpretasi"
          name="interpretasi"
          rows={6}
          className="input"
          defaultValue={awal.interpretasi}
          placeholder="Analisis dan interpretasi berdasarkan skor mentah serta observasi."
        />
      </div>

      <div>
        <label className="label" htmlFor="kesimpulan">
          Kesimpulan
        </label>
        <textarea
          id="kesimpulan"
          name="kesimpulan"
          rows={3}
          className="input"
          defaultValue={awal.kesimpulan}
          placeholder="Kesimpulan akhir asesmen."
        />
      </div>

      <div>
        <label className="label" htmlFor="rekomendasi">
          Rekomendasi
        </label>
        <textarea
          id="rekomendasi"
          name="rekomendasi"
          rows={4}
          className="input"
          defaultValue={awal.rekomendasi}
          placeholder="Saran tindak lanjut untuk klien atau institusi."
        />
      </div>

      <div className="flex flex-wrap gap-3 border-t border-line pt-4">
        <button
          type="submit"
          name="finalkan"
          value="0"
          disabled={pending}
          className="tombol tombol-garis flex-1 disabled:opacity-60"
        >
          {pending ? "Menyimpan…" : "Simpan sebagai draft"}
        </button>
        <button
          type="submit"
          name="finalkan"
          value="1"
          disabled={pending || !siapFinal}
          title={
            siapFinal
              ? "Finalkan laporan"
              : "Lengkapi lembar tes dan skor mentah terlebih dahulu"
          }
          className="tombol tombol-utama flex-1 disabled:opacity-50"
        >
          Finalkan laporan
        </button>
      </div>

      <p className="text-[0.68rem] leading-relaxed text-muted">
        Finalisasi menandai kasus <span className="font-semibold">Selesai</span>{" "}
        (tahap 8) dan mencatat tindakan pada log audit. Hanya Anda, psikolog
        penanggung jawab, yang dapat membuka dan mengubah laporan ini.
      </p>
    </form>
  );
}
