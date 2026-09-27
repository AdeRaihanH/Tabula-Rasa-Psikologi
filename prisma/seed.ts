import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

// Folder Google Drive (induk arsip digital).
const FOLDER_UTAMA = "1cH7UOUcErtOdcgvI0h0in8gyB1Sy0xEe";
const FOLDER_KLIEN = "16F1c4BWs8WDDuy4PQio76gOG1Hf4zUNc";
const FOLDER_ADMIN = "1cH7UOUcErtOdcgvI0h0in8gyB1Sy0xEe";

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
    hargaOffline: 545000,
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
    hargaOffline: 545000,
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
    hargaOffline: 545000,
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
    update: {
      driveFolderId: FOLDER_UTAMA,
      driveClientFolderId: FOLDER_KLIEN,
      driveAdminFolderId: FOLDER_ADMIN,
    },
    create: {
      id: "utama",
      namaBiro: "Tabula Rasa",
      tagline: "Ruang untuk bertumbuh, lembar yang belum tertulis.",
      deskripsi:
        "Biro psikologi yang menyediakan tes dan asesmen psikologi untuk individu, sekolah, serta layanan Psikologi Industri & Organisasi untuk perusahaan.",
      telepon: "082229145081",
      whatsapp: "6282229145081",
      email: "halo@tabularasa.id",
      alamat:
        "Jl. Kapas, Semaki, Kec. Umbulharjo, Kota Yogyakarta, Daerah Istimewa Yogyakarta 55166",
      jamOperasional: "Senin–Sabtu, 08.00–20.00 WIB",
      driveFolderId: FOLDER_UTAMA,
      driveClientFolderId: FOLDER_KLIEN,
      driveAdminFolderId: FOLDER_ADMIN,
      bankNama: "Bank Contoh",
      bankNomor: "1234567890",
      bankAtasNama: "Tabula Rasa",
      instruksiPembayaran:
        "Transfer sesuai nominal, lalu kirim bukti transfer melalui WhatsApp atau email dengan menyebutkan nomor pendaftaran Anda.",
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@tabularasa.id" },
    update: {},
    create: {
      nama: "Are",
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
      nama: "Safira",
      email: "asisten@tabularasa.id",
      passwordHash: password,
      role: "ASISTEN",
      telepon: "0812-0000-0002",
    },
  });

  const psikologData = [
    {
      email: "anugrah@tabularasa.id",
      nama: "Anugrah Mujaddidah Kadim",
      spesialisasi: "Psikolog Klinis",
      gelar: "M.Psi., Psikolog",
      fotoUrl: "/psikolog/anugrah-mujaddidah-kadim.jpeg",
      folderDrive: "11IYflposUKrD6wyoWMaTKebk_oz7jTt6",
      pengalaman: 8,
      bio: "Mendampingi klien dalam asesmen psikologis dan konseling individu dengan pendekatan yang hangat dan terstruktur.",
    },
    {
      email: "nadia@tabularasa.id",
      nama: "Nadia Rafa Aziza",
      spesialisasi: "Psikolog Klinis",
      gelar: "M.Psi., Psikolog",
      fotoUrl: "/psikolog/nadia-rafa-aziza.jpeg",
      folderDrive: "15V5N-NjOe6lbouNkMCqDHl30zxccXrzp",
      pengalaman: 6,
      bio: "Berfokus pada asesmen anak dan remaja serta pendampingan orang tua dalam proses tumbuh kembang.",
    },
    {
      email: "aprilia@tabularasa.id",
      nama: "Aprilia Anggorowati",
      spesialisasi: "Psikolog Pendidikan",
      gelar: "M.Psi., Psikolog",
      fotoUrl: "/psikolog/aprilia-anggorowati.jpeg",
      folderDrive: "1sdnX6Oc98OhOB1mrevt96p1hAwWH1TkG",
      pengalaman: 7,
      bio: "Menangani asesmen kesiapan sekolah, minat bakat, serta konsultasi pendidikan bersama sekolah dan keluarga.",
    },
    {
      email: "anissa@tabularasa.id",
      nama: "Anissa Salsabila",
      spesialisasi: "Psikolog Klinis",
      gelar: "M.Psi., Psikolog",
      fotoUrl: "/psikolog/anissa-salsabila.jpeg",
      folderDrive: "1trCNA2wcUwevp_daQoqkSNzIv2yknkt5",
      pengalaman: 5,
      bio: "Mendampingi dewasa muda dalam mengelola kecemasan, tekanan akademik, dan perencanaan karier.",
    },
    {
      email: "amanda@tabularasa.id",
      nama: "Amanda Fadhia Feriqhalisyah",
      spesialisasi: "Psikolog Industri & Organisasi",
      gelar: "M.Psi., Psikolog",
      fotoUrl: "/psikolog/amanda-fadhia-feriqhalisyah.jpeg",
      folderDrive: "16S35pkY4WS0TGn7nsVXRMyKkP7dklWRf",
      pengalaman: 6,
      bio: "Menangani asesmen rekrutmen, pemetaan potensi, dan pengembangan SDM untuk kebutuhan perusahaan.",
    },
  ];

  // Bersihkan psikolog placeholder lama (beserta kasus ujinya) agar katalog
  // psikolog persis sesuai data klien.
  const emailLama = [
    "psikolog1@tabularasa.id",
    "psikolog2@tabularasa.id",
    "psikolog3@tabularasa.id",
  ];
  await prisma.pendaftaran.deleteMany({
    where: { psikolog: { email: { in: emailLama } } },
  });
  await prisma.user.deleteMany({ where: { email: { in: emailLama } } });

  for (const p of psikologData) {
    const folderUrl = `https://drive.google.com/drive/folders/${p.folderDrive}`;
    const profil = {
      gelar: p.gelar,
      spesialisasi: p.spesialisasi,
      fotoUrl: p.fotoUrl,
      driveFolderId: p.folderDrive,
      driveFolderUrl: folderUrl,
      bio: p.bio,
      pengalaman: p.pengalaman,
      publik: true,
    };

    await prisma.user.upsert({
      where: { email: p.email },
      update: {
        nama: p.nama,
        profilPsikolog: { upsert: { create: profil, update: profil } },
      },
      create: {
        nama: p.nama,
        email: p.email,
        passwordHash: password,
        role: "PSIKOLOG",
        profilPsikolog: { create: profil },
      },
    });
  }

  for (const l of layanan) {
    const harga = { hargaOffline: l.hargaOffline ?? null };
    await prisma.layanan.upsert({
      where: { slug: l.slug },
      update: harga,
      create: {
        slug: l.slug,
        nama: l.nama,
        kategori: l.kategori,
        ringkasan: l.ringkasan,
        deskripsi: l.deskripsi,
        durasiMenit: l.durasiMenit,
        unggulan: l.unggulan ?? false,
        urutan: l.urutan,
        ...harga,
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

  // ---------- Checklist alat tes per layanan ----------
  // Alat tes apa saja yang harus dikerjakan klien untuk tiap layanan.
  // Asisten psikolog mencentangnya sebagai konfirmasi pelaksanaan di biro.
  const checklist: { slug: string; kode: string; wajib: boolean }[] = [
    { slug: "tes-iq", kode: "IST", wajib: true },
    { slug: "tes-iq", kode: "CFIT", wajib: false },
    { slug: "tes-minat-bakat", kode: "RMIB", wajib: true },
    { slug: "tes-minat-bakat", kode: "EPPS", wajib: true },
    { slug: "tes-kesiapan-sekolah", kode: "DAP", wajib: true },
    { slug: "tes-kesiapan-sekolah", kode: "BAUM", wajib: true },
    { slug: "tes-kesiapan-sekolah", kode: "SSCT", wajib: false },
    { slug: "pio", kode: "DISC", wajib: true },
    { slug: "pio", kode: "PAPI", wajib: true },
    { slug: "pio", kode: "BEI", wajib: true },
  ];

  const urutanPerLayanan = new Map<string, number>();
  for (const c of checklist) {
    const lay = await prisma.layanan.findUnique({ where: { slug: c.slug } });
    const alat = await prisma.alatTes.findUnique({ where: { kode: c.kode } });
    if (!lay || !alat) continue;
    const urutan = urutanPerLayanan.get(c.slug) ?? 0;
    urutanPerLayanan.set(c.slug, urutan + 1);
    await prisma.layananAlatTes.upsert({
      where: { layananId_alatTesId: { layananId: lay.id, alatTesId: alat.id } },
      update: { urutan, wajib: c.wajib },
      create: {
        layananId: lay.id,
        alatTesId: alat.id,
        urutan,
        wajib: c.wajib,
      },
    });
  }

  // Nomor kontak terbaru dari klien.
  await prisma.pengaturanSitus.update({
    where: { id: "utama" },
    data: { telepon: "082229145081", whatsapp: "6282229145081" },
  });

  console.log("Seed selesai.");
  console.log("Login demo (password sama: TabulaRasa123!):");
  console.log(`  Admin    : ${admin.email}`);
  console.log(`  Asisten  : ${asisten.email}`);
  for (const p of psikologData) console.log(`  Psikolog : ${p.email}`);}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
