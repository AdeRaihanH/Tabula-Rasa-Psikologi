import "server-only";

import {
  bisaMembuatBerkas,
  buatShortcut,
  daftarIsiFolder,
  idFolderDariTautan,
  idSpreadsheetDariTautan,
  pastikanFolder,
  unggahTeks,
} from "@/lib/gdrive";
import { buatSpreadsheet, JUDUL_SHEET, rapikanSpreadsheet, tambahBaris } from "@/lib/gsheets";
import { ZONA_WAKTU } from "@/lib/jadwal";
import { prisma } from "@/lib/prisma";

/**
 * Orkestrasi arsip digital.
 *
 * Ada dua mode kredensial Google:
 *
 *  - OAuth akun biro  → berkas/folder/spreadsheet dibuat otomatis.
 *  - Service account  → TIDAK bisa membuat berkas (kuota 0), jadi:
 *      · folder kasus memakai folder psikolog yang sudah ada, dan
 *      · spreadsheet harus dibuat manual lalu dibagikan ke service account;
 *        aplikasi hanya MENAMBAH BARIS (tidak butuh kuota).
 */

function bersih(v: string | null | undefined) {
  const t = v?.trim();
  return t && t.length > 0 ? t : null;
}

async function pengaturan() {
  return prisma.pengaturanSitus.findUnique({ where: { id: "utama" } });
}

/** Folder induk arsip untuk sebuah pendaftaran (hanya dipakai mode OAuth). */
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
      bersih(profil?.driveFolderId) ?? idFolderDariTautan(profil?.driveFolderId ?? null);
  }

  return {
    parent:
      folderPsikolog ??
      bersih(set?.driveFolderId) ??
      bersih(process.env.GOOGLE_DRIVE_FOLDER_ID),
    folderKlien: bersih(set?.driveClientFolderId),
  };
}

/**
 * Folder arsip sebuah pendaftaran.
 * Mode OAuth: folder dibuat otomatis di folder psikolog.
 * Mode service account: memakai folder psikolog yang sudah ada.
 */
export async function folderPendaftaran(pendaftaranId: string) {
  const p = await prisma.pendaftaran.findUnique({
    where: { id: pendaftaranId },
    include: {
      klien: { select: { nama: true } },
      layanan: { select: { nama: true } },
      psikolog: {
        select: { nama: true, profilPsikolog: { select: { driveFolderUrl: true } } },
      },
    },
  });
  if (!p) throw new Error("Pendaftaran tidak ditemukan.");

  const idLama = idFolderDariTautan(p.folderDriveUrl);
  if (idLama) return { id: idLama, tautan: p.folderDriveUrl! };

  // Mode service account: tidak membuat apa pun, cukup menautkan folder psikolog.
  if (!bisaMembuatBerkas()) {
    const tautan = p.psikolog?.profilPsikolog?.driveFolderUrl ?? null;
    if (tautan) {
      await prisma.pendaftaran.update({
        where: { id: p.id },
        data: { folderDriveUrl: tautan },
      });
      return { id: idFolderDariTautan(tautan) ?? "", tautan };
    }
    throw new Error(
      "Mode service account tidak dapat membuat folder. Isi tautan folder Drive pada profil psikolog.",
    );
  }

  const { parent, folderKlien } = await indukUntuk(pendaftaranId);
  if (!parent) {
    throw new Error(
      "Folder arsip belum diatur. Isi folder Drive pada profil psikolog atau pada Pengaturan Situs.",
    );
  }

  const nama = `${p.nomor} — ${p.klien.nama}`.slice(0, 100);
  const folder = await pastikanFolder(nama, parent);

  if (folderKlien && folderKlien !== parent) {
    try {
      await buatShortcut({
        targetId: folder.id,
        parentId: folderKlien,
        nama,
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
    `Metode            : Tatap Muka`,
    `Status            : ${p.status}`,
    `Tanggal masuk     : ${p.createdAt.toLocaleString("id-ID", { timeZone: ZONA_WAKTU })}`,
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

/** Spreadsheet arsip milik seorang psikolog (tautan diisi admin). */
export async function spreadsheetPsikolog(profilPsikologId: string) {
  const profil = await prisma.profilPsikolog.findUnique({
    where: { id: profilPsikologId },
    select: { spreadsheetId: true, spreadsheetUrl: true },
  });
  if (!profil) throw new Error("Profil psikolog tidak ditemukan.");

  const id =
    bersih(profil.spreadsheetId) ?? idSpreadsheetDariTautan(profil.spreadsheetUrl);
  if (!id) {
    throw new Error(
      "Spreadsheet arsip psikolog belum diatur. Buat Google Spreadsheet lalu tempel tautannya pada kartu psikolog.",
    );
  }

  return {
    id,
    tautan: profil.spreadsheetUrl ?? `https://docs.google.com/spreadsheets/d/${id}`,
  };
}

/** Spreadsheet master berisi seluruh klien (tautan diisi admin). */
export async function spreadsheetKlien() {
  const set = await pengaturan();
  const id = bersih(set?.spreadsheetId) ?? idSpreadsheetDariTautan(set?.spreadsheetUrl);
  if (!id) {
    throw new Error(
      "Spreadsheet master belum diatur. Buat Google Spreadsheet lalu tempel tautannya pada Pengaturan Situs.",
    );
  }
  return {
    id,
    tautan: set?.spreadsheetUrl ?? `https://docs.google.com/spreadsheets/d/${id}`,
  };
}

/**
 * Membuat spreadsheet otomatis — hanya berhasil pada mode OAuth.
 * Pada mode service account, admin harus membuatnya manual.
 */
export async function buatSpreadsheetPsikolog(profilPsikologId: string) {
  if (!bisaMembuatBerkas()) {
    throw new Error(
      "Service account tidak dapat membuat spreadsheet (kuota penyimpanan 0). Buat Google Spreadsheet manual lalu tempel tautannya.",
    );
  }

  const profil = await prisma.profilPsikolog.findUnique({
    where: { id: profilPsikologId },
    include: { user: { select: { nama: true } } },
  });
  if (!profil) throw new Error("Profil psikolog tidak ditemukan.");

  const set = await pengaturan();
  const folderId =
    bersih(profil.driveFolderId) ??
    bersih(set?.driveFolderId) ??
    bersih(process.env.GOOGLE_DRIVE_FOLDER_ID);
  if (!folderId) throw new Error("Folder Drive psikolog belum diatur.");

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

/** Membuat spreadsheet master otomatis — hanya mode OAuth. */
export async function buatSpreadsheetKlien() {
  if (!bisaMembuatBerkas()) {
    throw new Error(
      "Service account tidak dapat membuat spreadsheet (kuota penyimpanan 0). Buat Google Spreadsheet manual lalu tempel tautannya pada Pengaturan Situs.",
    );
  }

  const set = await pengaturan();
  const folderId =
    bersih(set?.driveClientFolderId) ??
    bersih(set?.driveFolderId) ??
    bersih(process.env.GOOGLE_DRIVE_FOLDER_ID);
  if (!folderId) throw new Error("Folder Data Klien belum diatur.");

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

/**
 * Tautan pintas ke folder tiap psikolog di folder admin (hanya mode OAuth).
 *
 * Penting: bila folder psikolog SUDAH berada langsung di dalam folder admin,
 * tautan pintas tidak dibuat — supaya tidak muncul berkas kembar.
 */
export async function sinkronFolderAdmin() {
  if (!bisaMembuatBerkas()) {
    throw new Error(
      "Service account tidak dapat membuat tautan pintas (kuota penyimpanan 0).",
    );
  }

  const set = await pengaturan();
  const adminFolder =
    bersih(set?.driveAdminFolderId) ??
    bersih(set?.driveFolderId) ??
    bersih(process.env.GOOGLE_DRIVE_FOLDER_ID);
  if (!adminFolder) throw new Error("Folder admin belum diatur.");

  // Isi folder admin saat ini, untuk mencegah duplikasi.
  const isi = await daftarIsiFolder(adminFolder);
  const idSudahAda = new Set<string>();
  const namaSudahAda = new Set<string>();
  for (const f of isi) {
    if (f.id) idSudahAda.add(f.id);
    if (f.name) namaSudahAda.add(f.name);
    const target = f.shortcutDetails?.targetId;
    if (target) idSudahAda.add(target);
  }

  const daftar = await prisma.profilPsikolog.findMany({
    include: { user: { select: { nama: true } } },
  });

  let jumlah = 0;
  let dilewati = 0;

  for (const p of daftar) {
    const target = bersih(p.driveFolderId);
    if (!target) continue;

    const nama = `Arsip — ${p.user.nama}`;
    if (idSudahAda.has(target) || namaSudahAda.has(nama)) {
      dilewati++;
      continue;
    }

    try {
      await buatShortcut({ targetId: target, parentId: adminFolder, nama });
      jumlah++;
    } catch {
      // Lewati bila gagal.
    }
  }

  if (set?.driveClientFolderId) {
    const nama = "Data Keseluruhan Klien";
    const sudahAda =
      idSudahAda.has(set.driveClientFolderId) || namaSudahAda.has(nama);
    if (!sudahAda) {
      try {
        await buatShortcut({
          targetId: set.driveClientFolderId,
          parentId: adminFolder,
          nama,
        });
        jumlah++;
      } catch {
        // Lewati.
      }
    } else {
      dilewati++;
    }
  }

  return { dibuat: jumlah, dilewati };
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
  if (!p) return { psikolog: false, klien: false, pesan: ["Pendaftaran tidak ditemukan."] };

  const baris = [
    new Date(p.createdAt).toLocaleString("id-ID", { timeZone: ZONA_WAKTU }),
    p.nomor,
    p.klien.nama,
    p.klien.email,
    p.klien.telepon,
    p.klien.tanggalLahir
      ? new Date(p.klien.tanggalLahir).toLocaleDateString("id-ID", {
          timeZone: ZONA_WAKTU,
        })
      : "",
    p.klien.jenisKelamin === "L"
      ? "Laki-laki"
      : p.klien.jenisKelamin === "P"
        ? "Perempuan"
        : "",
    p.klien.institusi ?? p.institusi ?? "",
    p.layanan.nama,
    p.psikolog?.nama ?? "",
    "Tatap Muka",
    p.status,
    p.kebutuhan ?? "",
    p.folderDriveUrl ?? "",
  ];

  const hasil = { psikolog: false, klien: false, pesan: [] as string[] };

  const profilId = p.psikolog?.profilPsikolog?.id;
  if (profilId) {
    try {
      const sheet = await spreadsheetPsikolog(profilId);
      await tambahBaris(sheet.id, baris);
      hasil.psikolog = true;
    } catch (e) {
      hasil.pesan.push(e instanceof Error ? e.message : "Gagal menulis spreadsheet psikolog.");
    }
  }

  try {
    const sheet = await spreadsheetKlien();
    await tambahBaris(sheet.id, baris);
    hasil.klien = true;
  } catch (e) {
    hasil.pesan.push(e instanceof Error ? e.message : "Gagal menulis spreadsheet master.");
  }

  return hasil;
}

/**
 * Rangkaian lengkap untuk pendaftaran baru. Dipanggil setelah respons dikirim
 * dan tidak pernah melempar error ke pemanggil.
 */
export async function arsipkanPendaftaranBaru(pendaftaranId: string) {
  let folder: { id: string; tautan: string } | null = null;
  try {
    folder = await folderPendaftaran(pendaftaranId);
  } catch (e) {
    console.error(`[arsip] gagal membuat folder untuk pendaftaran ${pendaftaranId}:`, e);
    folder = null;
  }

  try {
    const hasil = await catatPendaftaranKeSheet(pendaftaranId);
    if (hasil.pesan.length > 0) {
      console.error(
        `[arsip] sebagian gagal menulis spreadsheet untuk ${pendaftaranId}:`,
        hasil.pesan,
      );
    }
  } catch (e) {
    console.error(`[arsip] gagal menulis spreadsheet untuk ${pendaftaranId}:`, e);
  }

  return folder;
}

/** Menambahkan baris judul + baris uji ke spreadsheet (untuk verifikasi). */
export async function ujiSpreadsheet(spreadsheetId: string) {
  await tambahBaris(spreadsheetId, [
    new Date().toLocaleString("id-ID"),
    "UJI-KONEKSI",
    "Baris uji dari Tabula Rasa",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "Baris ini dibuat untuk memastikan spreadsheet dapat ditulis.",
    "",
  ]);
}

/** Merapikan tampilan tabel spreadsheet arsip milik seorang psikolog. */
export async function rapikanSpreadsheetPsikolog(profilPsikologId: string) {
  const sheet = await spreadsheetPsikolog(profilPsikologId);
  await rapikanSpreadsheet(sheet.id);
  return sheet;
}

/** Merapikan tampilan tabel spreadsheet master klien. */
export async function rapikanSpreadsheetKlien() {
  const sheet = await spreadsheetKlien();
  await rapikanSpreadsheet(sheet.id);
  return sheet;
}

/** Merapikan seluruh spreadsheet (5 psikolog + master klien). */
export async function rapikanSemuaSpreadsheet() {
  const hasil = { berhasil: 0, gagal: [] as string[] };

  const daftar = await prisma.profilPsikolog.findMany({
    include: { user: { select: { nama: true } } },
  });

  for (const p of daftar) {
    try {
      await rapikanSpreadsheetPsikolog(p.id);
      hasil.berhasil++;
    } catch (e) {
      hasil.gagal.push(
        `${p.user.nama}: ${e instanceof Error ? e.message : "gagal"}`,
      );
    }
  }

  try {
    await rapikanSpreadsheetKlien();
    hasil.berhasil++;
  } catch (e) {
    hasil.gagal.push(
      `Master klien: ${e instanceof Error ? e.message : "gagal"}`,
    );
  }

  return hasil;
}

export { JUDUL_SHEET };
