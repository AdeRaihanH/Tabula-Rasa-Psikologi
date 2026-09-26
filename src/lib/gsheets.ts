import "server-only";

import { google } from "googleapis";

import { authGoogle, driveAktif } from "@/lib/gdrive";

/**
 * Penulisan arsip pendaftaran ke Google Spreadsheet.
 *
 * Memakai service account yang sama dengan modul Google Drive. Bila kredensial
 * belum diisi, pemanggil harus menangani kegagalan secara aman agar
 * pendaftaran tetap tersimpan di database.
 */

export type HasilSheet = { id: string; tautan: string };

export const JUDUL_SHEET = "Pendaftaran";

export const KOLOM_PENDAFTARAN = [
  "Waktu Masuk",
  "Nomor Pendaftaran",
  "Nama Klien",
  "Email",
  "Telepon",
  "Tanggal Lahir",
  "Jenis Kelamin",
  "Institusi",
  "Layanan",
  "Psikolog",
  "Metode",
  "Status",
  "Kebutuhan",
  "Folder Drive",
] as const;

export function sheetsAktif() {
  return driveAktif();
}

function drive() {
  return google.drive({ version: "v3", auth: authGoogle() });
}

function sheets() {
  return google.sheets({ version: "v4", auth: authGoogle() });
}

/** Membuat spreadsheet baru di dalam folder tertentu + menulis baris judul. */
export async function buatSpreadsheet(opsi: {
  nama: string;
  folderId: string;
}): Promise<HasilSheet> {
  const dibuat = await drive().files.create({
    requestBody: {
      name: opsi.nama,
      mimeType: "application/vnd.google-apps.spreadsheet",
      parents: [opsi.folderId],
    },
    fields: "id, webViewLink",
    supportsAllDrives: true,
  });

  const id = dibuat.data.id!;

  await sheets().spreadsheets.values.update({
    spreadsheetId: id,
    range: `${JUDUL_SHEET}!A1`,
    valueInputOption: "RAW",
    requestBody: { values: [[...KOLOM_PENDAFTARAN]] },
  });

  return {
    id,
    tautan:
      dibuat.data.webViewLink ?? `https://docs.google.com/spreadsheets/d/${id}`,
  };
}

/** Menambahkan satu baris pendaftaran ke spreadsheet. */
export async function tambahBaris(
  spreadsheetId: string,
  baris: Array<string | number | null>,
) {
  await sheets().spreadsheets.values.append({
    spreadsheetId,
    range: `${JUDUL_SHEET}!A1`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [baris.map((b) => (b === null || b === undefined ? "" : b))],
    },
  });
}
