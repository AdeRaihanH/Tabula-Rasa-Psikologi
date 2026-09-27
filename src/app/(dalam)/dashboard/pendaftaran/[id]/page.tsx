import Link from "next/link";
import { notFound } from "next/navigation";

import {
  BadgeStatus,
  JudulHalaman,
} from "@/components/dashboard/ui";
import {
  buatJadwal,
  buatJadwalDariPilihan,
  tetapkanPsikolog,
  verifikasiPembayaran,
} from "@/app/actions/admin";
import { cekSyaratTahap } from "@/lib/alur-otomatis";
import { PanelTahap } from "@/components/dashboard/PanelTahap";
import { PanelDrive, UnggahBukti } from "@/components/dashboard/PanelDrive";
import { PratinjauBukti } from "@/components/dashboard/PratinjauBukti";
import { wajibKemampuan } from "@/lib/auth/dal";
import { tahapBerikutnya, tahapSebelumnya } from "@/lib/alur";
import { nilaiDatetimeLokal, parsePreferensiJadwal } from "@/lib/jadwal";
import { butuhPeringatanJam } from "@/lib/jadwal";
import { driveAktif } from "@/lib/gdrive";
import { labelKategori, labelStatusPendaftaran } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import { boleh, infoZona } from "@/lib/rbac";
import { formatRupiah, formatTanggal, formatTanggalWaktu } from "@/lib/utils";

function Baris({ label, nilai }: { label: string; nilai: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line py-2.5 last:border-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-right text-sm font-medium text-ink">{nilai || "—"}</span>
    </div>
  );
}

export default async function DetailPendaftaran({
  params,
}: PageProps<"/dashboard/pendaftaran/[id]">) {
  const sesi = await wajibKemampuan("pendaftaran:lihat");
  const { id } = await params;

  const p = await prisma.pendaftaran.findUnique({
    where: { id },
    include: {
      klien: true,
      layanan: true,
      psikolog: { select: { id: true, nama: true } },
      pembayaran: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          jumlah: true,
          metode: true,
          status: true,
          catatan: true,
          updatedAt: true,
          diverifikasiPada: true,
          diverifikasiOleh: { select: { nama: true } },
        },
      },
      jadwal: {
        orderBy: { mulai: "asc" },
        include: { psikolog: { select: { nama: true } } },
      },
    },
  });

  if (!p) notFound();

  const buktiAdaMapAdmin = new Map(
    (
      await prisma.pembayaran.findMany({
        where: { pendaftaranId: id, buktiUrl: { not: null } },
        select: { id: true },
      })
    ).map((b) => [b.id, true] as const),
  );
  const pembayaranDenganFlag = p.pembayaran.map((b) => ({
    ...b,
    adaBukti: buktiAdaMapAdmin.has(b.id),
  }));

  const daftarPsikolog = await prisma.user.findMany({
    where: { role: "PSIKOLOG", aktif: true },
    select: { id: true, nama: true, profilPsikolog: { select: { spesialisasi: true } } },
    orderBy: { nama: "asc" },
  });

  const totalDibayar = p.pembayaran
    .filter((b) => b.status === "TERVERIFIKASI")
    .reduce((a, b) => a + Number(b.jumlah), 0);

  const driveSiap = driveAktif();

  // Jadwal pertama (biasanya pilihan klien saat mendaftar) dipakai untuk
  // mengisi awal formulir agar admin tinggal menyesuaikan bila perlu.
  // "Masih pilihan klien" hanya benar bila baris belum pernah diubah admin
  // (updatedAt masih sama dengan createdAt) — bukan sekadar dari teks catatan,
  // agar badge tidak menyesatkan setelah jam digeser.
  const jadwalAda = p.jadwal[0] ?? null;
  const jadwalDiubahAdmin =
    jadwalAda != null &&
    (jadwalAda.updatedAt.getTime() > jadwalAda.createdAt.getTime() ||
      (typeof jadwalAda.catatan === "string" &&
        /diubah admin|ditetapkan admin/i.test(jadwalAda.catatan)));
  // Nada mengikuti edit terakhir: "peringatan" hanya bila edit terakhir
  // menggeser jam; edit info-only (ruangan) memakai nada netral.
  const jadwalPeringatan =
    jadwalAda != null &&
    butuhPeringatanJam(jadwalAda, parsePreferensiJadwal(p.kebutuhan));
  const jadwalDariKlien =
    !jadwalDiubahAdmin &&
    Boolean(jadwalAda?.catatan?.includes("pendaftar"));
  // Pilihan hari/jam klien pada formulir — dipakai bila baris jadwal belum ada.
  const preferensiJadwal =
    p.jadwal.length === 0 ? parsePreferensiJadwal(p.kebutuhan) : null;

  const tahapBerikut = tahapBerikutnya(p.status);
  const syarat = tahapBerikut
    ? await cekSyaratTahap(p.id, tahapBerikut.kode)
    : { ok: true, pesan: "" };
  const tahapSebelum = tahapSebelumnya(p.status);

  return (
    <>
      <div className="mb-5">
        <Link href="/dashboard/pendaftaran" className="text-xs font-medium text-muted hover:text-brand-700">
          ← Kembali ke daftar pendaftaran
        </Link>
      </div>

      <JudulHalaman
        judul={p.nomor}
        keterangan={`${p.klien.nama} · ${p.layanan.nama} · masuk ${formatTanggal(p.createdAt)}`}
        aksi={
          <BadgeStatus status={p.status} label={labelStatusPendaftaran[p.status] ?? p.status} />
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          {/* Data klien — Zona 1 */}
          <section className="kartu p-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: infoZona.ZONA_1.warna }} />
              <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-ink-soft">
                Data Diri Klien
              </h2>
            </div>
            <Baris label="Nama lengkap" nilai={p.klien.nama} />
            <Baris label="Email" nilai={p.klien.email} />
            <Baris label="Telepon" nilai={p.klien.telepon} />
            <Baris
              label="Tanggal lahir"
              nilai={p.klien.tanggalLahir ? formatTanggal(p.klien.tanggalLahir) : "—"}
            />
            <Baris
              label="Jenis kelamin"
              nilai={
                p.klien.jenisKelamin === "L"
                  ? "Laki-laki"
                  : p.klien.jenisKelamin === "P"
                    ? "Perempuan"
                    : "—"
              }
            />
            <Baris label="Alamat" nilai={p.klien.alamat} />
            <Baris label="Pekerjaan" nilai={p.klien.pekerjaan} />
            <Baris label="Institusi" nilai={p.klien.institusi} />
          </section>

          {/* Kebutuhan */}
          <section className="kartu p-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-ink-soft">
              Kebutuhan & Kesepakatan
            </h2>
            <div className="mt-4">
              <Baris
                label="Kategori"
                nilai={labelKategori[p.layanan.kategori] ?? p.layanan.kategori}
              />
              <Baris label="Layanan" nilai={p.layanan.nama} />
              <Baris
                label="Metode"
                nilai="Tatap Muka"
              />
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
              <Baris label="Sumber" nilai={p.sumber ?? "web"} />
            </div>
            {p.kebutuhan && (
              <div className="mt-4 rounded-xl bg-paper-2 p-4">
                <p className="text-xs font-semibold text-muted">Catatan kebutuhan</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                  {p.kebutuhan}
                </p>
              </div>
            )}
          </section>

          {/* Pembayaran */}
          <section className="kartu p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-ink-soft">
                Pembayaran
              </h2>
              {pembayaranDenganFlag.some(
                (b) => b.status === "MENUNGGU" && b.adaBukti,
              ) && (
                <span className="pil bg-amber-100 font-semibold text-amber-800">
                  Ada bukti perlu diverifikasi
                </span>
              )}
            </div>

            {pembayaranDenganFlag.length === 0 ? (
              <p className="mt-3 text-sm text-muted">Belum ada tagihan.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {pembayaranDenganFlag.map((b) => {
                  const adaBukti = b.adaBukti;
                  const perluVerifikasi =
                    b.status === "MENUNGGU" && adaBukti;
                  return (
                    <div
                      key={b.id}
                      className={`rounded-xl border p-4 ${
                        perluVerifikasi
                          ? "border-amber-300 bg-amber-50/50"
                          : "border-line bg-white"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-bold text-ink">
                          {formatRupiah(b.jumlah.toString())}
                          <span className="ml-2 text-xs font-normal text-muted">
                            {b.metode} · dikirim{" "}
                            {formatTanggal(b.updatedAt)}
                          </span>
                        </p>
                        <BadgeStatus status={b.status} label={b.status} />
                      </div>

                      {perluVerifikasi && (
                        <p className="mt-2 rounded-lg border border-amber-200 bg-amber-100/70 px-3 py-2 text-xs font-semibold text-amber-800">
                          Bukti pembayaran baru dari klien — silakan periksa
                          lalu Terima / Tolak.
                        </p>
                      )}
                      {!adaBukti && b.status === "MENUNGGU" && (
                        <p className="mt-2 text-xs text-muted">
                          Menunggu klien mengunggah bukti pembayaran.
                        </p>
                      )}
                      {b.catatan && b.status === "DITOLAK" && (
                        <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                          Alasan penolakan (dilihat klien): {b.catatan}
                        </p>
                      )}
                      {b.catatan && b.status !== "DITOLAK" && (
                        <p className="mt-2 text-xs text-ink-soft">
                          Catatan: {b.catatan}
                        </p>
                      )}
                      {b.status !== "MENUNGGU" && (
                        <p className="mt-1 text-[0.7rem] text-muted">
                          Diverifikasi{" "}
                          {b.diverifikasiPada
                            ? formatTanggal(b.diverifikasiPada)
                            : "—"}
                          {b.diverifikasiOleh?.nama
                            ? ` oleh ${b.diverifikasiOleh.nama}`
                            : ""}
                        </p>
                      )}

                      {/* Bukti */}
                      <div className="mt-3">
                        {adaBukti ? (
                          <PratinjauBukti
                            pembayaranId={b.id}
                            tampilMini
                            label="Lihat bukti lengkap ↗"
                            className="tombol tombol-garis !py-1.5 !text-xs"
                          />
                        ) : (
                          <p className="text-xs text-muted">
                            Belum ada bukti terlampir.
                          </p>
                        )}
                        <UnggahBukti
                          pembayaranId={b.id}
                          buktiUrl={null}
                          driveSiap={driveSiap}
                        />
                      </div>

                      {/* Verifikasi */}
                      {b.status === "MENUNGGU" ? (
                        <div className="mt-3 grid gap-2 border-t border-line pt-3 sm:grid-cols-2">
                          <form
                            action={verifikasiPembayaran}
                            className="flex gap-2"
                          >
                            <input type="hidden" name="id" value={b.id} />
                            <input
                              type="hidden"
                              name="keputusan"
                              value="TERIMA"
                            />
                            <button className="tombol tombol-utama w-full !py-2 !text-xs disabled:opacity-50">
                              Terima pembayaran
                            </button>
                          </form>
                          <form
                            action={verifikasiPembayaran}
                            className="flex gap-2"
                          >
                            <input type="hidden" name="id" value={b.id} />
                            <input
                              type="hidden"
                              name="keputusan"
                              value="TOLAK"
                            />
                            <input
                              name="catatan"
                              required
                              minLength={5}
                              placeholder="Alasan penolakan (wajib — dilihat klien)"
                              title="Wajib isi alasan penolakan karena akan ditampilkan ke klien"
                              className="input !py-2 !text-xs"
                            />
                            <button className="tombol w-full !bg-red-600 !py-2 !text-xs !text-white hover:!bg-red-700">
                              Tolak
                            </button>
                          </form>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
                <p className="mt-3 text-xs text-muted">
                  Total terverifikasi:{" "}
                  <span className="font-semibold text-ink">
                    {formatRupiah(totalDibayar)}
                  </span>
                </p>
              </div>
            )}


          </section>

          {/* Jadwal */}
          <section className="kartu p-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-ink-soft">
              Jadwal Sesi
            </h2>

            {p.jadwal.length === 0 ? (
              <div className="mt-3 space-y-3">
                <p className="text-sm text-muted">Belum ada jadwal.</p>
                {preferensiJadwal && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
                    Klien sudah memilih{" "}
                    <strong>
                      {formatTanggal(
                        new Date(`${preferensiJadwal.tanggal}T00:00:00+07:00`),
                      )}{" "}
                      · {preferensiJadwal.waktu}
                    </strong>{" "}
                    saat mendaftar, tetapi baris jadwal belum terbentuk (pendaftar
                    lama). Buatkan otomatis dari pilihan tersebut.
                    <form action={buatJadwalDariPilihan} className="mt-3">
                      <input type="hidden" name="pendaftaranId" value={p.id} />
                      <button className="tombol tombol-utama !py-2 !text-xs">
                        Buatkan dari pilihan klien
                      </button>
                    </form>
                  </div>
                )}
              </div>
            ) : (
              <>
                {jadwalDariKlien && (
                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[0.68rem] font-semibold text-emerald-700">
                    ✓ Jadwal pilihan klien — otomatis dari pendaftaran
                  </p>
                )}
                {jadwalPeringatan && (
                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-[0.68rem] font-semibold text-amber-800">
                    ⚠ Terakhir: jam diubah — klien melihat waktu terbaru + notifikasi
                  </p>
                )}
                {!jadwalPeringatan && jadwalDiubahAdmin && (
                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[0.68rem] font-semibold text-emerald-700">
                    ℹ Terakhir: info dilengkapi (ruangan) — klien diberi tahu tanpa klaim jam diubah
                  </p>
                )}
                <ul className="mt-4 space-y-3">
                  {p.jadwal.map((j) => (
                    <li key={j.id} className="rounded-xl border border-line p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-ink">
                          {formatTanggalWaktu(j.mulai)}
                        </span>
                        <BadgeStatus status={j.status} label={j.status} />
                      </div>
                      <p className="mt-1 text-xs text-muted">
                        {j.psikolog.nama} · Tatap Muka
                        {j.lokasi ? ` · ${j.lokasi}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <form action={buatJadwal} className="mt-5 grid gap-3 border-t border-line pt-5 sm:grid-cols-2">
              <input type="hidden" name="pendaftaranId" value={p.id} />
              <p className="rounded-xl bg-paper-2 px-4 py-2.5 text-xs leading-relaxed text-ink-soft sm:col-span-2">
                {jadwalAda ? (
                  jadwalPeringatan ? (
                    <>
                      Jam jadwal ini <strong>sudah pernah digeser</strong> dari
                      pilihan awal klien. Setiap penyimpanan ulang akan
                      memperbarui waktu yang dilihat klien beserta
                      notifikasinya — pastikan jam dan ruangan sudah benar.
                    </>
                  ) : jadwalDiubahAdmin ? (
                    <>
                      Edit terakhir pada jadwal ini hanya{" "}
                      <strong>melengkapi info</strong> (mis. ruangan) — jam
                      tidak berubah. Menyimpan ulang dengan jam yang sama tidak
                      akan memunculkan klaim &quot;diubah&quot; ke klien; yang
                      ditonjolkan adalah ruangannya.
                    </>
                  ) : (
                    <>
                      Jadwal sudah terisi dari pilihan klien saat mendaftar.
                      Formulir ini hanya untuk{" "}
                      <strong>mengubah/mengoreksi</strong> bila diperlukan
                      (mis. situasi darurat) — klien otomatis diberi tahu
                      lewat notifikasi & halaman detailnya.
                    </>
                  )
                ) : (
                  <>
                    Isi formulir ini hanya bila klien belum memilih jadwal, atau
                    untuk menetapkan jadwal secara manual.
                  </>
                )}
              </p>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="psikologId">
                  Psikolog
                </label>
                <select
                  id="psikologId"
                  name="psikologId"
                  className="input"
                  defaultValue={jadwalAda?.psikologId ?? p.psikologId ?? ""}
                >
                  <option value="">Pilih psikolog…</option>
                  {daftarPsikolog.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nama}
                      {d.profilPsikolog?.spesialisasi ? ` — ${d.profilPsikolog.spesialisasi}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="mulai">
                  Mulai
                </label>
                <input
                  id="mulai"
                  name="mulai"
                  type="datetime-local"
                  className="input"
                  defaultValue={jadwalAda ? nilaiDatetimeLokal(jadwalAda.mulai) : undefined}
                />
              </div>
              <div>
                <label className="label" htmlFor="selesai">
                  Selesai
                </label>
                <input
                  id="selesai"
                  name="selesai"
                  type="datetime-local"
                  className="input"
                  defaultValue={jadwalAda ? nilaiDatetimeLokal(jadwalAda.selesai) : undefined}
                />
              </div>
              <div>
                <label className="label" htmlFor="lokasi">
                  Lokasi
                </label>
                <input
                  id="lokasi"
                  name="lokasi"
                  className="input"
                  placeholder="Ruang 1, Biro Tabula Rasa"
                  defaultValue={jadwalAda?.lokasi ?? ""}
                />
              </div>
              <div className="sm:col-span-2">
                <button className="tombol tombol-utama w-full">
                  {jadwalAda ? "Perbarui jadwal" : "Buat jadwal"}
                </button>
              </div>
            </form>
          </section>
        </div>

        {/* Kolom kanan */}
        <div className="space-y-6">
          <PanelTahap
            pendaftaranId={p.id}
            status={p.status}
            berikut={
              tahapBerikut
                ? {
                    nomor: tahapBerikut.nomor,
                    judul: tahapBerikut.judul,
                    aktor: tahapBerikut.aktor,
                  }
                : null
            }
            syarat={syarat}
            sebelum={
              tahapSebelum
                ? { nomor: tahapSebelum.nomor, judul: tahapSebelum.judul }
                : null
            }
            bolehNaik={
              Boolean(tahapBerikut) &&
              (tahapBerikut!.peran as readonly string[]).includes(sesi.role)
            }
            bolehBatalkan={boleh(sesi.role, "pendaftaran:kelola")}
          />

          <section className="kartu p-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-ink-soft">
              Psikolog Penanggung Jawab
            </h2>
            <p className="mt-2 text-xs text-muted">
              Hanya psikolog ini yang dapat membuka laporan Zona 3 untuk kasus ini.
            </p>
            <form action={tetapkanPsikolog} className="mt-4 space-y-3">
              <input type="hidden" name="id" value={p.id} />
              <select name="psikologId" className="input" defaultValue={p.psikologId ?? ""}>
                <option value="">Belum ditetapkan</option>
                {daftarPsikolog.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nama}
                  </option>
                ))}
              </select>
              <button className="tombol tombol-garis w-full">Tetapkan</button>
            </form>
          </section>

          <PanelDrive
            pendaftaranId={p.id}
            folderUrl={p.folderDriveUrl}
            driveSiap={driveSiap}
          />

          {/* Zona terkunci */}
          <section className="kartu border-dashed p-6">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-paper-2 text-muted">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="4" y="10" width="16" height="10" rx="2" />
                  <path d="M8 10V7a4 4 0 018 0v3" />
                </svg>
              </span>
              <h2 className="text-sm font-bold text-ink">Zona 2 & 3 terkunci</h2>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-ink-soft">
              Konfirmasi pelaksanaan tes (Zona 2) hanya dapat diakses asisten
              psikolog. Laporan hasil dan interpretasi (Zona 3) hanya dapat
              diakses psikolog penanggung jawab. Admin tidak memiliki akses ke
              kedua zona tersebut.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
