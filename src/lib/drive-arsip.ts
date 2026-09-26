import "server-only";

import { driveAktif, pastikanFolder, unggahTeks } from "@/lib/gdrive";
import { prisma } from "@/lib/prisma";

function idDariTautan(tautan: string) {
  const cocok = tautan.match(/\/folders\/([A-Za-z0-9_-]+)/);
  return cocok?.[1] ?? null;
}

/**
 * Memastikan setiap pendaftaran memiliki satu folder di Google Drive.
 * Folder dibuat sekali, lalu dipakai ulang untuk seluruh berkas kasus.
 */
export async function folderPendaftaran(pendaftaranId: string) {
  if (!driveAktif()) {
    throw new Error(
      "Google Drive belum dikonfigurasi. Isi GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, dan GOOGLE_DRIVE_FOLDER_ID.",
    );
  }

  const p = await prisma.pendaftaran.findUnique({
    where: { id: pendaftaranId },
    include: {
      klien: { select: { nama: true } },
      layanan: { select: { nama: true } },
    },
  });
  if (!p) throw new Error("Pendaftaran tidak ditemukan.");

  if (p.folderDriveUrl) {
    const id = idDariTautan(p.folderDriveUrl);
    if (id) return { id, tautan: p.folderDriveUrl };
  }

  const nama = `${p.nomor} — ${p.klien.nama}`.slice(0, 100);
  const folder = await pastikanFolder(nama);

  await prisma.pendaftaran.update({
    where: { id: p.id },
    data: { folderDriveUrl: folder.tautan },
  });

  // Simpan ringkasan pendaftaran sebagai berkas teks di dalam folder.
  const ringkasan = [
    `Nomor pendaftaran : ${p.nomor}`,
    `Nama klien        : ${p.klien.nama}`,
    `Layanan           : ${p.layanan.nama}`,
    `Metode            : ${p.metode === "ONLINE" ? "Daring" : "Tatap muka"}`,
    `Status            : ${p.status}`,
    `Tanggal masuk     : ${p.createdAt.toISOString()}`,
    "",
    "Kebutuhan:",
    p.kebutuhan ?? "-",
  ].join("\n");

  try {
    await unggahTeks({
      nama: `ringkasan-${p.nomor}.txt`,
      isi: ringkasan,
      folderId: folder.id,
    });
  } catch {
    // Ringkasan opsional — folder tetap dianggap berhasil dibuat.
  }

  return folder;
}
