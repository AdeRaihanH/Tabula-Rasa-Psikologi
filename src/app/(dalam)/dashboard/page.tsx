import Link from "next/link";
import { redirect } from "next/navigation";

import {
  BadgeStatus,
  KartuStat,
  Kosong,
  JudulHalaman,
  Tabel,
  Td,
  Th,
} from "@/components/dashboard/ui";
import { wajibMasuk } from "@/lib/auth/dal";
import { labelStatusPendaftaran } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import { infoZona, rumahDashboard } from "@/lib/rbac";
import { formatTanggal, formatTanggalWaktu } from "@/lib/utils";

export default async function RingkasanDashboard() {
  const sesi = await wajibMasuk();

  // Klien punya portal sendiri; peran internal lain punya halaman utamanya.
  if (sesi.role !== "ADMIN") redirect(rumahDashboard(sesi.role));

  const [totalKlien, totalPendaftaran, menungguBayar, terverifikasi, terbaru, logTerbaru] =
    await Promise.all([
      prisma.klien.count(),
      prisma.pendaftaran.count(),
      prisma.pendaftaran.count({ where: { status: "MENUNGGU_PEMBAYARAN" } }),
      prisma.pendaftaran.count({ where: { status: "TERVERIFIKASI" } }),
      prisma.pendaftaran.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          klien: { select: { nama: true } },
          layanan: { select: { nama: true, kategori: true } },
        },
      }),
      prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
    ]);

  const perZona = [
    {
      zona: "ZONA_1" as const,
      jumlah: totalKlien,
      satuan: "klien terdaftar",
    },
    {
      zona: "ZONA_2" as const,
      jumlah: await prisma.lembarTes.count(),
      satuan: "lembar tes",
    },
    {
      zona: "ZONA_3" as const,
      jumlah: await prisma.laporanHasil.count(),
      satuan: "laporan",
    },
  ];

  return (
    <>
      <JudulHalaman
        judul={`Selamat datang, ${sesi.nama.split(" ")[0]}`}
        keterangan="Ringkasan operasional biro. Data sensitif dipisah per zona sesuai matriks hak akses."
        aksi={
          <Link href="/dashboard/pendaftaran" className="tombol tombol-utama">
            Kelola Pendaftaran
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KartuStat label="Total klien" nilai={totalKlien} catatan="Zona 1" warna={infoZona.ZONA_1.warna} />
        <KartuStat label="Total pendaftaran" nilai={totalPendaftaran} />
        <KartuStat
          label="Menunggu pembayaran"
          nilai={menungguBayar}
          catatan="Perlu diverifikasi"
        />
        <KartuStat label="Terverifikasi" nilai={terverifikasi} catatan="Siap dijadwalkan" />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {perZona.map((z) => (
          <div key={z.zona} className="kartu p-5">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: infoZona[z.zona].warna }}
              />
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-ink-soft">
                {infoZona[z.zona].nama}
              </p>
            </div>
            <p className="mt-3 text-2xl font-bold text-ink">{z.jumlah}</p>
            <p className="text-xs text-muted">{z.satuan}</p>
            <p className="mt-3 text-[0.7rem] leading-relaxed text-muted">
              Akses: {infoZona[z.zona].pemegang}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.08em] text-ink-soft">
            Pendaftaran terbaru
          </h2>
          {terbaru.length === 0 ? (
            <Kosong
              judul="Belum ada pendaftaran"
              keterangan="Pendaftaran dari situs publik akan muncul di sini."
            />
          ) : (
            <Tabel>
              <thead>
                <tr>
                  <Th>Nomor</Th>
                  <Th>Klien</Th>
                  <Th>Layanan</Th>
                  <Th>Status</Th>
                  <Th>Masuk</Th>
                </tr>
              </thead>
              <tbody>
                {terbaru.map((p) => (
                  <tr key={p.id}>
                    <Td>
                      <Link
                        href={`/dashboard/pendaftaran/${p.id}`}
                        className="font-semibold text-brand-700 hover:underline"
                      >
                        {p.nomor}
                      </Link>
                    </Td>
                    <Td>{p.klien.nama}</Td>
                    <Td className="max-w-[14rem] truncate">{p.layanan.nama}</Td>
                    <Td>
                      <BadgeStatus
                        status={p.status}
                        label={labelStatusPendaftaran[p.status] ?? p.status}
                      />
                    </Td>
                    <Td className="whitespace-nowrap text-xs">
                      {formatTanggal(p.createdAt)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Tabel>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.08em] text-ink-soft">
            Aktivitas terakhir
          </h2>
          <div className="kartu divide-y divide-line">
            {logTerbaru.length === 0 && (
              <p className="p-5 text-sm text-muted">Belum ada aktivitas.</p>
            )}
            {logTerbaru.map((l) => (
              <div key={l.id} className="p-4">
                <p className="text-sm font-semibold text-ink">{l.aksi}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
                  {l.detail ?? l.entitas}
                </p>
                <p className="mt-1 text-[0.68rem] text-muted">
                  {formatTanggalWaktu(l.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
