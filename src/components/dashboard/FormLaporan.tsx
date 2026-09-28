"use client";

import { useActionState } from "react";

import { simpanLaporan, type HasilLaporan } from "@/app/actions/laporan";

export function FormLaporan({
  pendaftaranId,
  awal,
  sudahDikonfirmasi,
}: {
  pendaftaranId: string;
  awal: {
    ringkasan: string;
    interpretasi: string;
    kesimpulan: string;
    rekomendasi: string;
  };
  /** Pelaksanaan tes sudah dikonfirmasi asisten psikolog. */
  sudahDikonfirmasi: boolean;
}) {
  const [hasil, aksi, pending] = useActionState<HasilLaporan, FormData>(
    simpanLaporan,
    undefined,
  );

  // Psikolog hanya boleh mengisi interpretasi setelah asisten mengonfirmasi
  // bahwa klien sudah melaksanakan tes di biro.
  const siapDiisi = sudahDikonfirmasi;

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

      {!siapDiisi && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
          <span className="font-semibold">Belum bisa diisi.</span> Asisten
          psikolog belum mengonfirmasi pelaksanaan tes untuk klien ini.
          Interpretasi baru dapat disusun setelah tes dilaksanakan di biro dan
          dikonfirmasi asisten.
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
          disabled={!siapDiisi}
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
          placeholder="Analisis dan interpretasi berdasarkan hasil asesmen serta observasi."
          disabled={!siapDiisi}
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
          disabled={!siapDiisi}
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
          disabled={!siapDiisi}
        />
      </div>

      <div className="flex flex-wrap gap-3 border-t border-line pt-4">
        <button
          type="submit"
          name="finalkan"
          value="0"
          disabled={pending || !siapDiisi}
          className="tombol tombol-garis flex-1 disabled:opacity-60"
        >
          {pending ? "Menyimpan…" : "Simpan sebagai draft"}
        </button>
        <button
          type="submit"
          name="finalkan"
          value="1"
          disabled={pending || !siapDiisi}
          title={
            siapDiisi
              ? "Finalkan laporan"
              : "Menunggu konfirmasi pelaksanaan tes dari asisten psikolog"
          }
          className="tombol tombol-utama flex-1 disabled:opacity-50"
        >
          Finalkan laporan
        </button>
      </div>

      <p className="text-[0.68rem] leading-relaxed text-muted">
        Finalisasi menandai kasus <span className="font-semibold">Selesai</span>{" "}
        dan otomatis membuat dokumen Word yang diunggah ke Drive Anda. Hanya
        Anda, psikolog penanggung jawab, yang dapat membuka dan mengubah
        laporan ini.
      </p>
    </form>
  );
}
