import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";

/**
 * Menyusun dokumen Word (.docx) laporan hasil & interpretasi (Zona 3).
 *
 * Dokumen ini dibuat otomatis oleh psikolog penanggung jawab saat laporan
 * difinalkan, lalu diunggah ke folder Google Drive milik psikolog tersebut.
 * Karena folder Drive-nya tidak dibagikan, hanya psikolog bersangkutan yang
 * dapat membukanya.
 */

export type DataDokumen = {
  nomor: string;
  namaKlien: string;
  tanggalLahir?: Date | null;
  jenisKelamin?: string | null;
  email?: string | null;
  telepon?: string | null;
  institusi?: string | null;
  alamat?: string | null;
  namaLayanan: string;
  namaPsikolog: string;
  gelarPsikolog?: string | null;
  namaBiro: string;
  difinalkanPada?: Date | null;
  ringkasan?: string | null;
  interpretasi?: string | null;
  kesimpulan?: string | null;
  rekomendasi?: string | null;
};

// Warna identitas biro (earth tone) untuk konsistensi dengan situs.
const WARNA_BRAND = "945034"; // terracotta
const WARNA_BRAND_TUA = "42231A";
const WARNA_LABEL = "F4ECE0"; // krem untuk latar kolom label

const GARIS = { style: BorderStyle.SINGLE, size: 4, color: "E3D7C8" };
const BATAS = { top: GARIS, bottom: GARIS, left: GARIS, right: GARIS };

/** Lokasi logo biro di `public/`. Dipakai juga sebagai fallback nama berkas. */
const PATH_LOGO = join(process.cwd(), "public", "logo-tabula-rasa 2.png");

function tanggal(d: Date | null | undefined) {
  if (!d) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(d);
}

function jenisKelamin(jk: string | null | undefined) {
  if (!jk) return "-";
  if (jk === "L") return "Laki-laki";
  if (jk === "P") return "Perempuan";
  return jk;
}

function sel(
  teks: string,
  opts: {
    tebal?: boolean;
    lebar?: number;
    latar?: string;
    warna?: string;
    rataTengah?: boolean;
    rataAtas?: boolean;
  } = {},
) {
  return new TableCell({
    borders: BATAS,
    width: opts.lebar
      ? { size: opts.lebar, type: WidthType.PERCENTAGE }
      : undefined,
    shading: opts.latar ? { fill: opts.latar } : undefined,
    verticalAlign: opts.rataAtas ? VerticalAlign.TOP : VerticalAlign.CENTER,
    children: [
      new Paragraph({
        alignment: opts.rataTengah ? AlignmentType.CENTER : AlignmentType.LEFT,
        spacing: { before: 40, after: 40 },
        children: [
          new TextRun({
            text: teks,
            bold: opts.tebal,
            size: 20,
            color: opts.warna,
          }),
        ],
      }),
    ],
  });
}

function judul(teks: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 100 },
    children: [
      new TextRun({
        text: teks,
        bold: true,
        size: 24,
        color: WARNA_BRAND_TUA,
      }),
    ],
  });
}

function paragraf(teks: string | null | undefined) {
  const isi = (teks ?? "").trim() || "—";
  return isi.split(/\n{2,}/).map(
    (blok) =>
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: blok.replace(/\n/g, " "), size: 22 })],
      }),
  );
}

/**
 * Membaca logo biro sebagai ImageRun untuk kop dokumen. Bila berkas logo
 * tidak ditemukan (mis. nama berubah), kembalikan null agar dokumen tetap
 * dibuat tanpa gambar — tidak menggagalkan pembuatan laporan.
 */
function logoRun(): ImageRun | null {
  try {
    const buf = readFileSync(PATH_LOGO);
    // Asli 389×512 px — ditampilkan setinggi 128 px (sekitar 97×128).
    return new ImageRun({
      data: buf,
      transformation: { width: 97, height: 128 },
      type: "png",
    });
  } catch {
    return null;
  }
}

export async function buildLaporanDocx(data: DataDokumen): Promise<Buffer> {
  const namaPsikolog = `${data.namaPsikolog}${
    data.gelarPsikolog ? `, ${data.gelarPsikolog}` : ""
  }`;

  // --- Kop dokumen: logo + nama biro + judul laporan -------------------
  const logo = logoRun();

  const kopAnak = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: data.namaBiro.toUpperCase(),
          bold: true,
          size: 32,
          color: WARNA_BRAND,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: "LAPORAN HASIL ASESMEN PSIKOLOGI",
          bold: true,
          size: 22,
          color: WARNA_BRAND_TUA,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [
        new TextRun({ text: `No. ${data.nomor}`, size: 20, color: "888888" }),
      ],
    }),
  ];

  let kop: Paragraph;
  if (logo) {
    kop = new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [logo],
    });
  } else {
    kop = new Paragraph({ spacing: { after: 120 }, children: [] });
  }

  // --- Identitas klien (data diri) --------------------------------------
  const identitas: [string, string][] = [
    ["Nama Klien", data.namaKlien],
    ["Tanggal Lahir", tanggal(data.tanggalLahir)],
    ["Jenis Kelamin", jenisKelamin(data.jenisKelamin)],
    ["Email", data.email || "-"],
    ["Telepon / WhatsApp", data.telepon || "-"],
    ["Institusi / Asal", data.institusi || "-"],
    ["Layanan", data.namaLayanan],
    ["Psikolog", namaPsikolog],
    ["Tanggal Pemeriksaan", tanggal(data.difinalkanPada)],
  ];

  // Identitas disusun dua pasang (label + nilai) per baris agar ringkas.
  const barisIdentitas: TableRow[] = [];
  for (let i = 0; i < identitas.length; i += 2) {
    const [label1, nilai1] = identitas[i];
    const [label2, nilai2] = identitas[i + 1] ?? ["", ""];
    barisIdentitas.push(
      new TableRow({
        children: [
          sel(label1, { tebal: true, lebar: 16, latar: WARNA_LABEL }),
          sel(nilai1, { lebar: 34 }),
          sel(label2, { tebal: true, lebar: 16, latar: WARNA_LABEL }),
          sel(nilai2, { lebar: 34 }),
        ],
      }),
    );
  }

  const tabelIdentitas = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: barisIdentitas,
  });

  const doc = new Document({
    creator: data.namaBiro,
    title: `Laporan Hasil — ${data.nomor} — ${data.namaKlien}`,
    description: "Laporan hasil asesmen psikologi (Zona 3, rahasia)",
    sections: [
      {
        properties: {},
        children: [
          kop,
          ...kopAnak,
          tabelIdentitas,

          judul("Ringkasan Hasil"),
          ...paragraf(data.ringkasan),

          judul("Interpretasi Psikologis"),
          ...paragraf(data.interpretasi),

          judul("Kesimpulan"),
          ...paragraf(data.kesimpulan),

          judul("Rekomendasi"),
          ...paragraf(data.rekomendasi),

          new Paragraph({ spacing: { before: 480 } }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: "Psikolog Penanggung Jawab", size: 22 })],
          }),
          new Paragraph({ spacing: { after: 720 } }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: namaPsikolog,
                bold: true,
                underline: {},
                size: 22,
              }),
            ],
          }),
          new Paragraph({ spacing: { before: 240 } }),
          new Paragraph({
            children: [
              new TextRun({
                text:
                  "Dokumen ini bersifat RAHASIA dan hanya ditujukan untuk kepentingan asesmen klien yang bersangkutan.",
                italics: true,
                size: 18,
                color: "888888",
              }),
            ],
          }),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc) as Promise<Buffer>;
}

/** Nama berkas dokumen laporan yang rapi dan aman untuk Drive. */
export function namaDokumenLaporan(nomor: string, namaKlien: string) {
  const bersih = namaKlien.replace(/[\\/:*?"<>|]/g, "").trim();
  return `${nomor} — ${bersih} — Laporan Hasil.docx`;
}
