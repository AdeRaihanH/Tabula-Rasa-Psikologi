import "server-only";

import { Readable } from "node:stream";

import { google } from "googleapis";

/**
 * Integrasi Google Workspace (Drive & Sheets) memakai service account.
 *
 * Variabel lingkungan yang dibutuhkan:
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL  — email service account (...@...iam.gserviceaccount.com)
 *   GOOGLE_PRIVATE_KEY            — private key (boleh memakai \n literal)
 *   GOOGLE_DRIVE_FOLDER_ID        — ID folder Drive utama (opsional bila folder
 *                                   diatur per psikolog / di pengaturan situs)
 *
 * Bila variabel belum diisi, fitur Google otomatis dinonaktifkan dan aplikasi
 * tetap berjalan normal.
 */

export type HasilDrive = { id: string; tautan: string };

function kredensial() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!email || !key) return null;
  return { email, key };
}

export function driveAktif() {
  return Boolean(kredensial());
}

export function folderIndukId() {
  return process.env.GOOGLE_DRIVE_FOLDER_ID ?? null;
}

export function authGoogle() {
  const kred = kredensial();
  if (!kred) throw new Error("Kredensial Google belum diisi.");
  return new google.auth.JWT({
    email: kred.email,
    key: kred.key,
    scopes: [
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/spreadsheets",
    ],
  });
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

export function tautanFolder(id: string) {
  return `https://drive.google.com/drive/folders/${id}`;
}
