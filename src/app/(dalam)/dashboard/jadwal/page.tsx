import {
  BadgeStatus,
  JudulHalaman,
  Kosong,
  Tabel,
  Td,
  Th,
} from "@/components/dashboard/ui";
import { Paginasi } from "@/components/dashboard/Paginasi";
import { wajibKemampuan } from "@/lib/auth/dal";
import { labelStatusPendaftaran } from "@/lib/config";
import { UKURAN_HALAMAN, hitungPaginasi } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import { infoZona } from "@/lib/rbac";
import { formatTanggalWaktu } from "@/lib/utils";

export default async function HalamanJadwal({
  searchParams,
}: PageProps<"/dashboard/jadwal">) {
  const sesi = await wajibKemampuan("jadwal:lihat");
  const sp = await searchParams;

  // Dua bagian dipaginasi terpisah agar halaman pertama tetap menampilkan
  // agenda yang relevan (sesi mendatang terdekat, bukan sesi lampau).
  const halMendatang = hitungPaginasi(sp?.hal);
  const halLampau = hitungPaginasi(sp?.halLalu);

  const dasar =
    sesi.role === "PSIKOLOG" ? { psikologId: sesi.userId } : {};
  const sekarang = new Date();
  const whereMendatang = { ...dasar, mulai: { gte: sekarang } };
  const whereLampau = { ...dasar, mulai: { lt: sekarang } };

  const sertakan = {
    psikolog: { select: { nama: true } },
    pendaftaran: {
      select: {
        nomor: true,
        status: true,
        metode: true,
        klien: { select: { nama: true } },
        layanan: { select: { nama: true } },
      },
    },
  } as const;

  const [mendatang, totalMendatang, lampau, totalLampau] = await Promise.all([
    prisma.jadwalSesi.findMany({
      where: whereMendatang,
      orderBy: { mulai: "asc" },
      skip: halMendatang.skip,
      take: halMendatang.take,
      include: sertakan,
    }),
    prisma.jadwalSesi.count({ where: whereMendatang }),
    prisma.jadwalSesi.findMany({
      where: whereLampau,
      orderBy: { mulai: "desc" },
      skip: halLampau.skip,
      take: halLampau.take,
      include: sertakan,
    }),
    prisma.jadwalSesi.count({ where: whereLampau }),
  ]);

  const bagian = [
    {
      judul: "Jadwal mendatang",
      data: mendatang,
      total: totalMendatang,
      hal: halMendatang.hal,
      jalur: "/dashboard/jadwal",
      param: "hal",
      lain: { halLalu: halLampau.hal > 1 ? String(halLampau.hal) : undefined },
    },
    {
      judul: "Riwayat sesi",
      data: lampau,
      total: totalLampau,
      hal: halLampau.hal,
      jalur: "/dashboard/jadwal",
      param: "halLalu",
      lain: { hal: halMendatang.hal > 1 ? String(halMendatang.hal) : undefined },
    },
  ];

  return (
    <>
      <JudulHalaman
        judul="Jadwal Sesi"
        keterangan={
          sesi.role === "PSIKOLOG"
            ? "Hanya sesi yang ditugaskan kepada Anda yang ditampilkan."
            : "Agenda sesi seluruh psikolog."
        }
      />

      <div className="space-y-8">
        {bagian.map((b) => (
          <section key={b.judul}>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.08em] text-ink-soft">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: infoZona.ZONA_1.warna }}
              />
              {b.judul}
            </h2>

            {b.data.length === 0 ? (
              <Kosong judul="Tidak ada jadwal" keterangan="Belum ada sesi pada bagian ini." />
            ) : (
              <Tabel>
                <thead>
                  <tr>
                    <Th>Waktu</Th>
                    <Th>Klien</Th>
                    <Th>Layanan</Th>
                    <Th>Psikolog</Th>
                    <Th>Metode</Th>
                    <Th>Status Sesi</Th>
                    <Th>Status Kasus</Th>
                  </tr>
                </thead>
                <tbody>
                  {b.data.map((j) => (
                    <tr key={j.id} className="hover:bg-paper-2/40">
                      <Td className="whitespace-nowrap text-xs font-medium text-ink">
                        {formatTanggalWaktu(j.mulai)}
                      </Td>
                      <Td className="text-xs">{j.pendaftaran.klien.nama}</Td>
                      <Td className="max-w-[12rem] truncate text-xs">
                        {j.pendaftaran.layanan.nama}
                      </Td>
                      <Td className="text-xs">{j.psikolog.nama}</Td>
                      <Td className="text-xs">
                        Tatap Muka
                        {j.lokasi ? <span className="block text-muted">{j.lokasi}</span> : null}
                      </Td>
                      <Td>
                        <BadgeStatus status={j.status} label={j.status} />
                      </Td>
                      <Td>
                        <BadgeStatus
                          status={j.pendaftaran.status}
                          label={labelStatusPendaftaran[j.pendaftaran.status] ?? j.pendaftaran.status}
                        />
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Tabel>
            )}

            <Paginasi
              jalur={b.jalur}
              hal={b.hal}
              total={b.total}
              ukuran={UKURAN_HALAMAN}
              cari={{ ...b.lain, [b.param]: undefined }}
              namaParam={b.param}
            />
          </section>
        ))}
      </div>
    </>
  );
}
