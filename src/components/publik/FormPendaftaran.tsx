"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useState, useSyncExternalStore } from "react";

import { kirimPendaftaran, type HasilPendaftaran } from "@/app/actions/pendaftaran";
import { JebakanBot } from "@/components/ui/JebakanBot";
import { UnggahBuktiKlien } from "@/components/publik/UnggahBuktiKlien";
import { labelKategori } from "@/lib/config";
import {
  SLOT_WAKTU,
  slotTerlewat,
  tanggalHariIni,
  validasiJadwal,
} from "@/lib/jadwal";
import { cn, formatRupiah } from "@/lib/utils";

type LayananRingkas = {
  id: string;
  nama: string;
  kategori: string;
  slug: string;
  hargaOffline: number | null;
  durasiMenit: number | null;
};

type PsikologRingkas = {
  id: string;
  nama: string;
  spesialisasi: string;
  fotoUrl: string | null;
};

function Galat({ pesan }: { pesan?: string }) {
  if (!pesan) return null;
  return <p className="mt-1 text-xs font-medium text-red-600">{pesan}</p>;
}

/**
 * Sumber "waktu sekarang" untuk komponen. Nilai di-cache per menit supaya
 * snapshot stabil (syarat useSyncExternalStore), dan null di server agar HTML
 * server sama dengan render pertama klien.
 */
function langgananMenit(beriTahu: () => void) {
  const timer = setInterval(beriTahu, 60_000);
  return () => clearInterval(timer);
}

let menitCache = -1;
let waktuCache: Date | null = null;

function ambilWaktuKlien() {
  const menit = Math.floor(Date.now() / 60_000);
  if (waktuCache === null || menit !== menitCache) {
    menitCache = menit;
    waktuCache = new Date();
  }
  return waktuCache;
}

function ambilWaktuServer(): Date | null {
  return null;
}

export function FormPendaftaran({
  layanan,
  psikolog,
  akun,
  slugAwal,
  psikologAwal,
}: {
  layanan: LayananRingkas[];
  psikolog: PsikologRingkas[];
  akun: {
    nama: string;
    email: string;
    telepon: string | null;
    tanggalLahir: string | null;
    jenisKelamin: string | null;
    alamat: string | null;
    pekerjaan: string | null;
    institusi: string | null;
  };
  slugAwal?: string;
  psikologAwal?: string;
}) {
  const [hasil, aksi, pending] = useActionState<HasilPendaftaran | undefined, FormData>(
    kirimPendaftaran,
    undefined,
  );
  const [layananId, setLayananId] = useState(
    slugAwal ? (layanan.find((l) => l.slug === slugAwal)?.id ?? "") : "",
  );
  const [tanggal, setTanggal] = useState("");
  const [waktu, setWaktu] = useState("");

  // Waktu sekarang hanya tersedia di klien (null saat render server).
  const sekarang = useSyncExternalStore(
    langgananMenit,
    ambilWaktuKlien,
    ambilWaktuServer,
  );

  const terlewat = sekarang && tanggal ? slotTerlewat(tanggal, sekarang) : [];

  // Waktu yang sudah lewat otomatis dianggap tidak dipilih, sehingga tidak
  // perlu efek pembersih dan tidak ikut terkirim (input-nya nonaktif).
  const waktuEfektif = waktu && !terlewat.includes(waktu) ? waktu : "";

  const jadwalGalat =
    sekarang && (tanggal || waktuEfektif)
      ? validasiJadwal(tanggal || null, waktuEfektif || null, sekarang)
      : null;

  // Perkiraan biaya layanan yang dipilih (semua layanan Tatap Muka).
  const layananTerpilih = layanan.find((l) => l.id === layananId) ?? null;
  const biayaPerkiraan = layananTerpilih?.hargaOffline ?? null;

  if (hasil?.ok) {
    const adaRekening = Boolean(hasil.rekening.bank && hasil.rekening.nomor);

    return (
      <div className="space-y-6">
        {/* Konfirmasi pendaftaran */}
        <div className="kartu animasi-naik p-8 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-100 text-brand-700">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 13l4 4L19 7"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <h2 className="mt-5 text-2xl font-bold text-ink">Pendaftaran terkirim</h2>
          <p className="mt-3 text-ink-soft">
            Simpan nomor pendaftaran Anda untuk ditanyakan kepada admin:
          </p>
          <p className="mt-4 inline-block rounded-xl bg-brand-600 px-6 py-3 text-lg font-bold tracking-wider text-white">
            {hasil.nomor}
          </p>
        </div>

        {/* Instruksi pembayaran */}
        <div className="kartu p-8">
          <span className="label-kecil">Langkah Berikutnya</span>
          <h3 className="mt-2 text-xl font-bold text-ink">
            {hasil.biaya
              ? "Pembayaran layanan"
              : "Menunggu konfirmasi biaya"}
          </h3>

          <div className="mt-5 space-y-2.5 rounded-xl bg-paper-2 p-5 text-sm">
            <div className="flex items-center justify-between gap-4 border-b border-line pb-2.5">
              <span className="text-muted">Layanan</span>
              <span className="text-right font-semibold text-ink">{hasil.layanan}</span>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-line pb-2.5">
              <span className="text-muted">Metode</span>
              <span className="font-semibold text-ink">
                Tatap Muka
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted">Total biaya</span>
              <span className="text-lg font-bold text-brand-700">
                {hasil.biaya ? formatRupiah(hasil.biaya) : "Menunggu konfirmasi admin"}
              </span>
            </div>
          </div>

          {hasil.biaya ? (
            <>
              {adaRekening && (
                <div className="mt-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">
                    Transfer ke
                  </p>
                  <div className="mt-2 rounded-xl border border-brand-200 bg-brand-50/60 p-5">
                    <p className="text-lg font-bold text-ink">
                      {hasil.rekening.bank}
                    </p>
                    <p className="mt-1 font-mono text-xl font-bold tracking-wider text-brand-700">
                      {hasil.rekening.nomor}
                    </p>
                    {hasil.rekening.atasNama && (
                      <p className="mt-1 text-sm text-ink-soft">
                        a.n. {hasil.rekening.atasNama}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <ol className="mt-5 space-y-2.5">
                {[
                  `Transfer tepat sebesar ${formatRupiah(hasil.biaya)} ke rekening di atas.`,
                  "Simpan bukti transfer Anda.",
                  "Unggah bukti transfer langsung di bawah ini.",
                  "Admin memverifikasi pembayaran dan mengonfirmasi jadwal Anda.",
                  "Datang ke biro sesuai jadwal untuk melaksanakan tes secara Tatap Muka bersama asisten psikolog.",
                ].map((t, i) => (
                  <li key={t} className="flex gap-3 text-sm text-ink-soft">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-100 text-[0.65rem] font-bold text-brand-700">
                      {i + 1}
                    </span>
                    {t}
                  </li>
                ))}
              </ol>

              {hasil.rekening.instruksi && (
                <p className="mt-4 rounded-xl bg-paper-2 px-4 py-3 text-xs leading-relaxed text-ink-soft">
                  {hasil.rekening.instruksi}
                </p>
              )}

              {/* Upload bukti pembayaran langsung */}
              {hasil.pembayaranId && (
                <div className="mt-6 border-t border-line pt-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                    Unggah Bukti Pembayaran
                  </p>
                  <p className="mt-1 text-xs text-ink-soft">
                    Unggah screenshot atau foto bukti transfer Anda. Admin akan segera memverifikasi.
                  </p>
                  <UnggahBuktiKlien pembayaranId={hasil.pembayaranId} />
                </div>
              )}

              <div className="mt-6">
                <Link href="/cek-status" className="tombol tombol-garis">
                  Cek Status Pendaftaran
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="mt-5 text-sm leading-relaxed text-ink-soft">
                Biaya layanan ini belum ditetapkan otomatis. Admin akan
                menghubungi Anda dengan rincian biaya, lalu Anda dapat
                melakukan pembayaran.
              </p>
              <div className="mt-6">
                <Link href="/cek-status" className="tombol tombol-garis">
                  Cek Status Pendaftaran
                </Link>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/" className="tombol tombol-garis">
            Kembali ke Beranda
          </Link>
          <Link href="/alur" className="tombol tombol-garis">
            Lihat Alur Layanan
          </Link>
        </div>
      </div>
    );
  }

  const galat = hasil && !hasil.ok ? hasil.galat : undefined;

  return (
    <form action={aksi} className="space-y-8">
      <JebakanBot />
      {hasil && !hasil.ok && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {hasil.pesan}
        </div>
      )}

      {/* Data diri */}
      <section className="kartu p-6">
        <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-ink-soft">
          Data Diri
        </h2>
        <p className="mt-2 text-xs text-muted">
          Diambil dari akun Anda.{" "}
          <Link
            href="/dashboard/profil"
            className="font-semibold text-brand-700 underline"
          >
            Ubah di Profil Saya
          </Link>{" "}
          bila perlu diperbarui.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="nama">
              Nama lengkap *
            </label>
            <input
              id="nama"
              name="nama"
              className="input bg-paper-2"
              defaultValue={akun.nama}
              readOnly
            />
            <Galat pesan={galat?.nama} />
          </div>

          <div>
            <label className="label" htmlFor="email">
              Email *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="input bg-paper-2"
              defaultValue={akun.email}
              readOnly
            />
            <Galat pesan={galat?.email} />
          </div>

          <div>
            <label className="label" htmlFor="telepon">
              Nomor telepon / WhatsApp *
            </label>
            <input
              id="telepon"
              name="telepon"
              className="input"
              defaultValue={akun.telepon ?? ""}
              placeholder="08xxxxxxxxxx"
            />
            <Galat pesan={galat?.telepon} />
          </div>

          <div>
            <label className="label" htmlFor="tanggalLahir">
              Tanggal lahir
            </label>
            <input
              id="tanggalLahir"
              name="tanggalLahir"
              type="date"
              className="input"
              defaultValue={akun.tanggalLahir ?? ""}
            />
          </div>

          <div>
            <label className="label" htmlFor="jenisKelamin">
              Jenis kelamin
            </label>
            <select
              id="jenisKelamin"
              name="jenisKelamin"
              className="input"
              defaultValue={akun.jenisKelamin ?? ""}
            >
              <option value="">Pilih…</option>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="label" htmlFor="alamat">
              Alamat domisili
            </label>
            <input
              id="alamat"
              name="alamat"
              className="input"
              defaultValue={akun.alamat ?? ""}
              placeholder="Kota / kabupaten"
            />
          </div>

          <div>
            <label className="label" htmlFor="pekerjaan">
              Pekerjaan
            </label>
            <input
              id="pekerjaan"
              name="pekerjaan"
              className="input"
              defaultValue={akun.pekerjaan ?? ""}
              placeholder="mis. Karyawan swasta"
            />
          </div>

          <div>
            <label className="label" htmlFor="institusi">
              Institusi / perusahaan
            </label>
            <input
              id="institusi"
              name="institusi"
              className="input"
              defaultValue={akun.institusi ?? ""}
              placeholder="Isi jika mendaftar atas nama lembaga"
            />
          </div>
        </div>
      </section>

      {/* Kebutuhan layanan */}
      <section className="kartu p-6">
        <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-ink-soft">
          Kebutuhan Layanan
        </h2>

        <div className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="layananId">
              Layanan yang diinginkan *
            </label>
            <select
              id="layananId"
              name="layananId"
              className="input"
              value={layananId}
              onChange={(e) => setLayananId(e.target.value)}
            >
              <option value="">Pilih layanan…</option>
              {layanan.map((l) => {
                const h = l.hargaOffline;
                return (
                  <option key={l.id} value={l.id}>
                    {labelKategori[l.kategori] ?? l.kategori} — {l.nama}
                    {h ? ` (${formatRupiah(h)})` : ""}
                  </option>
                );
              })}
            </select>
            <Galat pesan={galat?.layananId} />
          </div>

          <input type="hidden" name="metode" value="OFFLINE" />
          <div className="rounded-xl border border-line bg-paper-2 px-4 py-3">
            <p className="text-xs font-semibold text-ink-soft">
              Metode pelaksanaan: Tatap Muka
            </p>
            <p className="mt-1 text-[0.68rem] leading-relaxed text-muted">
              Seluruh layanan dilaksanakan di kantor biro sesuai jadwal yang
              Anda pilih.
            </p>
          </div>

          {layananTerpilih && (
            <div className="flex items-center justify-between gap-4 rounded-xl border border-brand-200 bg-brand-50/60 px-4 py-3">
              <div>
                <p className="text-xs font-semibold text-brand-800">
                  Biaya layanan yang dipilih
                </p>
                <p className="mt-0.5 text-[0.68rem] text-brand-800/70">
                  {layananTerpilih.nama} ·{" "}
                  Tatap Muka
                </p>
              </div>
              <p className="text-lg font-bold text-brand-700">
                {biayaPerkiraan ? formatRupiah(biayaPerkiraan) : "Konfirmasi admin"}
              </p>
            </div>
          )}

          <div className="animate-in fade-in slide-in-from-top-2 flex flex-col gap-5 rounded-xl border border-brand-200 bg-brand-50/50 p-5 mt-2">
            <div>
              <label className="label" htmlFor="tanggalPertemuan">
                Pilih tanggal pertemuan <span className="text-brand-700">*</span>
              </label>
              <input
                type="date"
                id="tanggalPertemuan"
                name="tanggalPertemuan"
                className="input bg-white"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                min={sekarang ? tanggalHariIni(sekarang) : undefined}
                required
              />
              <p className="mt-1.5 text-[0.68rem] text-muted">
                Tanggal sebelum hari ini tidak dapat dipilih. Jadwal ini yang
                dipakai admin, asisten, dan psikolog Anda.
              </p>
            </div>
            <div>
              <span className="label">
                Pilih waktu kedatangan <span className="text-brand-700">*</span>
              </span>
              <div className="flex flex-wrap gap-3">
                {SLOT_WAKTU.map((slot, i) => {
                  const lewat = terlewat.includes(slot.label);
                  return (
                    <label
                      key={slot.label}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-xs transition-colors",
                        lewat
                          ? "cursor-not-allowed opacity-45"
                          : "cursor-pointer has-checked:border-brand-400 has-checked:bg-brand-50",
                      )}
                    >
                      <input
                        type="radio"
                        name="waktuPertemuan"
                        value={slot.label}
                        checked={waktuEfektif === slot.label}
                        onChange={(e) => setWaktu(e.target.value)}
                        disabled={lewat}
                        required={i === 0}
                        className="accent-brand-600"
                      />
                      <span className={cn(lewat && "line-through")}>{slot.label}</span>
                      {lewat && (
                        <span className="pil bg-paper-2 text-muted">lewat</span>
                      )}
                    </label>
                  );
                })}
              </div>
              <p className="mt-1.5 text-[0.68rem] text-muted">
                Waktu yang sudah lewat otomatis dinonaktifkan.
              </p>
            </div>

            {jadwalGalat && !jadwalGalat.ok && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {jadwalGalat.pesan}
              </p>
            )}
            {galat?.jadwal && <Galat pesan={galat.jadwal} />}
          </div>

          <div>
            <label className="label" htmlFor="kebutuhan">
              Ceritakan kebutuhan Anda
            </label>
            <textarea
              id="kebutuhan"
              name="kebutuhan"
              rows={4}
              className="input"
              placeholder="mis. Seleksi 20 kandidat untuk posisi staf, atau jadwal konseling pribadi."
            />
          </div>
        </div>
      </section>

      {/* Pilih psikolog */}
      <section className="kartu p-6">
        <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-ink-soft">
          Pilih Psikolog *
        </h2>
        <p className="mt-2 text-xs text-muted">
          Pilih psikolog yang akan menangani Anda. Hasil asesmen akan diarsipkan
          pada folder psikolog yang dipilih dan hanya dapat diakses olehnya.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {psikolog.map((p) => (
            <label
              key={p.id}
              className={cn(
                "group flex cursor-pointer items-center gap-4 rounded-2xl border border-line bg-white p-4 transition-colors",
                "has-checked:border-brand-400 has-checked:bg-brand-50/50",
              )}
            >
              <input
                type="radio"
                name="psikologId"
                value={p.id}
                defaultChecked={psikologAwal === p.id}
                className="sr-only"
                required
              />
              <span className="relative block h-16 w-16 shrink-0 overflow-hidden rounded-full ring-2 ring-line transition-shadow group-has-checked:ring-brand-400">
                {p.fotoUrl ? (
                  <Image
                    src={p.fotoUrl}
                    alt={p.nama}
                    width={64}
                    height={64}
                    sizes="64px"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="grid h-full w-full place-items-center bg-brand-100 text-sm font-bold text-brand-700">
                    {p.nama.slice(0, 1)}
                  </span>
                )}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-ink">{p.nama}</span>
                <span className="block text-xs text-muted">{p.spesialisasi}</span>
              </span>
            </label>
          ))}

          {psikolog.length === 0 && (
            <p className="rounded-xl bg-paper-2 px-4 py-3 text-xs text-muted sm:col-span-2">
              Data psikolog belum tersedia. Silakan hubungi admin.
            </p>
          )}
        </div>
        <Galat pesan={galat?.psikologId} />
      </section>

      {/* Persetujuan */}
      <section className="kartu p-6">
        <label
          className={cn(
            "flex cursor-pointer items-start gap-3 text-sm leading-relaxed",
            galat?.informedConsent && "text-red-700",
          )}
        >
          <input
            type="checkbox"
            name="informedConsent"
            className="mt-0.5 h-4 w-4 accent-brand-600"
          />
          <span className="text-ink-soft">
            Saya menyetujui pemrosesan data saya sesuai{" "}
            <Link href="/kerahasiaan" className="font-semibold text-brand-700 underline">
              sistem kerahasiaan data
            </Link>{" "}
            dan bersedia menandatangani informed consent sebelum layanan dimulai. *
          </span>
        </label>
        <Galat pesan={galat?.informedConsent} />

        <button type="submit" disabled={pending} className="tombol tombol-utama mt-6 w-full disabled:opacity-60">
          {pending ? "Mengirim…" : "Kirim Pendaftaran"}
        </button>
        <p className="mt-3 text-center text-xs text-muted">
          Tahap berikutnya: verifikasi pembayaran oleh admin, lalu datang ke
          biro sesuai jadwal untuk melaksanakan tes.
        </p>
      </section>
    </form>
  );
}
