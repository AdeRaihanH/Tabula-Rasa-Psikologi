"use server";

import { revalidatePath } from "next/cache";

import { wajibKemampuan } from "@/lib/auth/dal";
import {
  buatSpreadsheetKlien,
  buatSpreadsheetPsikolog,
  rapikanSemuaSpreadsheet,
  rapikanSpreadsheetKlien,
  rapikanSpreadsheetPsikolog,
  sinkronFolderAdmin,
  spreadsheetKlien,
  spreadsheetPsikolog,
  ujiSpreadsheet,
} from "@/lib/drive-arsip";
import {
  bisaMembuatBerkas,
  driveAktif,
  idFolderDariTautan,
  idSpreadsheetDariTautan,
} from "@/lib/gdrive";
import { prisma } from "@/lib/prisma";

export type HasilAksi = { ok: boolean; pesan: string } | undefined;

async function catat(
  userId: string,
  aksi: string,
  entitas: string,
  entitasId: string,
  detail: string,
) {
  await prisma.auditLog.create({
    data: { userId, aksi, entitas, entitasId, detail },
  });
}

function pesanError(e: unknown, bawaan: string) {
  return e instanceof Error ? e.message : bawaan;
}

export async function simpanPsikolog(
  _sebelumnya: HasilAksi,
  formData: FormData,
): Promise<HasilAksi> {
  const sesi = await wajibKemampuan("psikolog:kelola");
  const profilId = String(formData.get("profilId") ?? "");
  if (!profilId) return { ok: false, pesan: "Profil tidak dikenali." };

  const nama = String(formData.get("nama") ?? "").trim();
  const spesialisasi = String(formData.get("spesialisasi") ?? "").trim();
  if (!nama || !spesialisasi) {
    return { ok: false, pesan: "Nama dan spesialisasi wajib diisi." };
  }

  const profil = await prisma.profilPsikolog.findUnique({ where: { id: profilId } });
  if (!profil) return { ok: false, pesan: "Profil tidak ditemukan." };

  const tautanFolder = String(formData.get("driveFolderUrl") ?? "").trim();
  const tautanSheet = String(formData.get("spreadsheetUrl") ?? "").trim();

  const data = {
    spesialisasi,
    gelar: String(formData.get("gelar") ?? "").trim() || null,
    sipp: String(formData.get("sipp") ?? "").trim() || null,
    str: String(formData.get("str") ?? "").trim() || null,
    bio: String(formData.get("bio") ?? "").trim() || null,
    pengalaman: Number(formData.get("pengalaman") ?? 0) || 0,
    publik: formData.get("publik") === "on",
    fotoUrl: String(formData.get("fotoUrl") ?? "").trim() || null,
    driveFolderUrl: tautanFolder || null,
    driveFolderId: idFolderDariTautan(tautanFolder),
    spreadsheetUrl: tautanSheet || null,
    spreadsheetId: idSpreadsheetDariTautan(tautanSheet),
  };

  await prisma.$transaction([
    prisma.user.update({ where: { id: profil.userId }, data: { nama } }),
    prisma.profilPsikolog.update({ where: { id: profilId }, data }),
  ]);

  await catat(
    sesi.userId,
    "PERBARUI_PSIKOLOG",
    "ProfilPsikolog",
    profilId,
    `Profil ${nama} diperbarui`,
  );

  revalidatePath("/dashboard/psikolog");
  revalidatePath("/tim", "page");
  revalidatePath("/", "page");
  return { ok: true, pesan: `Profil ${nama} berhasil disimpan.` };
}

/** Membuat spreadsheet otomatis (hanya bila memakai OAuth akun biro). */
export async function siapkanSpreadsheetPsikolog(
  _sebelumnya: HasilAksi,
  formData: FormData,
): Promise<HasilAksi> {
  const sesi = await wajibKemampuan("psikolog:kelola");
  const profilId = String(formData.get("profilId") ?? "");
  if (!profilId) return { ok: false, pesan: "Profil tidak dikenali." };

  if (!driveAktif()) {
    return { ok: false, pesan: "Kredensial Google belum diisi." };
  }

  try {
    const sheet = await buatSpreadsheetPsikolog(profilId);
    await catat(
      sesi.userId,
      "BUAT_SPREADSHEET_PSIKOLOG",
      "ProfilPsikolog",
      profilId,
      `Spreadsheet arsip dibuat: ${sheet.tautan}`,
    );
    revalidatePath("/dashboard/psikolog");
    return { ok: true, pesan: "Spreadsheet arsip psikolog berhasil dibuat." };
  } catch (e) {
    return { ok: false, pesan: pesanError(e, "Gagal membuat spreadsheet.") };
  }
}

/** Menulis baris uji ke spreadsheet psikolog untuk memastikan dapat diakses. */
export async function ujiSpreadsheetPsikolog(
  _sebelumnya: HasilAksi,
  formData: FormData,
): Promise<HasilAksi> {
  const sesi = await wajibKemampuan("psikolog:kelola");
  const profilId = String(formData.get("profilId") ?? "");
  if (!profilId) return { ok: false, pesan: "Profil tidak dikenali." };

  try {
    const sheet = await spreadsheetPsikolog(profilId);
    await ujiSpreadsheet(sheet.id);
    await catat(
      sesi.userId,
      "UJI_SPREADSHEET_PSIKOLOG",
      "ProfilPsikolog",
      profilId,
      `Baris uji ditulis ke spreadsheet psikolog`,
    );
    return {
      ok: true,
      pesan: "Berhasil. Baris uji ditambahkan ke spreadsheet psikolog.",
    };
  } catch (e) {
    return { ok: false, pesan: pesanError(e, "Gagal menulis ke spreadsheet.") };
  }
}

/** Menyimpan tautan spreadsheet master klien yang dibuat manual. */
export async function simpanSpreadsheetKlien(
  _sebelumnya: HasilAksi,
  formData: FormData,
): Promise<HasilAksi> {
  const sesi = await wajibKemampuan("psikolog:kelola");
  const tautan = String(formData.get("spreadsheetUrl") ?? "").trim();

  await prisma.pengaturanSitus.upsert({
    where: { id: "utama" },
    create: {
      id: "utama",
      spreadsheetUrl: tautan || null,
      spreadsheetId: idSpreadsheetDariTautan(tautan),
    },
    update: {
      spreadsheetUrl: tautan || null,
      spreadsheetId: idSpreadsheetDariTautan(tautan),
    },
  });

  await catat(
    sesi.userId,
    "SIMPAN_SPREADSHEET_KLIEN",
    "PengaturanSitus",
    "utama",
    tautan ? "Tautan spreadsheet master diperbarui" : "Tautan spreadsheet master dikosongkan",
  );

  revalidatePath("/dashboard/psikolog");
  return { ok: true, pesan: "Tautan spreadsheet master klien disimpan." };
}

/** Membuat spreadsheet master otomatis (hanya mode OAuth). */
export async function siapkanSpreadsheetKlien(
  _sebelumnya: HasilAksi,
  formData: FormData,
): Promise<HasilAksi> {
  const sesi = await wajibKemampuan("psikolog:kelola");
  void formData;

  if (!driveAktif()) {
    return { ok: false, pesan: "Kredensial Google belum diisi." };
  }

  try {
    const sheet = await buatSpreadsheetKlien();
    await catat(
      sesi.userId,
      "BUAT_SPREADSHEET_KLIEN",
      "PengaturanSitus",
      "utama",
      `Spreadsheet master klien dibuat: ${sheet.tautan}`,
    );
    revalidatePath("/dashboard/psikolog");
    return { ok: true, pesan: "Spreadsheet data keseluruhan klien berhasil dibuat." };
  } catch (e) {
    return { ok: false, pesan: pesanError(e, "Gagal membuat spreadsheet.") };
  }
}

/** Menulis baris uji ke spreadsheet master klien. */
export async function ujiSpreadsheetKlien(
  _sebelumnya: HasilAksi,
  formData: FormData,
): Promise<HasilAksi> {
  const sesi = await wajibKemampuan("psikolog:kelola");
  void formData;

  try {
    const sheet = await spreadsheetKlien();
    await ujiSpreadsheet(sheet.id);
    await catat(
      sesi.userId,
      "UJI_SPREADSHEET_KLIEN",
      "PengaturanSitus",
      "utama",
      `Baris uji ditulis ke spreadsheet master`,
    );
    return {
      ok: true,
      pesan: "Berhasil. Baris uji ditambahkan ke spreadsheet master klien.",
    };
  } catch (e) {
    return { ok: false, pesan: pesanError(e, "Gagal menulis ke spreadsheet.") };
  }
}

/** Merapikan tampilan tabel spreadsheet arsip milik seorang psikolog. */
export async function rapikanSpreadsheetPsikologAksi(
  _sebelumnya: HasilAksi,
  formData: FormData,
): Promise<HasilAksi> {
  const sesi = await wajibKemampuan("psikolog:kelola");
  const profilId = String(formData.get("profilId") ?? "");
  if (!profilId) return { ok: false, pesan: "Profil tidak dikenali." };

  try {
    await rapikanSpreadsheetPsikolog(profilId);
    await catat(
      sesi.userId,
      "RAPIKAN_SPREADSHEET_PSIKOLOG",
      "ProfilPsikolog",
      profilId,
      "Tampilan tabel spreadsheet psikolog dirapikan",
    );
    return { ok: true, pesan: "Tabel spreadsheet berhasil dirapikan." };
  } catch (e) {
    return { ok: false, pesan: pesanError(e, "Gagal merapikan tabel.") };
  }
}

/** Merapikan tampilan tabel spreadsheet master klien. */
export async function rapikanSpreadsheetKlienAksi(
  _sebelumnya: HasilAksi,
  formData: FormData,
): Promise<HasilAksi> {
  const sesi = await wajibKemampuan("psikolog:kelola");
  void formData;

  try {
    await rapikanSpreadsheetKlien();
    await catat(
      sesi.userId,
      "RAPIKAN_SPREADSHEET_KLIEN",
      "PengaturanSitus",
      "utama",
      "Tampilan tabel spreadsheet master dirapikan",
    );
    return { ok: true, pesan: "Tabel spreadsheet master berhasil dirapikan." };
  } catch (e) {
    return { ok: false, pesan: pesanError(e, "Gagal merapikan tabel.") };
  }
}

/** Merapikan seluruh spreadsheet sekaligus (5 psikolog + master). */
export async function rapikanSemuaAksi(
  _sebelumnya: HasilAksi,
  formData: FormData,
): Promise<HasilAksi> {
  const sesi = await wajibKemampuan("psikolog:kelola");
  void formData;

  try {
    const hasil = await rapikanSemuaSpreadsheet();
    await catat(
      sesi.userId,
      "RAPIKAN_SEMUA_SPREADSHEET",
      "PengaturanSitus",
      "utama",
      `${hasil.berhasil} spreadsheet dirapikan, ${hasil.gagal.length} gagal`,
    );

    if (hasil.gagal.length === 0) {
      return {
        ok: true,
        pesan: `Selesai. ${hasil.berhasil} spreadsheet berhasil dirapikan.`,
      };
    }
    return {
      ok: hasil.berhasil > 0,
      pesan: `${hasil.berhasil} berhasil, ${hasil.gagal.length} gagal: ${hasil.gagal.join("; ")}`,
    };
  } catch (e) {
    return { ok: false, pesan: pesanError(e, "Gagal merapikan spreadsheet.") };
  }
}

export async function sinkronAdmin(
  _sebelumnya: HasilAksi,
  formData: FormData,
): Promise<HasilAksi> {
  const sesi = await wajibKemampuan("psikolog:kelola");
  void formData;

  if (!bisaMembuatBerkas()) {
    return {
      ok: false,
      pesan:
        "Sinkronisasi tautan pintas memerlukan OAuth akun biro (service account tidak dapat membuat berkas).",
    };
  }

  try {
    const hasil = await sinkronFolderAdmin();
    await catat(
      sesi.userId,
      "SINKRON_FOLDER_ADMIN",
      "PengaturanSitus",
      "utama",
      `${hasil.dibuat} tautan pintas dibuat, ${hasil.dilewati} dilewati (sudah ada)`,
    );
    revalidatePath("/dashboard/psikolog");
    return {
      ok: true,
      pesan: `Selesai. ${hasil.dibuat} tautan pintas dibuat, ${hasil.dilewati} dilewati karena sudah ada di folder admin.`,
    };
  } catch (e) {
    return { ok: false, pesan: pesanError(e, "Gagal menyinkronkan folder admin.") };
  }
}
