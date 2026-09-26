import Link from "next/link";

import {
  BadgeStatus,
  JudulHalaman,
  Kosong,
} from "@/components/dashboard/ui";
import { filterPendaftaranKlien, wajibKlien } from "@/lib/auth/dal";
import { labelStatusPendaftaran } from "@/lib/config";
import { nomorTahap } from "@/lib/alur";
import { keAngka } from "@/lib/pembayaran";
import { prisma } from "@/lib/prisma";
import { formatRupiah, formatTanggal, formatTanggalWaktu } from "@/lib/utils";

export default async function HalamanRiwayatKlien() {
  const sesi = await wajibKlien();
  const where = await filterPendaftaranKlien(sesi);

  const daftar = await prisma.pendaftaran.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      layanan: { select: { nama: true } },
      psikolog: { select: { nama: true } },
      pembayaran: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { jumlah: true, status: true, buktiUrl: true },
      },
      jadwal: {
        orderBy: { mulai: "asc" },
        take: 1,
        select: { mulai: true },
      },
    },
  });

  const perluBayar = daftar.filter(
    (p) =>
      p.pembayaran[0] &&
      p.pembayaran[0].status !== "TERVERIFIKASI" &&
      nomorTahap(p.status) < nomorTahap("TERJADWAL"),
  ).length;

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
                    </div>
                    <p className="mt-1.5 text-sm text-ink-soft">{p.layanan.nama}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {p.psikolog?.nama ?? "Psikolog belum ditetapkan"} ·{" "}
                      {p.metode === "ONLINE" ? "Daring" : "Tatap muka"} · daftar{" "}
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
                              ? "Bukti ditolak — kirim ulang"
                              : bayar.buktiUrl
                                ? "Bukti terkirim, menunggu verifikasi"
                                : "Belum bayar"}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-muted">Biaya dikonfirmasi admin</p>
                    )}
                  </div>
                </div>

                {/* Progres ringkas */}
                <div className="mt-4 flex items-center gap-3">
                  <span className="pil bg-paper-2 text-ink-soft">
                    Tahap {tahap} dari 8
                  </span>
                  <span className="text-xs text-muted">
                    {p.jadwal[0]
                      ? `Sesi: ${formatTanggalWaktu(p.jadwal[0].mulai)}`
                      : "Jadwal belum ditetapkan"}
                  </span>
                  <span className="ml-auto text-xs font-semibold text-brand-700">
                    Lihat detail →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

    </>
  );
}