import "server-only";

import { Readable } from "node:stream";

import { google } from "googleapis";

/**
 * Integrasi Google Workspace (Drive & Sheets).
 *
 * Dua mode koneksi, dipilih otomatis:
 *
 *  1. OAuth akun biro (DISARANKAN) — variabel:
 *       GOOGLE_OAUTH_CLIENT_ID
 *       GOOGLE_OAUTH_CLIENT_SECRET
 *       GOOGLE_OAUTH_REFRESH_TOKEN
 *     File dibuat atas nama akun biro sehingga kuota penyimpanan akun biro
 *     yang dipakai dan folder tidak perlu dibagikan ke siapa pun.
 *
 *  2. Service account — variabel:
 *       GOOGLE_SERVICE_ACCOUNT_EMAIL
 *       GOOGLE_PRIVATE_KEY
 *     CATATAN: service account tidak memiliki kuota penyimpanan, sehingga
 *     hanya bisa MEMBACA. Untuk membuat folder/berkas/spreadsheet Google akan
 *     menolak dengan `storageQuotaExceeded`. Mode ini hanya cadangan.
 *
 * Bila tidak ada kredensial, fitur Google otomatis dinonaktifkan dan aplikasi
 * tetap berjalan normal.
 */

export type HasilDrive = { id: string; tautan: string };

const SCOPE = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/spreadsheets",
];

function kredensialSA() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!email || !key) return null;
  return { email, key };
}

function kredensialOAuth() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return null;
  return { clientId, clientSecret, refreshToken };
}

export type StatusGoogle = {
  aktif: boolean;
  mode: "oauth" | "service-account" | "nonaktif";
  label: string;
  pesan: string;
};

/** Status integrasi Google untuk ditampilkan di dashboard. */
export function statusGoogle(): StatusGoogle {
  if (kredensialOAuth()) {
    return {
      aktif: true,
      mode: "oauth",
      label: "OAuth akun biro",
      pesan:
        "Terhubung memakai akun Google biro. Berkas dan spreadsheet dibuat otomatis atas nama akun biro.",
    };
  }
  if (kredensialSA()) {
    return {
      aktif: true,
      mode: "service-account",
      label: "Service account (mode terbatas)",
      pesan:
        "Terhubung dengan service account. Service account tidak punya kuota penyimpanan, jadi ia TIDAK dapat membuat folder/berkas/spreadsheet baru. Yang tetap berjalan: menambah baris ke spreadsheet yang sudah Anda buat dan bagikan. Buat spreadsheet manual lalu tempel tautannya di halaman ini dan di kartu tiap psikolog.",
    };
  }
  return {
    aktif: false,
    mode: "nonaktif",
    label: "Belum dikonfigurasi",
    pesan:
      "Kredensial Google belum diisi. Fitur arsip digital dinonaktifkan dan pendaftaran tetap berjalan normal.",
  };
}

/** True bila salah satu mode kredensial tersedia (bisa membaca/mengubah). */
export function driveAktif() {
  return kredensialOAuth() !== null || kredensialSA() !== null;
}

/**
 * Hanya mode OAuth (akun biro) yang boleh MEMBUAT berkas/folder/spreadsheet.
 * Service account tidak punya kuota penyimpanan sehingga selalu ditolak.
 */
export function bisaMembuatBerkas() {
  return kredensialOAuth() !== null;
}

/** Mengambil ID spreadsheet dari tautan Google Sheets. */
export function idSpreadsheetDariTautan(tautan: string | null | undefined) {
  if (!tautan) return null;
  const cocok = tautan.match(/\/spreadsheets\/d\/([A-Za-z0-9_-]+)/);
  return cocok?.[1] ?? null;
}

export function folderIndukId() {
  return process.env.GOOGLE_DRIVE_FOLDER_ID ?? null;
}

export function authGoogle() {
  const oauth = kredensialOAuth();
  if (oauth) {
    const klien = new google.auth.OAuth2(oauth.clientId, oauth.clientSecret);
    klien.setCredentials({ refresh_token: oauth.refreshToken });
    return klien;
  }

  const sa = kredensialSA();
  if (sa) {
    return new google.auth.JWT({
      email: sa.email,
      key: sa.key,
      scopes: SCOPE,
    });
  }

  throw new Error(
    "Kredensial Google belum diisi. Isi GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, dan GOOGLE_OAUTH_REFRESH_TOKEN.",
  );
}

export function driveKlien() {
  return google.drive({ version: "v3", auth: authGoogle() });
}

export function idFolderDariTautan(tautan: string | null | undefined) {
  if (!tautan) return null;
  const cocok = tautan.match(/\/folders\/([A-Za-z0-9_-]+)/);
  return cocok?.[1] ?? null;
}

async function cariFolder(nama: string, indukId: string) {
  const drive = driveKlien();
  const aman = nama.replace(/'/g, "\\'");
  const res = await drive.files.list({
    q: `name = '${aman}' and '${indukId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id, webViewLink)",
    pageSize: 1,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  return res.data.files?.[0] ?? null;
}

/** Membuat folder bila belum ada, lalu mengembalikan id + tautannya. */
export async function pastikanFolder(
  nama: string,
  indukId?: string | null,
): Promise<HasilDrive> {
  const parent = indukId ?? folderIndukId();
  if (!parent) throw new Error("Folder induk Google Drive belum diatur.");

  const ada = await cariFolder(nama, parent);
  if (ada?.id) {
    return {
      id: ada.id,
      tautan: ada.webViewLink ?? `https://drive.google.com/drive/folders/${ada.id}`,
    };
  }

  const drive = driveKlien();
  const dibuat = await drive.files.create({
    requestBody: {
      name: nama,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parent],
    },
    fields: "id, webViewLink",
    supportsAllDrives: true,
  });

  const id = dibuat.data.id!;
  return {
    id,
    tautan: dibuat.data.webViewLink ?? `https://drive.google.com/drive/folders/${id}`,
  };
}

/** Mengunggah sebuah berkas ke folder tertentu. */
export async function unggahBerkas(opsi: {
  nama: string;
  mimeType: string;
  data: Buffer;
  folderId: string;
}): Promise<HasilDrive> {
  const drive = driveKlien();
  const res = await drive.files.create({
    requestBody: {
      name: opsi.nama,
      parents: [opsi.folderId],
    },
    media: {
      mimeType: opsi.mimeType,
      body: Readable.from(opsi.data),
    },
    fields: "id, webViewLink",
    supportsAllDrives: true,
  });

  const id = res.data.id!;
  return {
    id,
    tautan: res.data.webViewLink ?? `https://drive.google.com/file/d/${id}/view`,
  };
}

/** Membuat berkas teks (mis. ringkasan pendaftaran) di dalam folder. */
export async function unggahTeks(opsi: {
  nama: string;
  isi: string;
  folderId: string;
}): Promise<HasilDrive> {
  return unggahBerkas({
    nama: opsi.nama,
    mimeType: "text/plain",
    data: Buffer.from(opsi.isi, "utf8"),
    folderId: opsi.folderId,
  });
}

/** Membuat tautan pintas (shortcut) ke folder/berkas lain. */
export async function buatShortcut(opsi: {
  targetId: string;
  parentId: string;
  nama: string;
}) {
  const drive = driveKlien();
  await drive.files.create({
    requestBody: {
      name: opsi.nama,
      mimeType: "application/vnd.google-apps.shortcut",
      parents: [opsi.parentId],
      shortcutDetails: { targetId: opsi.targetId },
    },
    fields: "id",
    supportsAllDrives: true,
  });
}

/** Mendaftar isi sebuah folder (id, nama, jenis). */
export async function daftarIsiFolder(folderId: string) {
  const drive = driveKlien();
  const r = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: "files(id,name,mimeType,shortcutDetails(targetId))",
    pageSize: 200,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  return r.data.files ?? [];
}

export function tautanFolder(id: string) {
  return `https://drive.google.com/drive/folders/${id}`;
}
