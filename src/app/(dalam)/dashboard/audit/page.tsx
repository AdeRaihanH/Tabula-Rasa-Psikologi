import {
  JudulHalaman,
  Kosong,
  Tabel,
  Td,
  Th,
} from "@/components/dashboard/ui";
import { wajibKemampuan } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { formatTanggalWaktu } from "@/lib/utils";

export default async function HalamanAudit() {
  await wajibKemampuan("audit:lihat");

  const log = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: { select: { nama: true, role: true } } },
  });

  return (
    <>
      <JudulHalaman
        judul="Log Audit"
        keterangan="Jejak setiap tindakan penting: siapa, kapan, dan apa yang diubah. Termasuk percobaan akses yang ditolak."
      />

      {log.length === 0 ? (
        <Kosong judul="Belum ada aktivitas" keterangan="Log akan terisi seiring penggunaan sistem." />
      ) : (
        <Tabel>
          <thead>
            <tr>
              <Th>Waktu</Th>
              <Th>Pelaku</Th>
              <Th>Aksi</Th>
              <Th>Entitas</Th>
              <Th>Detail</Th>
            </tr>
          </thead>
          <tbody>
            {log.map((l) => {
              const ditolak = l.aksi.includes("DITOLAK") || l.aksi.includes("GAGAL");
              return (
                <tr key={l.id} className={ditolak ? "bg-red-50/50" : "hover:bg-paper-2/40"}>
                  <Td className="whitespace-nowrap text-xs">
                    {formatTanggalWaktu(l.createdAt)}
                  </Td>
                  <Td className="text-xs">
                    {l.user ? (
                      <>
                        <span className="block font-medium text-ink">{l.user.nama}</span>
                        <span className="block text-muted">{l.user.role}</span>
                      </>
                    ) : (
                      <span className="text-muted">Sistem / publik</span>
                    )}
                  </Td>
                  <Td>
                    <span
                      className="pil"
                      style={
                        ditolak
                          ? { background: "#fef2f2", color: "#b91c1c" }
                          : { background: "#f0fdfa", color: "#0f766e" }
                      }
                    >
                      {l.aksi}
                    </span>
                  </Td>
                  <Td className="text-xs">{l.entitas}</Td>
                  <Td className="max-w-[22rem] text-xs">{l.detail ?? "—"}</Td>
                </tr>
              );
            })}
          </tbody>
        </Tabel>
      )}
    </>
  );
}
