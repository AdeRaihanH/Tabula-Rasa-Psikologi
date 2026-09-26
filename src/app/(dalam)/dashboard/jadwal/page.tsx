import {
  BadgeStatus,
  JudulHalaman,
  Kosong,
  Tabel,
  Td,
  Th,
} from "@/components/dashboard/ui";
import { wajibKemampuan } from "@/lib/auth/dal";
import { labelStatusPendaftaran } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import { infoZona } from "@/lib/rbac";
import { formatTanggalWaktu } from "@/lib/utils";

export default async function HalamanJadwal() {
  const sesi = await wajibKemampuan("jadwal:lihat");

  const daftar = await prisma.jadwalSesi.findMany({
    where: sesi.role === "PSIKOLOG" ? { psikologId: sesi.userId } : undefined,
    orderBy: { mulai: "asc" },
    take: 100,
    include: {
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
    },
  });

  const mendatang = daftar.filter((j) => j.mulai >= new Date());
  const lampau = daftar.filter((j) => j.mulai < new Date());

  const bagian = [
    { judul: "Jadwal mendatang", data: mendatang },
    { judul: "Riwayat sesi", data: lampau.reverse() },
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
                        {j.metode === "ONLINE" ? "Daring" : "Tatap muka"}
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
          </section>
        ))}
      </div>
    </>
  );
}
