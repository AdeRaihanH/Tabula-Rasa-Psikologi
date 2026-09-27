import "server-only";

import { google } from "googleapis";

import { authGoogle } from "@/lib/gdrive";

/**
 * Penulisan arsip pendaftaran ke Google Spreadsheet.
 *
 * Spreadsheet dibuat manual oleh admin (mode service account) atau otomatis
 * (mode OAuth). Karena nama sheet bisa berbeda-beda ("Sheet1", "Sheet 1", dsb.),
 * penulisan selalu mencari nama sheet yang tersedia lebih dahulu.
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

function drive() {
  return google.drive({ version: "v3", auth: authGoogle() });
}

function sheets() {
  return google.sheets({ version: "v4", auth: authGoogle() });
}

/**
 * Menentukan nama sheet tujuan:
 *  1. sheet bernama "Pendaftaran" bila ada,
 *  2. jika tidak, sheet pertama pada spreadsheet tersebut.
 */
async function judulSheetTujuan(spreadsheetId: string) {
  const meta = await sheets().spreadsheets.get({
    spreadsheetId,
    fields: "sheets.properties.title",
  });
  const judul = (meta.data.sheets ?? [])
    .map((s) => s.properties?.title)
    .filter((t): t is string => Boolean(t));

  if (judul.length === 0) throw new Error("Spreadsheet tidak memiliki sheet.");
  return judul.find((t) => t === JUDUL_SHEET) ?? judul[0];
}

/** Menulis baris judul bila baris pertama masih kosong. */
async function pastikanHeader(spreadsheetId: string, judul: string) {
  const isi = await sheets().spreadsheets.values.get({
    spreadsheetId,
    range: `'${judul}'!A1:B1`,
  });
  const ada = (isi.data.values?.[0] ?? []).some(
    (v) => typeof v === "string" && v.trim().length > 0,
  );
  if (ada) return;

  await sheets().spreadsheets.values.update({
    spreadsheetId,
    range: `'${judul}'!A1`,
    valueInputOption: "RAW",
    requestBody: { values: [[...KOLOM_PENDAFTARAN]] },
  });

  // Rapikan tampilan tabel begitu header dibuat.
  try {
    await rapikanSpreadsheet(spreadsheetId, judul);
  } catch {
    // Pemformatan opsional.
  }
}

/** Menambahkan satu baris pendaftaran ke spreadsheet. */
export async function tambahBaris(
  spreadsheetId: string,
  baris: Array<string | number | null>,
) {
  const judul = await judulSheetTujuan(spreadsheetId);
  await pastikanHeader(spreadsheetId, judul);

  await sheets().spreadsheets.values.append({
    spreadsheetId,
    range: `'${judul}'!A1`,
    valueInputOption: "USER_ENTERED",
    // OVERWRITE (bukan INSERT_ROWS) supaya baris baru TIDAK mewarisi format
    // baris header (teks putih), yang membuat tulisan tak terlihat.
    insertDataOption: "OVERWRITE",
    requestBody: {
      values: [baris.map((b) => (b === null || b === undefined ? "" : b))],
    },
  });

  // Rapikan ulang agar baris data yang baru ditambahkan mendapat warna teks
  // gelap + latar selang-seling yang benar.
  try {
    await rapikanSpreadsheet(spreadsheetId, judul);
  } catch {
    // Pemformatan opsional.
  }

  return judul;
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

  const judul = await judulSheetTujuan(id);
  await sheets().spreadsheets.values.update({
    spreadsheetId: id,
    range: `'${judul}'!A1`,
    valueInputOption: "RAW",
    requestBody: { values: [[...KOLOM_PENDAFTARAN]] },
  });

  try {
    await rapikanSpreadsheet(id, judul);
  } catch {
    // Pemformatan opsional.
  }

  return {
    id,
    tautan:
      dibuat.data.webViewLink ?? `https://docs.google.com/spreadsheets/d/${id}`,
  };
}

// ---------------------------------------------------------------------------
// Pemformatan tabel
// ---------------------------------------------------------------------------

/** Lebar kolom (piksel) untuk 14 kolom arsip. */
const LEBAR_KOLOM = [135, 145, 185, 205, 120, 110, 105, 165, 205, 185, 95, 135, 260, 235];

/** Kolom yang isinya ditengahkan (index 0-based). */
const KOLOM_TENGAH = [5, 6, 10, 11];

/** Kolom yang isinya di-wrap (index 0-based): Kebutuhan & Folder Drive. */
const KOLOM_WRAP = [12, 13];

/** Kolom yang diformat sebagai teks agar tidak diubah menjadi angka. */
const KOLOM_TEKS = [4];

const WARNA = {
  headerBg: "#945034",
  headerFg: "#FFFFFF",
  headerGaris: "#763F2A",
  banding1: "#FFFFFF",
  banding2: "#FBF7F1",
  teks: "#42231A",
};

function hexKeRgb(hex: string) {
  const h = hex.replace("#", "");
  return {
    red: parseInt(h.slice(0, 2), 16) / 255,
    green: parseInt(h.slice(2, 4), 16) / 255,
    blue: parseInt(h.slice(4, 6), 16) / 255,
  };
}

/** Mengambil sheetId numerik + daftar banding yang sudah ada. */
async function infoSheet(spreadsheetId: string, judul: string) {
  const meta = await sheets().spreadsheets.get({
    spreadsheetId,
    fields: "sheets(properties(sheetId,title),bandedRanges)",
  });

  const target = (meta.data.sheets ?? []).find(
    (s) => s.properties?.title === judul,
  );
  const sheetId = target?.properties?.sheetId;
  if (sheetId === undefined || sheetId === null) {
    throw new Error(`Sheet "${judul}" tidak ditemukan.`);
  }

  return { sheetId, banded: target?.bandedRanges ?? [] };
}

/**
 * Merapikan tampilan spreadsheet: baris judul dibekukan, header berwarna,
 * lebar kolom disesuaikan, teks panjang dibungkus, warna baris selang-seling,
 * dan filter otomatis dipasang pada baris judul.
 */
export async function rapikanSpreadsheet(spreadsheetId: string, judul?: string) {
  const target = judul ?? (await judulSheetTujuan(spreadsheetId));
  const { sheetId, banded } = await infoSheet(spreadsheetId, target);

  // Hapus banding lama lebih dahulu agar tidak menumpuk.
  if (banded.length > 0) {
    await sheets().spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: banded
          .filter((b) => b.bandedRangeId != null)
          .map((b) => ({ deleteBanding: { bandedRangeId: b.bandedRangeId! } })),
      },
    });
  }

  // Jumlah baris data saat ini (baris pertama = judul), untuk pewarnaan
  // selang-seling per baris.
  const isiKolomA = await sheets().spreadsheets.values.get({
    spreadsheetId,
    range: `'${target}'!A1:A`,
  });
  const jumlahBarisData = Math.max((isiKolomA.data.values ?? []).length - 1, 0);

  const jumlahKolom = LEBAR_KOLOM.length;

  const requests: Array<Record<string, unknown>> = [
    // Bekukan baris judul.
    {
      updateSheetProperties: {
        properties: { sheetId, gridProperties: { frozenRowCount: 1 } },
        fields: "gridProperties.frozenRowCount",
      },
    },
    // Tinggi baris judul.
    {
      updateDimensionProperties: {
        range: { sheetId, dimension: "ROWS", startIndex: 0, endIndex: 1 },
        properties: { pixelSize: 42 },
        fields: "pixelSize",
      },
    },
  ];

  // Lebar tiap kolom.
  LEBAR_KOLOM.forEach((pixelSize, i) => {
    requests.push({
      updateDimensionProperties: {
        range: {
          sheetId,
          dimension: "COLUMNS",
          startIndex: i,
          endIndex: i + 1,
        },
        properties: { pixelSize },
        fields: "pixelSize",
      },
    });
  });

  // Gaya header.
  requests.push({
    repeatCell: {
      range: {
        sheetId,
        startRowIndex: 0,
        endRowIndex: 1,
        startColumnIndex: 0,
        endColumnIndex: jumlahKolom,
      },
      cell: {
        userEnteredFormat: {
          backgroundColor: hexKeRgb(WARNA.headerBg),
          textFormat: {
            bold: true,
            fontSize: 10,
            foregroundColor: hexKeRgb(WARNA.headerFg),
          },
          horizontalAlignment: "CENTER",
          verticalAlignment: "MIDDLE",
          wrapStrategy: "WRAP",
        },
      },
      fields:
        "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment,wrapStrategy)",
    },
  });

  // Garis bawah header.
  requests.push({
    updateBorders: {
      range: {
        sheetId,
        startRowIndex: 0,
        endRowIndex: 1,
        startColumnIndex: 0,
        endColumnIndex: jumlahKolom,
      },
      bottom: {
        style: "SOLID_MEDIUM",
        color: hexKeRgb(WARNA.headerGaris),
      },
    },
  });

  // Kolom yang ditengahkan.
  for (const i of KOLOM_TENGAH) {
    requests.push({
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: 1,
          startColumnIndex: i,
          endColumnIndex: i + 1,
        },
        cell: {
          userEnteredFormat: {
            horizontalAlignment: "CENTER",
            verticalAlignment: "MIDDLE",
          },
        },
        fields: "userEnteredFormat(horizontalAlignment,verticalAlignment)",
      },
    });
  }

  // Kolom yang dibungkus teksnya.
  for (const i of KOLOM_WRAP) {
    requests.push({
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: 1,
          startColumnIndex: i,
          endColumnIndex: i + 1,
        },
        cell: {
          userEnteredFormat: {
            wrapStrategy: "WRAP",
            verticalAlignment: "TOP",
          },
        },
        fields: "userEnteredFormat(wrapStrategy,verticalAlignment)",
      },
    });
  }

  // Format teks untuk kolom yang tidak boleh diubah menjadi angka.
  for (const i of KOLOM_TEKS) {
    requests.push({
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: 1,
          startColumnIndex: i,
          endColumnIndex: i + 1,
        },
        cell: {
          userEnteredFormat: {
            numberFormat: { type: "TEXT" },
            horizontalAlignment: "CENTER",
          },
        },
        fields: "userEnteredFormat(numberFormat,horizontalAlignment)",
      },
    });
  }

  // Warna baris data: teks gelap + latar selang-seling (putih/krem).
  // Ditulis per baris agar baris yang sempat mewarisi format header (teks
  // putih) ikut dikoreksi menjadi terbaca.
  for (let i = 1; i <= jumlahBarisData; i++) {
    requests.push({
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: i,
          endRowIndex: i + 1,
          startColumnIndex: 0,
          endColumnIndex: jumlahKolom,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: hexKeRgb(
              i % 2 === 1 ? WARNA.banding1 : WARNA.banding2,
            ),
            textFormat: {
              bold: false,
              foregroundColor: hexKeRgb(WARNA.teks),
            },
          },
        },
        fields:
          "userEnteredFormat(backgroundColor,textFormat(bold,foregroundColor))",
      },
    });
  }

  // Filter otomatis pada baris judul.
  requests.push({
    setBasicFilter: {
      filter: {
        range: {
          sheetId,
          startRowIndex: 0,
          startColumnIndex: 0,
          endColumnIndex: jumlahKolom,
        },
      },
    },
  });

  await sheets().spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests },
  });

  return target;
}
