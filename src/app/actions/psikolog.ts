"use server";

import { revalidatePath } from "next/cache";

import { wajibKemampuan } from "@/lib/auth/dal";
import {
  sinkronFolderAdmin,
  spreadsheetKlien,
  spreadsheetPsikolog,
} from "@/lib/drive-arsip";
import { driveAktif, idFolderDariTautan } from "@/lib/gdrive";
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

  const tautanFolder = String(formData.get("driveFolderUrl") ?? "").trim();
  const profil = await prisma.profilPsikolog.findUnique({ where: { id: profilId } });
  if (!profil) return { ok: false, pesan: "Profil tidak ditemukan." };

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

export async function siapkanSpreadsheetPsikolog(
  _sebelumnya: HasilAksi,
  formData: FormData,
): Promise<HasilAksi> {
  const sesi = await wajibKemampuan("psikolog:kelola");
  const profilId = String(formData.get("profilId") ?? "");
  if (!profilId) return { ok: false, pesan: "Profil tidak dikenali." };

  if (!driveAktif()) {
    return {
      ok: false,
      pesan: "Kredensial Google belum diisi. Lengkapi pada Pengaturan Situs.",
    };
  }

  try {
    const sheet = await spreadsheetPsikolog(profilId);
    await catat(
      sesi.userId,
      "BUAT_SPREADSHEET_PSIKOLOG",
      "ProfilPsikolog",
      profilId,
      `Spreadsheet arsip disiapkan: ${sheet.tautan}`,
    );
    revalidatePath("/dashboard/psikolog");
    return { ok: true, pesan: "Spreadsheet arsip psikolog siap." };
  } catch (e) {
    return {
      ok: false,
      pesan: e instanceof Error ? e.message : "Gagal menyiapkan spreadsheet.",
    };
  }
}

export async function siapkanSpreadsheetKlien(
  _sebelumnya: HasilAksi,
  formData: FormData,
): Promise<HasilAksi> {
  const sesi = await wajibKemampuan("psikolog:kelola");
  void formData;

  if (!driveAktif()) {
    return {
      ok: false,
      pesan: "Kredensial Google belum diisi. Lengkapi pada Pengaturan Situs.",
    };
  }

  try {
    const sheet = await spreadsheetKlien();
    await catat(
      sesi.userId,
      "BUAT_SPREADSHEET_KLIEN",
      "PengaturanSitus",
      "utama",
      `Spreadsheet data keseluruhan klien disiapkan: ${sheet.tautan}`,
    );
    revalidatePath("/dashboard/psikolog");
    return { ok: true, pesan: "Spreadsheet data keseluruhan klien siap." };
  } catch (e) {
    return {
      ok: false,
      pesan: e instanceof Error ? e.message : "Gagal menyiapkan spreadsheet.",
    };
  }
}

export async function sinkronAdmin(
  _sebelumnya: HasilAksi,
  formData: FormData,
): Promise<HasilAksi> {
  const sesi = await wajibKemampuan("psikolog:kelola");
  void formData;

  if (!driveAktif()) {
    return {
      ok: false,
      pesan: "Kredensial Google belum diisi. Lengkapi pada Pengaturan Situs.",
    };
  }

  try {
    const jumlah = await sinkronFolderAdmin();
    await catat(
      sesi.userId,
      "SINKRON_FOLDER_ADMIN",
      "PengaturanSitus",
      "utama",
      `${jumlah} tautan pintas disiapkan pada folder admin`,
    );
    revalidatePath("/dashboard/psikolog");
    return {
      ok: true,
      pesan: `Sinkron selesai. ${jumlah} tautan pintas ditambahkan ke folder admin.`,
    };
  } catch (e) {
    return {
      ok: false,
      pesan: e instanceof Error ? e.message : "Gagal menyinkronkan folder admin.",
    };
  }
}
