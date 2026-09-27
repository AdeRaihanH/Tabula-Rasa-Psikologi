import Link from "next/link";

import {
  BadgeStatus,
  JudulHalaman,
  Kosong,
} from "@/components/dashboard/ui";
import { Paginasi } from "@/components/dashboard/Paginasi";
import { filterPendaftaranKlien, wajibKlien } from "@/lib/auth/dal";
import { labelStatusPendaftaran } from "@/lib/config";
import { nomorTahap, TAHAP } from "@/lib/alur";
import {
  butuhPeringatanJam,
  jadwalDiubahAdmin,
  parsePreferensiJadwal,
} from "@/lib/jadwal";
import { keAngka } from "@/lib/pembayaran";
import { UKURAN_HALAMAN, hitungPaginasi } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import { formatRupiah, formatTanggal, formatTanggalWaktu } from "@/lib/utils";

export default async function HalamanRiwayatKlien({
  searchParams,
}: PageProps<"/dashboard/riwayat">) {
  const sesi = await wajibKlien();
  const sp = await searchParams;
  const { hal, skip, take } = hitungPaginasi(sp?.hal);
  const where = await filterPendaftaranKlien(sesi);

  const [daftar, total] = await Promise.all([
    prisma.pendaftaran.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: {
        layanan: { select: { nama: true } },
        psikolog: { select: { nama: true } },
        pembayaran: {
          orderBy: { createdAt: "desc" },
          take: 1,
          // Jangan ambil isi buktiUrl (bisa belasan MB base64) di daftar —
          // cukup tahu ada/tidak lewat query ringan di bawah.
          // `catatan` kecil (alasan penolakan) aman ikut diambil agar klien
          // langsung tahu kenapa ditolak tanpa membuka detail.
          select: { id: true, jumlah: true, status: true, catatan: true },
        },
        jadwal: {
          orderBy: { mulai: "asc" },
          take: 1,
          select: {
            mulai: true,
            lokasi: true,
            catatan: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    }),
    prisma.pendaftaran.count({ where }),
  ]);

  // Peta pendaftaranId -> ada bukti (tanpa memuat isi berkas).
  const buktiAdaSet = new Set(
    (
      await prisma.pembayaran.findMany({
        where: {
          pendaftaranId: { in: daftar.map((p) => p.id) },
          buktiUrl: { not: null },
        },
        select: { pendaftaranId: true },
      })
    ).map((b) => b.pendaftaranId),
  );

  // Hitungan seluruh riwayat (bukan hanya halaman ini).
  const perluBayar = await prisma.pendaftaran.count({
    where: {
      AND: [
        where,
        {
          status: {
            in: ["BARU", "SKRINING", "MENUNGGU_PEMBAYARAN", "TERVERIFIKASI"],
          },
        },
        { pembayaran: { some: { status: { not: "TERVERIFIKASI" } } } },
      ],
    },
  });

  return (
    <>
      <JudulHalaman
        judul="Riwayat Pendaftaran"
        keterangan="Semua pendaftaran layanan Anda beserta status terkini."
        aksi={
          <Link href="/daftar" className="tombol tombol-utama">
            Daftar Layanan Baru
          </Link>
        }
      />

      {perluBayar > 0 && (
        <div className="kartu mb-6 border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-semibold text-amber-800">
            {perluBayar} pendaftaran menunggu pembayaran
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-amber-800/80">
            Buka detail pendaftaran untuk melihat nominal dan mengunggah bukti
            pembayaran.
          </p>
        </div>
      )}

      {daftar.length === 0 ? (
        <Kosong
          judul="Belum ada pendaftaran"
          keterangan="Anda belum pernah mendaftar layanan. Mulai dengan memilih layanan dan psikolog."
          aksi={
            <Link href="/daftar" className="tombol tombol-utama">
              Daftar Layanan
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {daftar.map((p) => {
            const bayar = p.pembayaran[0];
            const tahap = nomorTahap(p.status);
            const sesi = p.jadwal[0] ?? null;
            const sesiPeringatan =
              sesi != null &&
              butuhPeringatanJam(sesi, parsePreferensiJadwal(p.kebutuhan));
            const sesiDiperbarui =
              !sesiPeringatan && sesi != null && jadwalDiubahAdmin(sesi);
            const ruangan = sesi?.lokasi?.trim() || null;

            return (
              <Link
                key={p.id}
                href={`/dashboard/riwayat/${p.id}`}
                className="kartu block p-6 transition-all hover:border-brand-300"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-bold text-ink">{p.nomor}</h2>
                      <BadgeStatus
                        status={p.status}
                        label={labelStatusPendaftaran[p.status] ?? p.status}
                      />
                      {bayar?.status === "DITOLAK" && (
                        <span className="pil bg-red-600 text-white">
                          Bukti Ditolak
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-sm text-ink-soft">{p.layanan.nama}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {p.psikolog?.nama ?? "Psikolog belum ditetapkan"} ·{" "}
                      Tatap Muka · daftar{" "}
                      {formatTanggal(p.createdAt)}
                    </p>
                  </div>

                  <div className="text-right">
                    {bayar ? (
                      <>
                        <p className="text-xs text-muted">Biaya</p>
                        <p className="text-base font-bold text-brand-700">
                          {formatRupiah(keAngka(bayar.jumlah))}
                        </p>
                        <p
                          className={`mt-0.5 text-[0.7rem] font-semibold ${
                            bayar.status === "TERVERIFIKASI"
                              ? "text-emerald-700"
                              : bayar.status === "DITOLAK"
                                ? "text-red-600"
                                : "text-amber-700"
                          }`}
                        >
                          {bayar.status === "TERVERIFIKASI"
                            ? "Pembayaran terverifikasi"
                            : bayar.status === "DITOLAK"
                              ? "Bukti DITOLAK — kirim ulang"
                              : buktiAdaSet.has(p.id)
                                ? "Bukti terkirim, menunggu verifikasi"
                                : "Belum bayar"}
                        </p>
                        {bayar.status === "DITOLAK" && bayar.catatan && (
                          <p className="mt-1 max-w-64 truncate text-[0.7rem] text-red-600">
                            Alasan: {bayar.catatan}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-muted">Biaya dikonfirmasi admin</p>
                    )}
                  </div>
                </div>

                {/* Progres ringkas */}
                <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <span className="pil bg-paper-2 text-ink-soft">
                    Tahap {tahap} dari {TAHAP.length}
                  </span>
                  <span className="text-xs text-muted">
                    {sesi
                      ? `Sesi: ${formatTanggalWaktu(sesi.mulai)}`
                      : "Jadwal belum ditetapkan"}
                  </span>
                  {sesiPeringatan && (
                    <span className="pil bg-amber-100 font-semibold text-amber-800">
                      ⚠ Jadwal diubah admin
                    </span>
                  )}
                  {sesiDiperbarui && (
                    <span className="pil bg-emerald-50 font-semibold text-emerald-700">
                      ℹ Info sesi diperbarui
                    </span>
                  )}
                  {ruangan && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                      {ruangan}
                    </span>
                  )}
                  <span className="ml-auto text-xs font-semibold text-brand-700">
                    Lihat detail →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <Paginasi
        jalur="/dashboard/riwayat"
        hal={hal}
        total={total}
        ukuran={UKURAN_HALAMAN}
      />
    </>
  );
}