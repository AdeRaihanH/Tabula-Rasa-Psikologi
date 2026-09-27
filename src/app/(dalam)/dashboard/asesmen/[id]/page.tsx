import Link from "next/link";
import { notFound } from "next/navigation";

import {
  BadgeStatus,
  BadgeZona,
  JudulHalaman,
} from "@/components/dashboard/ui";
import { simpanSkor, simpanTautanTes, tambahLembarTes, ubahStatusLembarTes } from "@/app/actions/asesmen";
import { cekSyaratTahap } from "@/app/actions/alur";
import { PanelTahap } from "@/components/dashboard/PanelTahap";
import { wajibKemampuan } from "@/lib/auth/dal";
import { tahapBerikutnya, tahapSebelumnya } from "@/lib/alur";
import { parsePreferensiJadwal } from "@/lib/jadwal";
import { boleh } from "@/lib/rbac";
import { labelStatusPendaftaran } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import { formatTanggal, formatTanggalWaktu } from "@/lib/utils";

const statusLembar = ["MENUNGGU", "DIKERJAKAN", "SKOR_DIISI", "SELESAI"];

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
      layanan: { select: { nama: true } },
      psikolog: { select: { nama: true } },
      jadwal: { orderBy: { mulai: "asc" } },
      lembarTes: {
        orderBy: { createdAt: "asc" },
        include: {
          alatTes: { select: { nama: true, kode: true, kategori: true } },
          skor: { orderBy: { createdAt: "asc" } },
          asisten: { select: { nama: true } },
        },
      },
    },
  });

  if (!p) notFound();

  const alatTes = await prisma.alatTes.findMany({
    where: { aktif: true },
    orderBy: { nama: "asc" },
  });

  const tahapBerikut = tahapBerikutnya(p.status);
  const syarat = tahapBerikut
    ? await cekSyaratTahap(p.id, tahapBerikut.kode)
    : { ok: true, pesan: "" };
  const tahapSebelum = tahapSebelumnya(p.status);

  // Pilihan hari/jam klien: utama dari baris jadwal, cadangan dari teks
  // preferensi pada formulir pendaftaran.
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
                  {p.jadwal[0].metode === "ONLINE" ? "Daring" : "Tatap muka"}
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
          bolehBatalkan={false}
          stepperRingkas
        />
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
                {formatTanggalWaktu(j.mulai)} · {j.metode === "ONLINE" ? "Daring" : "Tatap muka"}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Lembar tes */}
      <div className="space-y-5">
        {p.lembarTes.map((l) => {
          const baris = l.skor.length > 0 ? l.skor.length + 3 : 5;
          return (
            <section key={l.id} className="kartu p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold text-ink">{l.alatTes.nama}</h2>
                  <p className="mt-0.5 text-xs text-muted">
                    {l.alatTes.kode} · {l.alatTes.kategori}
                    {l.asisten ? ` · diinput ${l.asisten.nama}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <BadgeStatus status={l.status} label={l.status} />
                  {bolehKelola && (
                    <form action={ubahStatusLembarTes} className="flex items-center gap-1.5">
                      <input type="hidden" name="id" value={l.id} />
                      <select
                        name="status"
                        defaultValue={l.status}
                        className="rounded-lg border border-line bg-white px-2 py-1 text-xs"
                      >
                        {statusLembar.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <button className="pil border-line bg-white text-ink-soft">Ubah</button>
                    </form>
                  )}
                </div>
              </div>

              {/* Tautan pengerjaan untuk klien */}
              <div className="mt-5 border-t border-line pt-5">
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted">
                  Tautan pengerjaan (dilihat klien)
                </p>
                {bolehKelola ? (
                  <form action={simpanTautanTes} className="mt-3 grid gap-2">
                    <input type="hidden" name="id" value={l.id} />
                    <input
                      name="tautan"
                      type="url"
                      defaultValue={l.tautan ?? ""}
                      placeholder="https://forms.gle/… (link Google Form / platform tes)"
                      className="input !py-1.5 !text-xs"
                    />
                    <input
                      name="instruksi"
                      defaultValue={l.instruksi ?? ""}
                      placeholder="Instruksi singkat untuk klien (mis. kerjakan 30 menit tanpa jeda)"
                      className="input !py-1.5 !text-xs"
                    />
                    <button className="tombol tombol-garis w-fit !py-1.5 !text-xs">
                      {l.tautan ? "Perbarui tautan" : "Bagikan tautan ke klien"}
                    </button>
                    <p className="text-[0.68rem] text-muted">
                      Menyimpan tautan otomatis memajukan kasus ke tahap
                      Pelaksanaan Tes dan langsung tampil di portal klien.
                    </p>
                  </form>
                ) : l.tautan ? (
                  <a
                    href={l.tautan}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-xs font-semibold text-brand-700 hover:underline"
                  >
                    Buka tautan pengerjaan ↗
                  </a>
                ) : (
                  <p className="mt-2 text-xs text-muted">
                    Belum ada tautan pengerjaan.
                  </p>
                )}
                {l.instruksi && (
                  <p className="mt-2 text-xs leading-relaxed text-ink-soft">
                    Instruksi: {l.instruksi}
                  </p>
                )}
              </div>

              {/* Skor mentah */}
              {bolehKelola ? (
              <form action={simpanSkor} className="mt-5 border-t border-line pt-5">
                <input type="hidden" name="lembarTesId" value={l.id} />
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted">
                  Skor mentah
                </p>

                <div className="mt-3 space-y-2">
                  {Array.from({ length: baris }).map((_, i) => {
                    const s = l.skor[i];
                    return (
                      <div key={i} className="grid grid-cols-[1.6fr_0.8fr] gap-2">
                        <input
                          name="aspek"
                          defaultValue={s?.aspek ?? ""}
                          placeholder="Aspek (mis. Ketelitian)"
                          className="input !py-1.5 !text-xs"
                        />
                        <input
                          name="skor"
                          defaultValue={s ? s.skor.toString() : ""}
                          placeholder="Skor"
                          inputMode="decimal"
                          className="input !py-1.5 !text-xs"
                        />
                      </div>
                    );
                  })}
                </div>

                <p className="mt-3 text-[0.68rem] text-muted">
                  Menyimpan akan menggantikan seluruh skor pada lembar ini.
                </p>

                <button className="tombol tombol-utama mt-4 !py-2 !text-xs">
                  Simpan skor mentah
                </button>
              </form>
              ) : (
                <div className="mt-5 border-t border-line pt-5">
                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted">
                    Skor mentah
                  </p>
                  {l.skor.length === 0 ? (
                    <p className="mt-2 text-xs text-muted">Belum ada skor.</p>
                  ) : (
                    <ul className="mt-3 space-y-1.5">
                      {l.skor.map((s) => (
                        <li
                          key={s.id}
                          className="flex justify-between gap-3 rounded bg-paper-2 px-2.5 py-1.5 text-xs"
                        >
                          <span className="text-ink-soft">{s.aspek}</span>
                          <span className="font-semibold text-ink">{s.skor.toString()}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-3 text-[0.68rem] text-muted">
                    Mode baca — pengisian skor dilakukan asisten psikolog.
                  </p>
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* Tambah lembar tes — hanya asisten */}
      {bolehKelola && (
      <section className="kartu mt-6 border-dashed p-6">
        <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-ink-soft">
          Tambah lembar tes
        </h2>
        <form action={tambahLembarTes} className="mt-4 grid gap-3 sm:grid-cols-3">
          <input type="hidden" name="pendaftaranId" value={p.id} />
          <div className="sm:col-span-2">
            <label className="label" htmlFor="alatTesId">
              Alat tes
            </label>
            <select id="alatTesId" name="alatTesId" className="input" defaultValue="">
              <option value="">Pilih alat tes…</option>
              {alatTes.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nama} ({a.kode}) — {a.kategori}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="jadwalSesiId">
              Sesi
            </label>
            <select id="jadwalSesiId" name="jadwalSesiId" className="input" defaultValue="">
              <option value="">Tanpa sesi</option>
              {p.jadwal.map((j) => (
                <option key={j.id} value={j.id}>
                  {formatTanggalWaktu(j.mulai)}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-3">
            <label className="label" htmlFor="catatan">
              Catatan pelaksanaan
            </label>
            <input id="catatan" name="catatan" className="input" placeholder="Kondisi klien, kendala, dsb." />
          </div>
          <div className="sm:col-span-3">
            <label className="label" htmlFor="tautan">
              Tautan pengerjaan (opsional — langsung dibagikan ke klien)
            </label>
            <input id="tautan" name="tautan" type="url" className="input" placeholder="https://forms.gle/…" />
          </div>
          <div className="sm:col-span-3">
            <label className="label" htmlFor="instruksi">
              Instruksi untuk klien (opsional)
            </label>
            <input id="instruksi" name="instruksi" className="input" placeholder="mis. kerjakan sesuai jadwal yang tertera" />
          </div>
          <div className="sm:col-span-3">
            <button className="tombol tombol-garis w-full">Tambah lembar tes</button>
          </div>
        </form>
      </section>
      )}

      {/* Batas zona */}
      <section className="kartu mt-6 border-dashed p-6">
        <h2 className="text-sm font-bold text-ink">
          {bolehKelola
            ? "Interpretasi tidak tersedia di sini"
            : "Zona 2 — mode baca"}
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-ink-soft">
          {bolehKelola
            ? "Anda dapat mengelola instrumen dan skor mentah, namun penyusunan interpretasi dan laporan akhir (Zona 3) hanya dapat dilakukan oleh psikolog penanggung jawab kasus."
            : "Anda dapat membaca lembar tes dan skor mentah untuk menyusun interpretasi. Pengisian dan perubahan instrumen adalah kewenangan asisten psikolog."}
        </p>
      </section>
    </>
  );
}
