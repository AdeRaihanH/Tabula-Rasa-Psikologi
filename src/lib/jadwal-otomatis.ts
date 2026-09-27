import "server-only";

import { SLOT_WAKTU, parsePreferensiJadwal } from "@/lib/jadwal";
import { prisma } from "@/lib/prisma";

/**
 * Membuat baris JadwalSesi dari preferensi pendaftar bila belum ada.
 *
 * Dipakai saat pendaftaran dibuat DAN sebagai backfill saat pembayaran
 * diverifikasi — sehingga pendaftar lama (yang daftar sebelum fitur jadwal
 * otomatis ada) tetap dapat jadwalnya begitu admin menyetujui pembayaran.
 *
 * `opsi` boleh diisi tanggal/waktu yang sudah divalidasi agar jadwal tidak
 * bergantung pada pembacaan ulang teks `kebutuhan`.
 *
 * Mengembalikan true bila jadwal baru dibuat.
 */
export async function pastikanJadwalOtomatis(
  pendaftaranId: string,
  opsi?: { tanggal?: string | null; waktu?: string | null },
): Promise<boolean> {
  const p = await prisma.pendaftaran.findUnique({
    where: { id: pendaftaranId },
    select: { kebutuhan: true, psikologId: true, metode: true },
  });
  if (!p?.psikologId) return false;

  const sudahAda = await prisma.jadwalSesi.count({
    where: { pendaftaranId },
  });
  if (sudahAda > 0) return false;

  const pref =
    opsi?.tanggal && opsi?.waktu && /^\d{4}-\d{2}-\d{2}$/.test(opsi.tanggal)
      ? { tanggal: opsi.tanggal, waktu: opsi.waktu }
      : parsePreferensiJadwal(p.kebutuhan);
  if (!pref) return false;

  const slot = SLOT_WAKTU.find((s) => s.label === pref.waktu);
  if (!slot) return false;

  const pad = (n: number) => String(n).padStart(2, "0");
  await prisma.jadwalSesi.create({
    data: {
      pendaftaranId,
      psikologId: p.psikologId,
      mulai: new Date(`${pref.tanggal}T${pad(slot.mulaiJam)}:00:00+07:00`),
      selesai: new Date(`${pref.tanggal}T${pad(slot.selesaiJam)}:00:00+07:00`),
      metode: p.metode,
      status: "TERJADWAL",
      catatan: "Jadwal pilihan pendaftar (otomatis saat mendaftar)",
    },
  });

  await prisma.auditLog.create({
    data: {
      aksi: "JADWAL_OTOMATIS",
      entitas: "JadwalSesi",
      entitasId: pendaftaranId,
      detail: `Jadwal otomatis dari preferensi pendaftar: ${pref.tanggal} ${pref.waktu}`,
    },
  });

  return true;
}
