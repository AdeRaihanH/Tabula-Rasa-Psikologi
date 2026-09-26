import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

const layanan = [
  // A. Tes & Asesmen
  {
    slug: "tes-iq",
    nama: "Tes IQ",
    kategori: "TES_ASESMEN" as const,
    ringkasan:
      "Tes inteligensi resmi dengan laporan dan sesi konsultasi hasil.",
    deskripsi:
      "Tes IQ dilakukan oleh psikolog berizin praktik menggunakan alat tes terstandar sesuai usia. Hasil disajikan dalam laporan resmi bertanda tangan, dilengkapi sesi konsultasi hasil agar dapat dipahami dan ditindaklanjuti.\n\nUmumnya diperlukan untuk pendaftaran sekolah, penjurusan, seleksi kerja, maupun pemetaan kemampuan individu.",
    durasiMenit: 180,
    metode: ["ONLINE", "OFFLINE"] as const,
    unggulan: true,
    urutan: 1,
  },
  {
    slug: "tes-minat-bakat",
    nama: "Tes Minat Bakat",
    kategori: "TES_ASESMEN" as const,
    ringkasan:
      "Memetakan minat, bakat, dan arah karier secara ilmiah.",
    deskripsi:
      "Asesmen minat dan bakat membantu mengenali kecenderungan seseorang sehingga pengambilan keputusan jurusan, studi lanjut, atau arah karier menjadi lebih terarah.\n\nCocok untuk siswa yang memilih jurusan, mahasiswa, maupun profesional yang sedang menata ulang karier. Disertai sesi konsultasi hasil.",
    durasiMenit: 150,
    metode: ["ONLINE", "OFFLINE"] as const,
    unggulan: true,
    urutan: 2,
  },
  {
    slug: "tes-kesiapan-sekolah",
    nama: "Tes Kesiapan Sekolah",
    kategori: "TES_ASESMEN" as const,
    ringkasan:
      "Menilai kesiapan anak memasuki jenjang sekolah dasar.",
    deskripsi:
      "Asesmen kesiapan sekolah menilai aspek kognitif, motorik, bahasa, sosial, dan kemandirian anak sebagai pertimbangan masuk jenjang sekolah dasar.\n\nDilakukan secara tatap muka dengan observasi langsung, dan hasilnya dibahas bersama orang tua.",
    durasiMenit: 120,
    metode: ["OFFLINE"] as const,
    unggulan: true,
    urutan: 3,
  },

  // B. Untuk Perusahaan (B2B)
  {
    slug: "pio",
    nama: "Psikologi Industri & Organisasi (PIO)",
    kategori: "PERUSAHAAN" as const,
    ringkasan:
      "Layanan asesmen dan pengembangan SDM untuk kebutuhan perusahaan.",
    deskripsi:
      "Layanan PIO mencakup asesmen rekrutmen dan promosi, wawancara berbasis perilaku (BEI), pemetaan potensi dan talenta, analisis jabatan, hingga penyusunan kamus kompetensi.\n\nRuang lingkup, jumlah peserta, dan metode pelaksanaan disusun bersama tim HRD dan dituangkan dalam proposal serta kesepakatan kerja sama.",
    durasiMenit: null,
    metode: ["ONLINE", "OFFLINE"] as const,
    unggulan: true,
    urutan: 4,
  },
];

const alatTes = [
  { kode: "IST", nama: "Intelligenz-Struktur-Test", kategori: "Inteligensi" },
  { kode: "CFIT", nama: "Culture Fair Intelligence Test", kategori: "Inteligensi" },
  { kode: "DISC", nama: "DISC Personality Profile", kategori: "Kepribadian" },
  { kode: "16PF", nama: "16 Personality Factors", kategori: "Kepribadian" },
  { kode: "PAPI", nama: "PAPI Kostick", kategori: "Sikap Kerja" },
  { kode: "EPPS", nama: "Edwards Personal Preference Schedule", kategori: "Kepribadian" },
  { kode: "RMIB", nama: "Rothwell Miller Interest Blank", kategori: "Minat" },
  { kode: "SSCT", nama: "Sack's Sentence Completion Test", kategori: "Proyektif" },
  { kode: "DAP", nama: "Draw A Person", kategori: "Proyektif" },
  { kode: "BAUM", nama: "Baum Tree Test", kategori: "Proyektif" },
  { kode: "BEI", nama: "Behavioral Event Interview", kategori: "Kompetensi" },
];

async function main() {
  const password = await bcrypt.hash("TabulaRasa123!", 10);

  await prisma.pengaturanSitus.upsert({
    where: { id: "utama" },
    update: {},
    create: {
      id: "utama",
      namaBiro: "Tabula Rasa",
      tagline: "Ruang untuk bertumbuh, lembar yang belum tertulis.",
      deskripsi:
        "Biro psikologi yang menyediakan layanan rekrutmen & seleksi, training & development, serta konseling bagi individu, sekolah, dan korporasi.",
      telepon: "0812-0000-0000",
      whatsapp: "6281200000000",
      email: "halo@tabularasa.id",
      alamat: "Jl. Contoh No. 1, Kota Anda",
      jamOperasional: "Senin–Sabtu, 08.00–20.00 WIB",
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@tabularasa.id" },
    update: {},
    create: {
      nama: "Administrator",
      email: "admin@tabularasa.id",
      passwordHash: password,
      role: "ADMIN",
      telepon: "0812-0000-0001",
    },
  });

  const asisten = await prisma.user.upsert({
    where: { email: "asisten@tabularasa.id" },
    update: {},
    create: {
      nama: "Rina Asisten",
      email: "asisten@tabularasa.id",
      passwordHash: password,
      role: "ASISTEN",
      telepon: "0812-0000-0002",
    },
  });

  const psikologData = [
    {
      email: "psikolog1@tabularasa.id",
      nama: "Anindya Prameswari, M.Psi., Psikolog",
      spesialisasi: "Psikolog Klinis",
      gelar: "M.Psi., Psikolog",
      sipp: "SIPP 20240101-2024-01-0001",
      str: "STR KT00002010100001",
      pengalaman: 12,
      bio: "Menangani kecemasan, depresi, trauma, dan krisis. Berpengalaman mendampingi remaja hingga dewasa.",
    },
    {
      email: "psikolog2@tabularasa.id",
      nama: "Bagas Nurwidodo, M.Psi., Psikolog",
      spesialisasi: "Psikolog Industri & Organisasi",
      gelar: "M.Psi., Psikolog",
      sipp: "SIPP 20240102-2024-01-0002",
      str: "STR KT00002010100002",
      pengalaman: 9,
      bio: "Fokus pada asesmen rekrutmen, pemetaan talenta, dan pengembangan organisasi.",
    },
    {
      email: "psikolog3@tabularasa.id",
      nama: "Citra Larasati, M.Psi., Psikolog",
      spesialisasi: "Psikolog Pendidikan",
      gelar: "M.Psi., Psikolog",
      sipp: "SIPP 20240103-2024-01-0003",
      str: "STR KT00002010100003",
      pengalaman: 7,
      bio: "Mendampingi anak dan remaja, kesiapan sekolah, serta konsultasi orang tua.",
    },
  ];

  for (const p of psikologData) {
    await prisma.user.upsert({
      where: { email: p.email },
      update: {},
      create: {
        nama: p.nama,
        email: p.email,
        passwordHash: password,
        role: "PSIKOLOG",
        profilPsikolog: {
          create: {
            gelar: p.gelar,
            spesialisasi: p.spesialisasi,
            sipp: p.sipp,
            str: p.str,
            bio: p.bio,
            pengalaman: p.pengalaman,
            publik: true,
          },
        },
      },
    });
  }

  for (const l of layanan) {
    await prisma.layanan.upsert({
      where: { slug: l.slug },
      update: {},
      create: {
        slug: l.slug,
        nama: l.nama,
        kategori: l.kategori,
        ringkasan: l.ringkasan,
        deskripsi: l.deskripsi,
        durasiMenit: l.durasiMenit,
        metode: [...l.metode],
        unggulan: l.unggulan ?? false,
        urutan: l.urutan,
      },
    });
  }

  for (const a of alatTes) {
    await prisma.alatTes.upsert({
      where: { kode: a.kode },
      update: {},
      create: a,
    });
  }

  console.log("Seed selesai.");
  console.log("Login demo (password sama: TabulaRasa123!):");
  console.log(`  Admin    : ${admin.email}`);
  console.log(`  Asisten  : ${asisten.email}`);
  for (const p of psikologData) console.log(`  Psikolog : ${p.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
