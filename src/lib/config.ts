export const siteConfig = {
  nama: "Tabula Rasa",
  namaPanjang: "Tabula Rasa — Biro Psikologi & Konseling",
  tagline: "Ruang untuk bertumbuh, lembar yang belum tertulis.",
  deskripsi:
    "Biro psikologi yang menyediakan tes dan asesmen psikologi untuk individu, sekolah, serta layanan Psikologi Industri & Organisasi (PIO) untuk perusahaan.",
  telepon: "0812-0000-0000",
  whatsapp: "6281200000000",
  email: "halo@tabularasa.id",
  alamat: "Jl. Contoh No. 1, Kota Anda",
  jamOperasional: "Senin–Sabtu, 08.00–20.00 WIB",
  tahunBerdiri: 2015,
} as const;

export const navPublik = [
  { href: "/", label: "Beranda" },
  { href: "/layanan", label: "Layanan" },
  { href: "/biaya", label: "Biaya" },
  { href: "/tim", label: "Tim Psikolog" },
  { href: "/alur", label: "Alur Layanan" },
  { href: "/kerahasiaan", label: "Kerahasiaan" },
  { href: "/kontak", label: "Kontak" },
] as const;

export const kategoriUrut = ["TES_ASESMEN", "PERUSAHAAN"] as const;

export const labelKategori: Record<string, string> = {
  TES_ASESMEN: "Tes & Asesmen",
  PERUSAHAAN: "Untuk Perusahaan (B2B)",
};

export const ringkasKategori: Record<string, string> = {
  TES_ASESMEN:
    "Tes psikologi resmi untuk individu, anak, dan sekolah — dengan laporan bertanda tangan psikolog berizin praktik.",
  PERUSAHAAN:
    "Layanan Psikologi Industri & Organisasi untuk kebutuhan rekrutmen, pemetaan potensi, dan pengembangan SDM perusahaan.",
};

export const anchorKategori: Record<string, string> = {
  TES_ASESMEN: "tes-asesmen",
  PERUSAHAAN: "perusahaan",
};

export const labelStatusPendaftaran: Record<string, string> = {
  BARU: "Pendaftaran Baru",
  SKRINING: "Skrining Kebutuhan",
  MENUNGGU_PEMBAYARAN: "Menunggu Pembayaran",
  TERVERIFIKASI: "Terverifikasi",
  TERJADWAL: "Terjadwal",
  PELAKSANAAN: "Pelaksanaan",
  PENGOLAHAN_DATA: "Pengolahan Data",
  SELESAI: "Selesai",
  DIBATALKAN: "Dibatalkan",
};

export const labelRole: Record<string, string> = {
  ADMIN: "Administrator",
  ASISTEN: "Asisten Psikolog",
  PSIKOLOG: "Psikolog",
  KLIEN: "Klien",
};

export const alurLayanan = [
  {
    nomor: "01",
    judul: "Pendaftaran & Registrasi",
    isi: "Klien atau perusahaan mengisi formulir pendaftaran daring. Data masuk ke Zona 1 (administratif).",
  },
  {
    nomor: "02",
    judul: "Skrining Kebutuhan",
    isi: "Admin memverifikasi kebutuhan, termasuk proposal pengajuan dari perusahaan atau institusi.",
  },
  {
    nomor: "03",
    judul: "Persetujuan & Pembayaran",
    isi: "Penandatanganan informed consent dan kesepakatan (MOU), lalu pembayaran diverifikasi admin.",
  },
  {
    nomor: "04",
    judul: "Penjadwalan",
    isi: "Sesi dijadwalkan bersama psikolog yang sesuai dengan kebutuhan klien.",
  },
  {
    nomor: "05",
    judul: "Pelaksanaan",
    isi: "Asesmen berlangsung. Asisten psikolog mengelola lembar tes dan skor mentah (Zona 2).",
  },
  {
    nomor: "06",
    judul: "Pengolahan Data",
    isi: "Skor mentah diolah, lalu psikolog menyusun interpretasi pada Zona 3 yang terisolasi.",
  },
  {
    nomor: "07",
    judul: "Penyerahan Hasil & Feedback",
    isi: "Laporan final diserahkan kepada klien melalui tautan arsip digital, disertai sesi umpan balik.",
  },
  {
    nomor: "08",
    judul: "Evaluasi & Pengarsipan",
    isi: "Evaluasi layanan, lalu data diarsipkan dengan klasifikasi kerahasiaan dan masa retensi.",
  },
] as const;

/** Keunggulan yang ditampilkan di beranda. */
export const keunggulan = [
  {
    ikon: "lisensi",
    judul: "Psikolog berizin praktik",
    isi: "Seluruh laporan ditandatangani psikolog dengan SIPP dan STR yang dapat Anda verifikasi.",
  },
  {
    ikon: "digital",
    judul: "Hasil arsip digital",
    isi: "Hasil pendaftaran dan berkas tersimpan rapi pada arsip digital, mudah diakses kembali bila diperlukan.",
  },
  {
    ikon: "privasi",
    judul: "Kerahasiaan berlapis",
    isi: "Data dipisah menjadi tiga zona akses. Tidak ada satu peran pun yang melihat seluruh isi data.",
  },
  {
    ikon: "cepat",
    judul: "Proses jelas dan cepat",
    isi: "Dari pendaftaran hingga penyerahan hasil, setiap tahap punya penanggung jawab yang jelas.",
  },
] as const;

/** Testimoni klien untuk beranda. */
export const testimoni = [
  {
    kutipan:
      "Prosesnya jelas dari awal. Admin menjelaskan setiap tahap, dan hasil tesnya disampaikan dengan penjelasan yang mudah dipahami.",
    nama: "Ibu Rahma",
    peran: "Orang tua peserta didik",
  },
  {
    kutipan:
      "Kami menggunakan layanan PIO untuk asesmen rekrutmen. Laporannya objektif dan membantu keputusan tim HRD kami.",
    nama: "Bapak Andri",
    peran: "Manajer HRD",
  },
  {
    kutipan:
      "Anak saya jadi lebih tenang karena tesnya dilakukan dengan pendekatan yang ramah. Hasilnya juga lengkap.",
    nama: "Ibu Sari",
    peran: "Klien asesmen anak",
  },
] as const;

/** Pertanyaan umum singkat untuk beranda. */
export const faqSingkat = [
  {
    q: "Bagaimana cara mendaftar?",
    a: "Isi formulir pendaftaran daring. Setelah terkirim, Anda menerima nomor pendaftaran untuk memantau status dan akan dihubungi admin dalam 1×24 jam kerja.",
  },
  {
    q: "Apakah hasil tes bisa diakses kembali?",
    a: "Bisa. Hasil pendaftaran dan berkas Anda tersimpan pada arsip digital biro. Tautan arsip dapat diminta kembali kepada admin.",
  },
  {
    q: "Apakah psikolog lain bisa melihat data saya?",
    a: "Tidak. Setiap psikolog hanya dapat membuka kasus yang ditugaskan kepadanya, dan daftar pasien satu psikolog tidak terlihat oleh psikolog lain.",
  },
  {
    q: "Apakah melayani perusahaan?",
    a: "Ya. Kami melayani kebutuhan Psikologi Industri & Organisasi seperti asesmen rekrutmen, pemetaan potensi, dan pengembangan SDM. Rincian disusun dalam proposal.",
  },
] as const;
