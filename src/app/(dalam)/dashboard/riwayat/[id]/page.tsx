import Link from "next/link";
import { redirect } from "next/navigation";

import { BadgeStatus, JudulHalaman } from "@/components/dashboard/ui";
import { AlurStatus } from "@/components/dashboard/AlurStatus";
import { UnggahBuktiKlien } from "@/components/dashboard/UnggahBuktiKlien";
import { filterPendaftaranKlien, wajibKlien } from "@/lib/auth/dal";
import { labelStatusPendaftaran } from "@/lib/config";
import { driveAktif } from "@/lib/gdrive";
import { keAngka } from "@/lib/pembayaran";
import { prisma } from "@/lib/prisma";
import { formatRupiah, formatTanggal, formatTanggalWaktu } from "@/lib/utils";

function Baris({ label, nilai }: { label: string; nilai: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line py-2.5 last:border-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-right text-sm font-medium text-ink">{nilai || "—"}</span>
    </div>
  );
}

export default async function DetailRiwayatKlien({
  params,
}: PageProps<"/dashboard/riwayat/[id]">) {
  const sesi = await wajibKlien();
  const { id } = await params;

  // Batas kepemilikan: klien hanya boleh membuka pendaftarannya sendiri.
  const where = await filterPendaftaranKlien(sesi);
  const p = await prisma.pendaftaran.findFirst({
    where: { AND: [{ id }, where] },
    include: {
      layanan: { select: { nama: true, kategori: true, durasiMenit: true } },
      psikolog: { select: { nama: true } },
      pembayaran: { orderBy: { createdAt: "desc" } },
      jadwal: { orderBy: { mulai: "asc" } },
    },
  });

  if (!p) {
    // Bukan miliknya (atau tidak ada) — catat lalu alihkan.
    await prisma.auditLog.create({
      data: {
        userId: sesi.userId,
        aksi: "AKSES_DITOLAK",
        entitas: "Pendaftaran",
        entitasId: id,
        detail: "Klien mencoba membuka pendaftaran yang bukan miliknya",
      },
    });
    redirect("/dashboard/riwayat");
  }

  const bayar = p.pembayaran[0] ?? null;
  const sudahTerverifikasi = bayar?.status === "TERVERIFIKASI";
  const set = await prisma.pengaturanSitus.findUnique({ where: { id: "utama" } });
  const driveSiap = driveAktif();

  const wa = set?.whatsapp
    ? `https://wa.me/${set.whatsapp}?text=${encodeURIComponent(
        `Halo, saya ingin menanyakan pendaftaran ${p.nomor}.`,
      )}`
    : null;

  return (
    <>
      <div className="mb-5">
        <Link
          href="/dashboard/riwayat"
          className="text-xs font-medium text-muted hover:text-brand-700"
        >
          ← Kembali ke riwayat
        </Link>
      </div>

      <JudulHalaman
        judul={p.nomor}
        keterangan={`${p.layanan.nama} · daftar ${formatTanggal(p.createdAt)}`}
        aksi={
          <BadgeStatus
            status={p.status}
            label={labelStatusPendaftaran[p.status] ?? p.status}
          />
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-6">
          {/* Ringkasan */}
          <section className="kartu p-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-ink-soft">
              Ringkasan Layanan
            </h2>
            <div className="mt-4">
              <Baris label="Layanan" nilai={p.layanan.nama} />
              <Baris
                label="Metode"
                nilai={p.metode === "ONLINE" ? "Daring" : "Tatap muka"}
              />
              {p.layanan.durasiMenit && (
                <Baris label="Durasi" nilai={`${p.layanan.durasiMenit} menit`} />
              )}
              <Baris label="Psikolog" nilai={p.psikolog?.nama ?? "Belum ditetapkan"} />
              <Baris
                label="Informed consent"
                nilai={
                  p.informedConsent ? (
                    <span className="text-emerald-700">Sudah disetujui</span>
                  ) : (
                    <span className="text-red-600">Belum</span>
                  )
                }
              />
            </div>
          </section>

          {/* Jadwal */}
          <section className="kartu p-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-ink-soft">
              Jadwal Sesi
            </h2>
            {p.jadwal.length === 0 ? (
              <p className="mt-3 text-sm text-muted">
                Jadwal belum ditetapkan. Admin akan menghubungi Anda setelah
                pembayaran terverifikasi.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {p.jadwal.map((j) => (
                  <li key={j.id} className="rounded-xl border border-line p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-ink">
                        {formatTanggalWaktu(j.mulai)}
                      </span>
                      <BadgeStatus status={j.status} label={j.status} />
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {j.metode === "ONLINE" ? "Daring" : "Tatap muka"}
                      {j.lokasi ? ` · ${j.lokasi}` : ""}
                    </p>
                    {j.tautan && (
                      <a
                        href={j.tautan}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-xs font-semibold text-brand-700 hover:underline"
                      >
                        Buka tautan sesi ↗
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Kontak admin */}
          <section className="kartu p-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-ink-soft">
              Butuh bantuan?
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-ink-soft">
              Sampaikan nomor pendaftaran <strong>{p.nomor}</strong> agar admin
              dapat menemukan data Anda dengan cepat.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {wa && (
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tombol tombol-sage !py-2 !text-xs"
                >
                  Chat Admin
                </a>
              )}
              {set?.email && (
                <a
                  href={`mailto:${set.email}?subject=${encodeURIComponent(
                    `Pendaftaran ${p.nomor}`,
                  )}`}
                  className="tombol tombol-garis !py-2 !text-xs"
                >
                  Email Admin
                </a>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          {/* Alur tahapan */}
          <AlurStatus status={p.status} />

          {/* Pembayaran */}
          <section className="kartu p-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-ink-soft">
              Pembayaran
            </h2>

            {!bayar ? (
              <p className="mt-3 text-sm text-muted">
                Biaya layanan ini belum ditetapkan otomatis. Admin akan
                menghubungi Anda dengan rincian biaya.
              </p>
            ) : (
              <>
                <div className="mt-4 rounded-xl bg-paper-2 p-4">
                  <p className="text-xs text-muted">Total biaya</p>
                  <p className="mt-1 text-2xl font-bold text-brand-700">
                    {formatRupiah(keAngka(bayar.jumlah))}
                  </p>
                  <p className="mt-2 text-xs">
                    Status:{" "}
                    <span
                      className={`font-semibold ${
                        bayar.status === "TERVERIFIKASI"
                          ? "text-emerald-700"
                          : bayar.status === "DITOLAK"
                            ? "text-red-600"
                            : "text-amber-700"
                      }`}
                    >
                      {bayar.status === "TERVERIFIKASI"
                        ? "Terverifikasi"
                        : bayar.status === "DITOLAK"
                          ? "Bukti ditolak — silakan kirim ulang"
                          : "Menunggu pembayaran / verifikasi"}
                    </span>
                  </p>
                </div>

                {/* Instruksi transfer */}
                {!sudahTerverifikasi && set?.bankNomor && (
                  <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50/60 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-700">
                      Transfer ke
                    </p>
                    <p className="mt-2 font-bold text-ink">
                      {set.bankNama ?? "Rekening biro"}
                    </p>
                    <p className="mt-1 font-mono text-lg font-bold tracking-wider text-brand-700">
                      {set.bankNomor}
                    </p>
                    {set.bankAtasNama && (
                      <p className="mt-1 text-xs text-ink-soft">
                        a.n. {set.bankAtasNama}
                      </p>
                    )}
                    {set.instruksiPembayaran && (
                      <p className="mt-3 text-xs leading-relaxed text-ink-soft">
                        {set.instruksiPembayaran}
                      </p>
                    )}
                  </div>
                )}

                <UnggahBuktiKlien
                  pembayaranId={bayar.id}
                  buktiUrl={bayar.buktiUrl}
                  driveSiap={driveSiap}
                  sudahTerverifikasi={sudahTerverifikasi}
                />
              </>
            )}
          </section>

          <div className="kartu border-dashed p-5">
            <p className="text-xs leading-relaxed text-ink-soft">
              <span className="font-semibold text-ink">Catatan:</span> hasil
              asesmen dan interpretasi psikolog tidak ditampilkan di portal ini.
              Keduanya diserahkan langsung oleh psikolog melalui sesi umpan
              balik, sesuai sistem kerahasiaan biro.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
