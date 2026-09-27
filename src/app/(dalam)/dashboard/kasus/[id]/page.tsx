import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  BadgeStatus,
  BadgeZona,
  JudulHalaman,
} from "@/components/dashboard/ui";
import { AlurStatus } from "@/components/dashboard/AlurStatus";
import { FormLaporan } from "@/components/dashboard/FormLaporan";
import { wajibPeran } from "@/lib/auth/dal";
import { labelStatusPendaftaran } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import { formatTanggal, formatTanggalWaktu } from "@/lib/utils";

export default async function DetailKasus({
  params,
}: PageProps<"/dashboard/kasus/[id]">) {
  const sesi = await wajibPeran("PSIKOLOG");
  const { id } = await params;

  const p = await prisma.pendaftaran.findUnique({
    where: { id },
    include: {
      klien: { select: { nama: true, tanggalLahir: true, jenisKelamin: true } },
      layanan: {
        select: {
          nama: true,
          kategori: true,
          checklist: {
            orderBy: { urutan: "asc" },
            include: { alatTes: { select: { nama: true, kode: true } } },
          },
        },
      },
      jadwal: { orderBy: { mulai: "asc" } },
      konfirmasiTesOleh: { select: { nama: true } },
      laporan: true,
    },
  });

  if (!p) notFound();

  // Batas isolasi psikolog: hanya pemegang kasus yang boleh membuka.
  if (p.psikologId !== sesi.userId) redirect("/dashboard/kasus");

  const l = p.laporan;

  return (
    <>
      <div className="mb-5">
        <Link href="/dashboard/kasus" className="text-xs font-medium text-muted hover:text-brand-700">
          ← Kembali ke kasus saya
        </Link>
      </div>

      <JudulHalaman
        judul={`${p.nomor} — ${p.klien.nama}`}
        keterangan={`${p.layanan.nama} · ${labelStatusPendaftaran[p.status] ?? p.status}`}
        aksi={
          <div className="flex items-center gap-2">
            <BadgeZona zona="ZONA_3" />
            {l && <BadgeStatus status={l.status} label={l.status} />}
          </div>
        }
      />

      <div className="mb-6">
        <AlurStatus status={p.status} ringkas />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
        <div className="space-y-6">
          <section className="kartu p-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-ink-soft">
              Identitas Klien
            </h2>
            <p className="mt-2 text-[0.68rem] text-muted">
              Ringkas — data lengkap ada di Zona 1 (admin).
            </p>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted">Nama</span>
                <span className="font-medium text-ink">{p.klien.nama}</span>
              </div>
              {p.klien.tanggalLahir && (
                <div className="flex justify-between gap-3">
                  <span className="text-muted">Tanggal lahir</span>
                  <span className="font-medium text-ink">
                    {formatTanggal(p.klien.tanggalLahir)}
                  </span>
                </div>
              )}
              {p.klien.jenisKelamin && (
                <div className="flex justify-between gap-3">
                  <span className="text-muted">Jenis kelamin</span>
                  <span className="font-medium text-ink">
                    {p.klien.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"}
                  </span>
                </div>
              )}
            </div>
          </section>

          <section className="kartu p-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-ink-soft">
              Jadwal
            </h2>
            {p.jadwal.length === 0 ? (
              <p className="mt-3 text-sm text-muted">Belum ada jadwal.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {p.jadwal.map((j) => (
                  <li key={j.id} className="rounded-lg bg-paper-2 px-3 py-2 text-xs text-ink-soft">
                    {formatTanggalWaktu(j.mulai)} · {j.status}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="kartu p-6">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.08em] text-ink-soft">
              Pelaksanaan Tes
              <BadgeZona zona="ZONA_2" />
            </h2>
            {!p.konfirmasiTesPada ? (
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Asisten psikolog belum mengonfirmasi pelaksanaan tes. Setelah
                klien melaksanakan tes di biro dan asisten mengonfirmasinya,
                interpretasi dapat Anda susun.
              </p>
            ) : (
              <>
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[0.68rem] font-semibold text-emerald-700">
                  ✓ Sudah dilaksanakan
                  {p.konfirmasiTesOleh ? ` · dikonfirmasi ${p.konfirmasiTesOleh.nama}` : ""}
                </p>
                {p.layanan.checklist.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {p.layanan.checklist.map((c) => (
                      <li
                        key={c.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-paper-2 px-3 py-2"
                      >
                        <p className="text-xs font-semibold text-ink">
                          {c.alatTes.nama}{" "}
                          <span className="font-normal text-muted">
                            ({c.alatTes.kode})
                          </span>
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </section>
        </div>

        {/* Form laporan — Zona 3 */}
        <section className="kartu p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-ink-soft">
              Laporan Hasil &amp; Interpretasi
            </h2>
            {l && <BadgeStatus status={l.status} label={l.status} />}
          </div>

          {l?.status === "FINAL" && l.difinalkanPada && (
            <p className="mt-2 text-xs text-emerald-700">
              Difinalkan pada {formatTanggalWaktu(l.difinalkanPada)}
            </p>
          )}

          <FormLaporan
            pendaftaranId={p.id}
            jumlahAlatTes={
              p.konfirmasiTesPada ? p.layanan.checklist.length : 0
            }
            awal={{
              ringkasan: l?.ringkasan ?? "",
              interpretasi: l?.interpretasi ?? "",
              kesimpulan: l?.kesimpulan ?? "",
              rekomendasi: l?.rekomendasi ?? "",
            }}
          />

          <div className="mt-6 rounded-xl border border-line bg-paper-2 p-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-ink-soft">
              Dokumen Word Laporan
            </h3>
            <p className="mt-1 text-[0.68rem] leading-relaxed text-muted">
              Dokumen dibuat otomatis saat laporan difinalkan dan diunggah ke
              folder Drive Anda sendiri. Hanya Anda yang dapat membuka laporan
              ini.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={`/dashboard/kasus/${p.id}/dokumen`}
                className="tombol tombol-utama !py-2 !text-xs"
              >
                Unduh dokumen Word
              </a>
              {l?.dokumenUrl && (
                <a
                  href={l.dokumenUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tombol tombol-garis !py-2 !text-xs"
                >
                  Buka di Drive ↗
                </a>
              )}
            </div>
            {l?.dokumenPada && (
              <p className="mt-2 text-[0.62rem] text-muted">
                Terakhir diunggah {formatTanggalWaktu(l.dokumenPada)}
                {l.dokumenNama ? ` · ${l.dokumenNama}` : ""}
              </p>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
