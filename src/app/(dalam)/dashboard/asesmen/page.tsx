import Link from "next/link";

import {
  BadgeStatus,
  BadgeZona,
  JudulHalaman,
  Kosong,
  Tabel,
  Td,
  Th,
} from "@/components/dashboard/ui";
import { wajibKemampuan } from "@/lib/auth/dal";
import { labelStatusPendaftaran } from "@/lib/config";
import { parsePreferensiJadwal } from "@/lib/jadwal";
import { prisma } from "@/lib/prisma";
import { formatTanggal, formatTanggalWaktu } from "@/lib/utils";

export default async function HalamanAsesmen() {
  await wajibKemampuan("lembartes:lihat");

  // Asisten bekerja pada kasus yang pembayarannya sudah terverifikasi
  // (atau status lanjutannya). Jadwal otomatis dari pilihan pendaftar ikut
  // ditampilkan agar asisten tahu hari/jam yang diminta klien. Kasus yang
  // belum bayar sengaja TIDAK tampil di sini.
  const daftar = await prisma.pendaftaran.findMany({
    where: {
      OR: [
        {
          status: {
            in: ["TERVERIFIKASI", "TERJADWAL", "PELAKSANAAN", "PENGOLAHAN_DATA"],
          },
        },
        { pembayaran: { some: { status: "TERVERIFIKASI" } } },
      ],
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: {
      klien: { select: { nama: true } },
      layanan: { select: { nama: true } },
      lembarTes: {
        select: {
          id: true,
          status: true,
          tautan: true,
          skor: { select: { id: true } },
        },
      },
      jadwal: { orderBy: { mulai: "asc" }, take: 1, select: { mulai: true } },
    },
  });

  return (
    <>
      <JudulHalaman
        judul="Lembar Tes & Skor Mentah"
        keterangan="Zona 2 — operasional asesmen. Kelola instrumen tes dan masukkan skor mentah hasil pelaksanaan."
        aksi={<BadgeZona zona="ZONA_2" />}
      />

      {daftar.length === 0 ? (
        <Kosong
          judul="Belum ada kasus untuk diasesmen"
          keterangan="Kasus muncul di sini setelah pembayaran klien terverifikasi oleh admin."
        />
      ) : (
        <Tabel>
          <thead>
            <tr>
              <Th>Nomor</Th>
              <Th>Klien</Th>
              <Th>Layanan</Th>
              <Th>Jadwal Pilihan Klien</Th>
              <Th>Lembar Tes</Th>
              <Th>Skor</Th>
              <Th>Status</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {daftar.map((p) => {
              const totalSkor = p.lembarTes.reduce((a, l) => a + l.skor.length, 0);
              const selesai = p.lembarTes.filter((l) => l.status === "SELESAI").length;
              const dibagikan = p.lembarTes.filter((l) => l.tautan).length;
              const belumAdaTes = p.lembarTes.length === 0;
              const preferensi =
                !p.jadwal[0] ? parsePreferensiJadwal(p.kebutuhan) : null;
              return (
                <tr key={p.id} className="hover:bg-paper-2/40">
                  <Td>
                    <Link
                      href={`/dashboard/asesmen/${p.id}`}
                      className="font-semibold text-brand-700 hover:underline"
                    >
                      {p.nomor}
                    </Link>
                  </Td>
                  <Td className="font-medium text-ink">{p.klien.nama}</Td>
                  <Td className="max-w-[12rem] truncate text-xs">{p.layanan.nama}</Td>
                  <Td className="whitespace-nowrap text-xs">
                    {p.jadwal[0] ? (
                      formatTanggalWaktu(p.jadwal[0].mulai)
                    ) : preferensi ? (
                      <span>
                        {formatTanggal(
                          new Date(`${preferensi.tanggal}T00:00:00+07:00`),
                        )}{" "}
                        · {preferensi.waktu}
                        <span className="block text-muted">
                          pilihan formulir
                        </span>
                      </span>
                    ) : (
                      "—"
                    )}
                  </Td>
                  <Td className="text-xs">
                    {p.lembarTes.length} lembar
                    {p.lembarTes.length > 0 && (
                      <span className="block text-muted">{selesai} selesai</span>
                    )}
                    {dibagikan > 0 && (
                      <span className="block font-medium text-emerald-700">
                        {dibagikan} tautan dibagikan
                      </span>
                    )}
                  </Td>
                  <Td className="text-xs">{totalSkor} baris</Td>
                  <Td>
                    <BadgeStatus
                      status={p.status}
                      label={labelStatusPendaftaran[p.status] ?? p.status}
                    />
                  </Td>
                  <Td>
                    <Link
                      href={`/dashboard/asesmen/${p.id}`}
                      className={
                        belumAdaTes
                          ? "tombol tombol-utama !px-3 !py-1.5 !text-xs whitespace-nowrap"
                          : "text-xs font-semibold text-brand-700 hover:underline"
                      }
                    >
                      {belumAdaTes ? "Kirim Tes →" : "Kelola →"}
                    </Link>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Tabel>
      )}
    </>
  );
}
