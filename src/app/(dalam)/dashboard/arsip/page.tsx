import Link from "next/link";

import {
  BadgeZona,
  JudulHalaman,
  Kosong,
  Tabel,
  Td,
  Th,
} from "@/components/dashboard/ui";
import { arsipkanPendaftaran, hapusArsip } from "@/app/actions/arsip";
import { wajibKemampuan } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { infoZona } from "@/lib/rbac";
import { formatTanggal } from "@/lib/utils";

const opsiRetensi = [
  { bulan: 12, label: "1 tahun" },
  { bulan: 36, label: "3 tahun" },
  { bulan: 60, label: "5 tahun" },
  { bulan: 120, label: "10 tahun" },
];

export default async function HalamanArsip() {
  await wajibKemampuan("arsip:kelola");

  const [siapArsip, arsip] = await Promise.all([
    prisma.pendaftaran.findMany({
      where: { status: "SELESAI", arsip: null },
      orderBy: { updatedAt: "desc" },
      take: 50,
      include: {
        klien: { select: { nama: true } },
        layanan: { select: { nama: true } },
      },
    }),
    prisma.arsipData.findMany({
      orderBy: { diarsipkanPada: "desc" },
      take: 100,
      include: {
        pendaftaran: {
          select: {
            nomor: true,
            klien: { select: { nama: true } },
            layanan: { select: { nama: true } },
          },
        },
      },
    }),
  ]);

  const sekarang = new Date();

  return (
    <>
      <JudulHalaman
        judul="Pengarsipan"
        keterangan="Tahap akhir alur layanan. Kasus yang selesai diarsipkan dengan klasifikasi kerahasiaan dan masa retensi."
      />

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.08em] text-ink-soft">
          Siap diarsipkan ({siapArsip.length})
        </h2>

        {siapArsip.length === 0 ? (
          <Kosong
            judul="Tidak ada kasus menunggu arsip"
            keterangan="Kasus berstatus Selesai akan muncul di sini untuk diarsipkan."
          />
        ) : (
          <div className="space-y-3">
            {siapArsip.map((p) => (
              <div key={p.id} className="kartu flex flex-wrap items-center gap-4 p-4">
                <div className="min-w-[12rem] flex-1">
                  <Link
                    href={`/dashboard/pendaftaran/${p.id}`}
                    className="text-sm font-semibold text-brand-700 hover:underline"
                  >
                    {p.nomor}
                  </Link>
                  <p className="text-xs text-muted">
                    {p.klien.nama} · {p.layanan.nama}
                  </p>
                </div>

                <form action={arsipkanPendaftaran} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="pendaftaranId" value={p.id} />
                  <select name="klasifikasi" defaultValue="ZONA_1" className="input !w-32 !py-1.5 !text-xs">
                    <option value="ZONA_1">Zona 1</option>
                    <option value="ZONA_2">Zona 2</option>
                    <option value="ZONA_3">Zona 3</option>
                  </select>
                  <select name="bulanRetensi" defaultValue="60" className="input !w-28 !py-1.5 !text-xs">
                    {opsiRetensi.map((o) => (
                      <option key={o.bulan} value={o.bulan}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <input
                    name="catatan"
                    placeholder="Catatan arsip"
                    className="input !w-40 !py-1.5 !text-xs"
                  />
                  <button className="tombol tombol-utama !px-3 !py-1.5 !text-xs">
                    Arsipkan
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.08em] text-ink-soft">
          Arsip tersimpan ({arsip.length})
        </h2>

        {arsip.length === 0 ? (
          <Kosong judul="Belum ada arsip" keterangan="Arsip kasus akan tercatat di sini." />
        ) : (
          <Tabel>
            <thead>
              <tr>
                <Th>Nomor</Th>
                <Th>Klien</Th>
                <Th>Layanan</Th>
                <Th>Klasifikasi</Th>
                <Th>Diarsipkan</Th>
                <Th>Retensi s/d</Th>
                <Th>Status Retensi</Th>
                <Th>Arsip Digital</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {arsip.map((a) => {
                const lewat = a.retensiSampai ? a.retensiSampai < sekarang : false;
                return (
                  <tr key={a.id} className="hover:bg-paper-2/40">
                    <Td>
                      <Link
                        href={`/dashboard/pendaftaran/${a.pendaftaranId}`}
                        className="font-semibold text-brand-700 hover:underline"
                      >
                        {a.pendaftaran.nomor}
                      </Link>
                    </Td>
                    <Td className="text-xs">{a.pendaftaran.klien.nama}</Td>
                    <Td className="max-w-[12rem] truncate text-xs">
                      {a.pendaftaran.layanan.nama}
                    </Td>
                    <Td>
                      <BadgeZona zona={a.klasifikasi} />
                    </Td>
                    <Td className="whitespace-nowrap text-xs">
                      {formatTanggal(a.diarsipkanPada)}
                    </Td>
                    <Td className="whitespace-nowrap text-xs">
                      {a.retensiSampai ? formatTanggal(a.retensiSampai) : "—"}
                    </Td>
                    <Td>
                      <span
                        className="pil"
                        style={
                          lewat
                            ? { background: "#fef2f2", color: "#b91c1c" }
                            : { background: "#f0fdf4", color: "#15803d" }
                        }
                      >
                        {lewat ? "Jatuh tempo" : "Aktif"}
                      </span>
                    </Td>
                    <Td>
                      {a.folderDriveUrl ? (
                        <a
                          href={a.folderDriveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-brand-700 hover:underline"
                        >
                          Buka Drive ↗
                        </a>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </Td>
                    <Td>
                      <form action={hapusArsip}>
                        <input type="hidden" name="id" value={a.id} />
                        <button className="pil bg-red-50 text-red-700">Batal</button>
                      </form>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Tabel>
        )}
      </section>

      <div className="kartu mt-6 border-dashed p-5">
        <p className="text-xs leading-relaxed text-ink-soft">
          <span className="font-semibold text-ink">Klasifikasi arsip</span>{" "}
          menentukan tingkat kerahasiaan berkas:{" "}
          {(["ZONA_1", "ZONA_2", "ZONA_3"] as const).map((z, i) => (
            <span key={z}>
              {i > 0 && " · "}
              <span style={{ color: infoZona[z].warna }} className="font-semibold">
                {infoZona[z].nama.split(" — ")[0]}
              </span>{" "}
              ({infoZona[z].pemegang})
            </span>
          ))}
          . Data yang melewati masa retensi sebaiknya dimusnahkan secara aman.
        </p>
      </div>
    </>
  );
}
