import Link from "next/link";
import { redirect } from "next/navigation";

import { BadgeStatus, JudulHalaman } from "@/components/dashboard/ui";
import { AlurStatus } from "@/components/dashboard/AlurStatus";
import { UnggahBuktiKlien } from "@/components/dashboard/UnggahBuktiKlien";
import { filterPendaftaranKlien, wajibKlien } from "@/lib/auth/dal";
import { labelStatusPendaftaran } from "@/lib/config";
import { parsePreferensiJadwal } from "@/lib/jadwal";
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
      // Jangan sertakan isi buktiUrl (base64 belasan MB) — cukup metadata.
      // Keberadaan bukti dicek lewat query ringan di bawah.
      pembayaran: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          jumlah: true,
          status: true,
          catatan: true,
        },
      },
      // Tes yang dibagikan asisten. Klien hanya melihat nama alat, tautan,
      // dan instruksi — isi soal & skor tetap di Zona 2.
      lembarTes: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          status: true,
          tautan: true,
          instruksi: true,
          alatTes: { select: { nama: true } },
          jadwalSesi: { select: { mulai: true, metode: true } },
        },
      },
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

  const daftarBayar = p.pembayaran ?? [];
  const semuaTerverifikasi =
    daftarBayar.length > 0 &&
    daftarBayar.every((b) => b.status === "TERVERIFIKASI");
  const buktiAdaMap = new Map(
    (
      await prisma.pembayaran.findMany({
        where: {
          pendaftaranId: p.id,
          buktiUrl: { not: null },
        },
        select: { id: true },
      })
    ).map((b) => [b.id, true] as const),
  );
  const adaBuktiUntuk = (pembayaranId: string) =>
    buktiAdaMap.has(pembayaranId);
  const adaDitolak = daftarBayar.some((b) => b.status === "DITOLAK");
  const daftarTes = p.lembarTes ?? [];
  const sekarang = new Date();
  // Pilihan hari/jam pendaftar: utama dari baris jadwal otomatis, cadangan
  // dari teks preferensi pada formulir pendaftaran.
  const preferensi =
    p.jadwal.length === 0 ? parsePreferensiJadwal(p.kebutuhan) : null;
  // Kartu tes tampil setelah pembayaran terverifikasi (atau bila asisten
  // sudah membagikan tes) — tidak perlu menunggu tahap lain.
  const tampilTes = semuaTerverifikasi || daftarTes.length > 0;
  const set = await prisma.pengaturanSitus.findUnique({ where: { id: "utama" } });

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
          <span className="flex flex-wrap items-center gap-2">
            <BadgeStatus
              status={p.status}
              label={labelStatusPendaftaran[p.status] ?? p.status}
            />
            {adaDitolak && (
              <span className="pil bg-red-600 text-white">Bukti Ditolak</span>
            )}
          </span>
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
              preferensi ? (
                <div className="mt-3 rounded-xl border border-brand-200 bg-brand-50/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-700">
                    Pilihan Anda saat mendaftar
                  </p>
                  <p className="mt-2 text-sm font-bold text-ink">
                    {formatTanggal(
                      new Date(`${preferensi.tanggal}T00:00:00+07:00`),
                    )}{" "}
                    · {preferensi.waktu}
                  </p>
                  <p className="mt-1 text-[0.7rem] text-muted">
                    Admin akan mengonfirmasi jadwal final setelah pembayaran
                    terverifikasi.
                  </p>
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted">
                  Jadwal belum tersedia. Admin akan mengonfirmasi jadwal
                  setelah pembayaran terverifikasi.
                </p>
              )
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
                    {j.catatan?.includes("pilihan pendaftar") && (
                      <p className="mt-1 text-[0.7rem] font-medium text-brand-700">
                        Sesuai jadwal yang Anda pilih saat mendaftar
                      </p>
                    )}
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

            {daftarBayar.length === 0 ? (
              <p className="mt-3 text-sm text-muted">
                Biaya layanan ini belum ditetapkan otomatis. Admin akan
                menghubungi Anda dengan rincian biaya.
              </p>
            ) : (
              <>
                {/* Instruksi transfer */}
                {!semuaTerverifikasi && set?.bankNomor && (
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

                <div className="mt-4 space-y-4">
                  {daftarBayar.map((bayar) => {
                    const adaBukti = adaBuktiUntuk(bayar.id);
                    return (
                      <div
                        key={bayar.id}
                        className="rounded-xl bg-paper-2 p-4"
                      >
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
                                : adaBukti
                                  ? "Bukti terkirim — menunggu verifikasi admin"
                                  : "Menunggu pembayaran"}
                          </span>
                        </p>


                        <UnggahBuktiKlien
                          pembayaranId={bayar.id}
                          status={bayar.status}
                          adaBukti={adaBukti}
                          catatan={bayar.catatan}
                        />
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </section>

          {/* Pelaksanaan tes */}
          {tampilTes && (
            <section className="kartu p-6">
              <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-ink-soft">
                Pelaksanaan Tes
              </h2>
              {daftarTes.length === 0 ? (
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  Pembayaran Anda sudah terverifikasi. Asisten sedang
                  menyiapkan tautan pengerjaan tes — tautan akan muncul di sini
                  dan aktif mengikuti jadwal Anda.
                </p>
              ) : (
                <ul className="mt-4 space-y-4">
                  {daftarTes.map((t) => {
                    const mulai =
                      t.jadwalSesi?.mulai ?? p.jadwal[0]?.mulai ?? null;
                    const sudahWaktunya =
                      !mulai || sekarang >= new Date(mulai);
                    const bisaKerjakan = Boolean(t.tautan) && sudahWaktunya;
                    return (
                      <li
                        key={t.id}
                        className="rounded-xl bg-paper-2 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-bold text-ink">
                            {t.alatTes.nama}
                          </p>
                          <BadgeStatus status={t.status} label={t.status} />
                        </div>
                        {t.instruksi && (
                          <p className="mt-2 text-xs leading-relaxed text-ink-soft">
                            {t.instruksi}
                          </p>
                        )}
                        {mulai && (
                          <p className="mt-1 text-[0.7rem] text-muted">
                            Jadwal: {formatTanggalWaktu(mulai)}
                            {t.jadwalSesi
                              ? ` · ${t.jadwalSesi.metode === "ONLINE" ? "Daring" : "Tatap muka"}`
                              : ""}
                          </p>
                        )}
                        <div className="mt-3">
                          {bisaKerjakan ? (
                            <a
                              href={t.tautan!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="tombol tombol-utama w-full !py-2 !text-xs"
                            >
                              Kerjakan Tes Sekarang ↗
                            </a>
                          ) : !t.tautan ? (
                            <p className="text-xs text-muted">
                              Tautan pengerjaan menyusul dari asisten.
                            </p>
                          ) : (
                            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                              Tautan tersedia dan akan aktif pada jadwal di
                              atas. Silakan kembali saat waktunya tiba.
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          )}

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
