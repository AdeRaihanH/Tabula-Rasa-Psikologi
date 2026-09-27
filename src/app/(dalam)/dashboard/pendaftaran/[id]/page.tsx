import Link from "next/link";
import { notFound } from "next/navigation";

import {
  BadgeStatus,
  JudulHalaman,
  Tabel,
  Td,
  Th,
} from "@/components/dashboard/ui";
import {
  buatJadwal,
  catatPembayaran,
  tetapkanPsikolog,
  verifikasiPembayaran,
} from "@/app/actions/admin";
import { cekSyaratTahap } from "@/app/actions/alur";
import { PanelTahap } from "@/components/dashboard/PanelTahap";
import { PanelDrive, UnggahBukti } from "@/components/dashboard/PanelDrive";
import { wajibKemampuan } from "@/lib/auth/dal";
import { tahapBerikutnya, tahapSebelumnya } from "@/lib/alur";
import { nilaiDatetimeLokal } from "@/lib/jadwal";
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
      pembayaran: { orderBy: { createdAt: "desc" } },
      jadwal: {
        orderBy: { mulai: "asc" },
        include: { psikolog: { select: { nama: true } } },
      },
    },
  });

  if (!p) notFound();

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
  const jadwalAda = p.jadwal[0] ?? null;

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
                nilai={p.metode === "ONLINE" ? "Daring" : "Tatap muka"}
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
            <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-ink-soft">
              Pembayaran
            </h2>

            {p.pembayaran.length === 0 ? (
              <p className="mt-3 text-sm text-muted">Belum ada tagihan.</p>
            ) : (
              <div className="mt-4">
                <Tabel>
                  <thead>
                    <tr>
                      <Th>Jumlah</Th>
                      <Th>Metode</Th>
                      <Th>Status</Th>
                      <Th>Aksi</Th>
                      <Th>Bukti</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.pembayaran.map((b) => (
                      <tr key={b.id}>
                        <Td className="font-semibold text-ink">
                          {formatRupiah(b.jumlah.toString())}
                        </Td>
                        <Td className="text-xs">{b.metode}</Td>
                        <Td>
                          <BadgeStatus status={b.status} label={b.status} />
                        </Td>
                        <Td>
                          {b.status === "MENUNGGU" ? (
                            <div className="flex gap-2">
                              <form action={verifikasiPembayaran}>
                                <input type="hidden" name="id" value={b.id} />
                                <input type="hidden" name="keputusan" value="TERIMA" />
                                <button className="pil bg-emerald-50 text-emerald-700">
                                  Terima
                                </button>
                              </form>
                              <form action={verifikasiPembayaran}>
                                <input type="hidden" name="id" value={b.id} />
                                <input type="hidden" name="keputusan" value="TOLAK" />
                                <button className="pil bg-red-50 text-red-700">
                                  Tolak
                                </button>
                              </form>
                            </div>
                          ) : (
                            <span className="text-xs text-muted">
                              {b.diverifikasiPada ? formatTanggal(b.diverifikasiPada) : "—"}
                            </span>
                          )}
                        </Td>
                        <Td>
                          <UnggahBukti
                            pembayaranId={b.id}
                            buktiUrl={b.buktiUrl}
                            driveSiap={driveSiap}
                          />
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Tabel>
                <p className="mt-3 text-xs text-muted">
                  Total terverifikasi:{" "}
                  <span className="font-semibold text-ink">
                    {formatRupiah(totalDibayar)}
                  </span>
                </p>
              </div>
            )}

            <form action={catatPembayaran} className="mt-5 grid gap-3 border-t border-line pt-5 sm:grid-cols-3">
              <input type="hidden" name="pendaftaranId" value={p.id} />
              <div>
                <label className="label" htmlFor="jumlah">
                  Jumlah tagihan
                </label>
                <input id="jumlah" name="jumlah" type="number" min="0" className="input" placeholder="1500000" />
              </div>
              <div>
                <label className="label" htmlFor="metode">
                  Metode
                </label>
                <select id="metode" name="metode" className="input" defaultValue="transfer">
                  <option value="transfer">Transfer bank</option>
                  <option value="tunai">Tunai</option>
                  <option value="invoice">Invoice institusi</option>
                </select>
              </div>
              <div className="flex items-end">
                <button className="tombol tombol-garis w-full">Catat tagihan</button>
              </div>
            </form>
          </section>

          {/* Jadwal */}
          <section className="kartu p-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-ink-soft">
              Jadwal Sesi
            </h2>

            {p.jadwal.length === 0 ? (
              <p className="mt-3 text-sm text-muted">Belum ada jadwal.</p>
            ) : (
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
                      {j.psikolog.nama} · {j.metode === "ONLINE" ? "Daring" : "Tatap muka"}
                      {j.lokasi ? ` · ${j.lokasi}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            <form action={buatJadwal} className="mt-5 grid gap-3 border-t border-line pt-5 sm:grid-cols-2">
              <input type="hidden" name="pendaftaranId" value={p.id} />
              {jadwalAda && (
                <p className="rounded-xl bg-paper-2 px-4 py-2.5 text-xs leading-relaxed text-ink-soft sm:col-span-2">
                  Klien sudah memilih jadwal saat mendaftar. Menyimpan formulir
                  ini akan <strong>memperbarui</strong> jadwal tersebut.
                </p>
              )}
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
                <label className="label" htmlFor="metode-jadwal">
                  Metode
                </label>
                <select
                  id="metode-jadwal"
                  name="metode"
                  className="input"
                  defaultValue={jadwalAda?.metode ?? p.metode}
                >
                  <option value="OFFLINE">Tatap muka</option>
                  <option value="ONLINE">Daring</option>
                </select>
              </div>
              <div>
                <label className="label" htmlFor="lokasi">
                  Lokasi / tautan
                </label>
                <input
                  id="lokasi"
                  name="lokasi"
                  className="input"
                  placeholder="Ruang 1 / link meeting"
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
              Lembar tes dan skor mentah (Zona 2) hanya dapat diakses asisten
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
