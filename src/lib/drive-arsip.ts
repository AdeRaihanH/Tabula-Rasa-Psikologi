import "server-only";

import { buatShortcut, idFolderDariTautan, pastikanFolder, unggahTeks } from "@/lib/gdrive";
import { buatSpreadsheet, KOLOM_PENDAFTARAN, tambahBaris } from "@/lib/gsheets";
import { prisma } from "@/lib/prisma";

/**
 * Orkestrasi arsip digital:
 *   - setiap pendaftaran punya satu folder di Drive milik psikolog terkait
 *   - folder itu juga dibuatkan tautan pintas di folder "Data Klien" (keseluruhan)
 *   - tiap psikolog punya satu spreadsheet arsip
 *   - ada satu spreadsheet master untuk seluruh klien
 *   - folder admin memuat tautan pintas ke semua folder psikolog
 */

function pastikanTidakKosong(v: string | null | undefined) {
  const t = v?.trim();
  return t && t.length > 0 ? t : null;
}

async function pengaturan() {
  return prisma.pengaturanSitus.findUnique({ where: { id: "utama" } });
}

/** Menentukan folder induk arsip untuk sebuah pendaftaran. */
async function indukUntuk(pendaftaranId: string) {
  const p = await prisma.pendaftaran.findUnique({
    where: { id: pendaftaranId },
    select: { psikologId: true },
  });
  const set = await pengaturan();

  let folderPsikolog: string | null = null;
  if (p?.psikologId) {
    const profil = await prisma.profilPsikolog.findUnique({
      where: { userId: p.psikologId },
      select: { driveFolderId: true },
    });
    folderPsikolog =
      pastikanTidakKosong(profil?.driveFolderId) ??
      idFolderDariTautan(profil?.driveFolderId ?? null);
  }

  return {
    parent:
      folderPsikolog ??
      pastikanTidakKosong(set?.driveFolderId) ??
      pastikanTidakKosong(process.env.GOOGLE_DRIVE_FOLDER_ID),
    folderKlien: pastikanTidakKosong(set?.driveClientFolderId),
  };
}

/** Memastikan folder arsip sebuah pendaftaran tersedia (sekali buat, dipakai ulang). */
export async function folderPendaftaran(pendaftaranId: string) {
  const p = await prisma.pendaftaran.findUnique({
    where: { id: pendaftaranId },
    include: {
      klien: { select: { nama: true } },
      layanan: { select: { nama: true } },
      psikolog: { select: { nama: true } },
    },
  });
  if (!p) throw new Error("Pendaftaran tidak ditemukan.");

  const idLama = idFolderDariTautan(p.folderDriveUrl);
  if (idLama) return { id: idLama, tautan: p.folderDriveUrl! };

  const { parent, folderKlien } = await indukUntuk(pendaftaranId);
  if (!parent) {
    throw new Error(
      "Folder arsip belum diatur. Isi folder Drive pada profil psikolog atau pada Pengaturan Situs.",
    );
  }

  const nama = `${p.nomor} — ${p.klien.nama}`.slice(0, 100);
  const folder = await pastikanFolder(nama, parent);

  // Tautan pintas di folder "Data Klien" agar keseluruhan klien terlihat.
  if (folderKlien && folderKlien !== parent) {
    try {
      await buatShortcut({
        targetId: folder.id,
        parentId: folderKlien,
        nama: `${p.nomor} — ${p.klien.nama}`.slice(0, 100),
      });
    } catch {
      // Shortcut opsional.
    }
  }

  await prisma.pendaftaran.update({
    where: { id: p.id },
    data: { folderDriveUrl: folder.tautan },
  });

  const ringkasan = [
    `Nomor pendaftaran : ${p.nomor}`,
    `Nama klien        : ${p.klien.nama}`,
    `Layanan           : ${p.layanan.nama}`,
    `Psikolog          : ${p.psikolog?.nama ?? "belum ditetapkan"}`,
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
    // Ringkasan opsional.
  }

  return folder;
}

/** Spreadsheet arsip milik seorang psikolog (dibuat sekali). */
export async function spreadsheetPsikolog(profilPsikologId: string) {
  const profil = await prisma.profilPsikolog.findUnique({
    where: { id: profilPsikologId },
    include: { user: { select: { nama: true } } },
  });
  if (!profil) throw new Error("Profil psikolog tidak ditemukan.");

  if (profil.spreadsheetId) {
    return {
      id: profil.spreadsheetId,
      tautan:
        profil.spreadsheetUrl ??
        `https://docs.google.com/spreadsheets/d/${profil.spreadsheetId}`,
    };
  }

  const set = await pengaturan();
  const folderId =
    pastikanTidakKosong(profil.driveFolderId) ??
    pastikanTidakKosong(set?.driveFolderId) ??
    pastikanTidakKosong(process.env.GOOGLE_DRIVE_FOLDER_ID);
  if (!folderId) {
    throw new Error(
      "Folder Drive psikolog belum diatur sehingga spreadsheet tidak dapat dibuat.",
    );
  }

  const sheet = await buatSpreadsheet({
    nama: `Arsip Pendaftaran — ${profil.user.nama}`,
    folderId,
  });

  await prisma.profilPsikolog.update({
    where: { id: profil.id },
    data: { spreadsheetId: sheet.id, spreadsheetUrl: sheet.tautan },
  });

  return sheet;
}

/** Spreadsheet master berisi seluruh klien. */
export async function spreadsheetKlien() {
  const set = await pengaturan();
  if (set?.spreadsheetId && set.spreadsheetUrl) {
    return { id: set.spreadsheetId, tautan: set.spreadsheetUrl };
  }

  const folderId =
    pastikanTidakKosong(set?.driveClientFolderId) ??
    pastikanTidakKosong(set?.driveFolderId) ??
    pastikanTidakKosong(process.env.GOOGLE_DRIVE_FOLDER_ID);
  if (!folderId) {
    throw new Error("Folder Data Klien belum diatur.");
  }

  const sheet = await buatSpreadsheet({
    nama: "Data Keseluruhan Klien — Tabula Rasa",
    folderId,
  });

  await prisma.pengaturanSitus.upsert({
    where: { id: "utama" },
    create: { id: "utama", spreadsheetId: sheet.id, spreadsheetUrl: sheet.tautan },
    update: { spreadsheetId: sheet.id, spreadsheetUrl: sheet.tautan },
  });

  return sheet;
}

/** Membuat tautan pintas ke seluruh folder psikolog di dalam folder admin. */
export async function sinkronFolderAdmin() {
  const set = await pengaturan();
  const adminFolder =
    pastikanTidakKosong(set?.driveAdminFolderId) ??
    pastikanTidakKosong(set?.driveFolderId) ??
    pastikanTidakKosong(process.env.GOOGLE_DRIVE_FOLDER_ID);
  if (!adminFolder) throw new Error("Folder admin belum diatur.");

  const daftar = await prisma.profilPsikolog.findMany({
    include: { user: { select: { nama: true } } },
  });

  let jumlah = 0;
  for (const p of daftar) {
    const target = pastikanTidakKosong(p.driveFolderId);
    if (!target) continue;
    try {
      await buatShortcut({
        targetId: target,
        parentId: adminFolder,
        nama: `Arsip — ${p.user.nama}`,
      });
      jumlah++;
    } catch {
      // Lewati bila sudah ada atau gagal.
    }
  }

  // Tautan ke folder data keseluruhan klien.
  if (set?.driveClientFolderId) {
    try {
      await buatShortcut({
        targetId: set.driveClientFolderId,
        parentId: adminFolder,
        nama: "Data Keseluruhan Klien",
      });
      jumlah++;
    } catch {
      // Lewati.
    }
  }

  return jumlah;
}

/** Menulis satu baris pendaftaran ke spreadsheet psikolog & spreadsheet klien. */
export async function catatPendaftaranKeSheet(pendaftaranId: string) {
  const p = await prisma.pendaftaran.findUnique({
    where: { id: pendaftaranId },
    include: {
      klien: true,
      layanan: { select: { nama: true } },
      psikolog: { select: { nama: true, profilPsikolog: { select: { id: true } } } },
    },
  });
  if (!p) return { psikolog: false, klien: false };

  const baris = [
    new Date(p.createdAt).toLocaleString("id-ID"),
    p.nomor,
    p.klien.nama,
    p.klien.email,
    p.klien.telepon,
    p.klien.tanggalLahir
      ? new Date(p.klien.tanggalLahir).toLocaleDateString("id-ID")
      : "",
    p.klien.jenisKelamin === "L"
      ? "Laki-laki"
      : p.klien.jenisKelamin === "P"
        ? "Perempuan"
        : "",
    p.klien.institusi ?? p.institusi ?? "",
    p.layanan.nama,
    p.psikolog?.nama ?? "",
    p.metode === "ONLINE" ? "Daring" : "Tatap muka",
    p.status,
    p.kebutuhan ?? "",
    p.folderDriveUrl ?? "",
  ];

  const hasil = { psikolog: false, klien: false };

  const profilId = p.psikolog?.profilPsikolog?.id;
  if (profilId) {
    try {
      const sheet = await spreadsheetPsikolog(profilId);
      await tambahBaris(sheet.id, baris);
      hasil.psikolog = true;
    } catch {
      // Diabaikan — pendaftaran tetap tersimpan di database.
    }
  }

  try {
    const sheet = await spreadsheetKlien();
    await tambahBaris(sheet.id, baris);
    hasil.klien = true;
  } catch {
    // Diabaikan.
  }

  return hasil;
}

export { KOLOM_PENDAFTARAN };

/**
 * Rangkaian lengkap untuk pendaftaran baru: siapkan folder arsip lalu catat
 * barisnya ke spreadsheet. Dipanggil setelah respons dikirim (after()) dan
 * tidak pernah melempar error ke pemanggil.
 */
export async function arsipkanPendaftaranBaru(pendaftaranId: string) {
  let folder: { id: string; tautan: string } | null = null;
  try {
    folder = await folderPendaftaran(pendaftaranId);
  } catch {
    folder = null;
  }

  try {
    await catatPendaftaranKeSheet(pendaftaranId);
  } catch {
    // Diabaikan.
  }

  return folder;
}
