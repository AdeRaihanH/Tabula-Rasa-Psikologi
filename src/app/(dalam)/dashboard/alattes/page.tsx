import {
  BadgeZona,
  JudulHalaman,
  Kosong,
  Tabel,
  Td,
  Th,
} from "@/components/dashboard/ui";
import { wajibKemampuan } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";

export default async function HalamanAlatTes() {
  await wajibKemampuan("alattes:kelola");

  const daftar = await prisma.alatTes.findMany({
    orderBy: [{ kategori: "asc" }, { nama: "asc" }],
    include: { _count: { select: { lembarTes: true } } },
  });

  const kelompok = new Map<string, typeof daftar>();
  for (const a of daftar) {
    const arr = kelompok.get(a.kategori) ?? [];
    arr.push(a);
    kelompok.set(a.kategori, arr);
  }

  return (
    <>
      <JudulHalaman
        judul="Master Alat Tes"
        keterangan="Daftar instrumen yang tersedia untuk lembar tes. Bagian dari Zona 2."
        aksi={<BadgeZona zona="ZONA_2" />}
      />

      {daftar.length === 0 ? (
        <Kosong judul="Belum ada alat tes" keterangan="Jalankan seed untuk mengisi instrumen awal." />
      ) : (
        <div className="space-y-8">
          {[...kelompok.entries()].map(([kategori, items]) => (
            <section key={kategori}>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.08em] text-ink-soft">
                {kategori}
              </h2>
              <Tabel>
                <thead>
                  <tr>
                    <Th>Kode</Th>
                    <Th>Nama Instrumen</Th>
                    <Th>Dipakai</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((a) => (
                    <tr key={a.id} className="hover:bg-paper-2/40">
                      <Td className="font-mono text-xs font-semibold text-ink">{a.kode}</Td>
                      <Td>{a.nama}</Td>
                      <Td className="text-xs">{a._count.lembarTes}×</Td>
                      <Td>
                        <span
                          className="pil"
                          style={
                            a.aktif
                              ? { background: "#f0fdf4", color: "#15803d" }
                              : { background: "#f8fafc", color: "#475569" }
                          }
                        >
                          {a.aktif ? "Aktif" : "Nonaktif"}
                        </span>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Tabel>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
