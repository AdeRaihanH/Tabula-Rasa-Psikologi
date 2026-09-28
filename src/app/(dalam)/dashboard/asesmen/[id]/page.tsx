import Link from "next/link";
import { notFound } from "next/navigation";

import {
  BadgeStatus,
  BadgeZona,
  JudulHalaman,
} from "@/components/dashboard/ui";
import { konfirmasiPelaksanaanTes } from "@/app/actions/asesmen";
import { AlurStatus } from "@/components/dashboard/AlurStatus";
import { wajibKemampuan } from "@/lib/auth/dal";
import { parsePreferensiJadwal } from "@/lib/jadwal";
import { boleh } from "@/lib/rbac";
import { labelStatusPendaftaran } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import { formatTanggal, formatTanggalWaktu } from "@/lib/utils";

export default async function DetailAsesmen({
  params,
}: PageProps<"/dashboard/asesmen/[id]">) {
  const sesi = await wajibKemampuan("lembartes:lihat");
  const bolehKelola = boleh(sesi.role, "lembartes:kelola");
  const { id } = await params;

  const p = await prisma.pendaftaran.findUnique({
    where: { id },
    include: {
      klien: { select: { nama: true } },
      layanan: { select: { id: true, nama: true } },
      psikolog: { select: { nama: true } },
      jadwal: { orderBy: { mulai: "asc" } },
      konfirmasiTesOleh: { select: { nama: true } },
    },
  });

  if (!p) notFound();

  const sudahDikonfirmasi = Boolean(p.konfirmasiTesPada);

  const preferensi =
    p.jadwal.length === 0 ? parsePreferensiJadwal(p.kebutuhan) : null;

  return (
    <>
      <div className="mb-5">
        <Link href="/dashboard/asesmen" className="text-xs font-medium text-muted hover:text-brand-700">
          ← Kembali ke daftar asesmen
        </Link>
      </div>

      <JudulHalaman
        judul={`${p.nomor} — ${p.klien.nama}`}
        keterangan={`${p.layanan.nama} · ${labelStatusPendaftaran[p.status] ?? p.status}`}
        aksi={
          <div className="flex items-center gap-2">
            <BadgeZona zona="ZONA_2" />
            <BadgeStatus status={p.status} label={labelStatusPendaftaran[p.status] ?? p.status} />
          </div>
        }
      />

      {/* Siapa & kapan: psikolog penanggung jawab + jadwal pilihan klien */}
      <section className="kartu mb-6 p-5">
        <h2 className="text-xs font-bold uppercase tracking-[0.08em] text-muted">
          Klien, Psikolog & Jadwal
        </h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-xl bg-paper-2 p-4">
            <dt className="text-xs text-muted">Klien</dt>
            <dd className="mt-1 font-bold text-ink">{p.klien.nama}</dd>
            <dd className="mt-0.5 text-xs text-muted">{p.layanan.nama}</dd>
          </div>
          <div className="rounded-xl bg-paper-2 p-4">
            <dt className="text-xs text-muted">Psikolog</dt>
            <dd className="mt-1 font-bold text-ink">
              {p.psikolog?.nama ?? "Belum ditetapkan"}
            </dd>
          </div>
          <div className="rounded-xl bg-paper-2 p-4">
            <dt className="text-xs text-muted">Jadwal pilihan klien</dt>
            {p.jadwal.length > 0 ? (
              <dd className="mt-1 font-bold text-ink">
                {formatTanggalWaktu(p.jadwal[0].mulai)}
                <span className="block text-xs font-normal text-muted">
                  Tatap Muka
                  {p.jadwal.length > 1
                    ? ` · +${p.jadwal.length - 1} sesi lain`
                    : ""}
                  {p.jadwal[0].catatan?.includes("pilihan pendaftar")
                    ? " · sesuai pilihan pendaftar"
                    : ""}
                </span>
              </dd>
            ) : preferensi ? (
              <dd className="mt-1 font-bold text-ink">
                {/^\d{4}-\d{2}-\d{2}$/.test(preferensi.tanggal)
                  ? formatTanggal(
                      new Date(`${preferensi.tanggal}T00:00:00+07:00`),
                    )
                  : preferensi.tanggal}{" "}
                · {preferensi.waktu}
                <span className="block text-xs font-normal text-muted">
                  Pilihan pada formulir — jadwal menyusul dari admin
                </span>
              </dd>
            ) : (
              <dd className="mt-1 text-xs text-muted">
                Belum ada jadwal maupun preferensi.
              </dd>
            )}
          </div>
        </dl>
      </section>

      <div className="mb-6">
        <AlurStatus status={p.status} ringkas />
      </div>

      {/* Jadwal */}
      {p.jadwal.length > 0 && (
        <section className="kartu mb-6 p-5">
          <h2 className="text-xs font-bold uppercase tracking-[0.08em] text-muted">
            Jadwal pelaksanaan
          </h2>
          <ul className="mt-3 flex flex-wrap gap-3">
            {p.jadwal.map((j) => (
              <li key={j.id} className="rounded-lg bg-paper-2 px-3 py-2 text-xs text-ink-soft">
                {formatTanggalWaktu(j.mulai)} · Tatap Muka
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Konfirmasi pelaksanaan tes — satu tindakan saja */}
      <section className="kartu mb-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-ink-soft">
              Konfirmasi Pelaksanaan Tes
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Tekan konfirmasi setelah klien selesai melaksanakan tes secara{" "}
              <span className="font-semibold text-ink">Tatap Muka di biro</span>.
              Konfirmasi ini membuka akses psikolog untuk menyusun interpretasi.
            </p>
          </div>
          <BadgeZona zona="ZONA_2" />
        </div>

        <div
          className={`mt-4 rounded-xl px-4 py-3 text-xs font-medium ${
            sudahDikonfirmasi
              ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          {sudahDikonfirmasi ? (
            <>
              ✓ Klien sudah dikonfirmasi melaksanakan tes
              {p.konfirmasiTesOleh ? ` oleh ${p.konfirmasiTesOleh.nama}` : ""}
              {p.konfirmasiTesPada
                ? ` · ${formatTanggalWaktu(p.konfirmasiTesPada)}`
                : ""}
              . Psikolog dapat menyusun interpretasi.
            </>
          ) : (
            "Belum dikonfirmasi. Kasus menunggu asisten memastikan klien sudah melaksanakan tes."
          )}
        </div>

        {bolehKelola && (
          <form action={konfirmasiPelaksanaanTes} className="mt-4">
            <input type="hidden" name="pendaftaranId" value={p.id} />
            <input
              type="hidden"
              name="konfirmasi"
              value={sudahDikonfirmasi ? "0" : "1"}
            />
            <button
              className={`tombol w-full ${
                sudahDikonfirmasi ? "tombol-garis" : "tombol-utama"
              }`}
            >
              {sudahDikonfirmasi
                ? "Batalkan konfirmasi"
                : "Konfirmasi klien sudah melaksanakan tes"}
            </button>
          </form>
        )}
      </section>

      {/* Batas zona */}
      <section className="kartu border-dashed p-6">
        <h2 className="text-sm font-bold text-ink">
          {bolehKelola
            ? "Interpretasi tidak tersedia di sini"
            : "Zona 2 — mode baca"}
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-ink-soft">
          {bolehKelola
            ? "Tugas asisten psikolog hanya mengonfirmasi bahwa klien sudah melaksanakan tes. Penyusunan interpretasi dan laporan akhir (Zona 3) adalah kewenangan psikolog penanggung jawab."
            : "Anda dapat melihat status konfirmasi pelaksanaan tes. Interpretasi dan laporan disusun oleh psikolog penanggung jawab kasus."}
        </p>
      </section>
    </>
  );
}
