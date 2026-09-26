-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'ASISTEN', 'PSIKOLOG', 'KLIEN');

-- CreateEnum
CREATE TYPE "KategoriLayanan" AS ENUM ('REKRUTMEN_SELEKSI', 'TRAINING_DEVELOPMENT', 'KESEJAHTERAAN_KONSELING', 'KONSULTASI_ORGANISASI', 'ASESMEN_INDIVIDU');

-- CreateEnum
CREATE TYPE "MetodeLayanan" AS ENUM ('ONLINE', 'OFFLINE');

-- CreateEnum
CREATE TYPE "StatusPendaftaran" AS ENUM ('BARU', 'SKRINING', 'MENUNGGU_PEMBAYARAN', 'TERVERIFIKASI', 'TERJADWAL', 'PELAKSANAAN', 'PENGOLAHAN_DATA', 'SELESAI', 'DIBATALKAN');

-- CreateEnum
CREATE TYPE "StatusPembayaran" AS ENUM ('MENUNGGU', 'TERVERIFIKASI', 'DITOLAK');

-- CreateEnum
CREATE TYPE "StatusSesi" AS ENUM ('TERJADWAL', 'BERLANGSUNG', 'SELESAI', 'DIBATALKAN');

-- CreateEnum
CREATE TYPE "StatusLembarTes" AS ENUM ('MENUNGGU', 'DIKERJAKAN', 'SKOR_DIISI', 'SELESAI');

-- CreateEnum
CREATE TYPE "StatusLaporan" AS ENUM ('DRAFT', 'FINAL');

-- CreateEnum
CREATE TYPE "KlasifikasiData" AS ENUM ('ZONA_1', 'ZONA_2', 'ZONA_3');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "telepon" TEXT,
    "fotoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profil_psikolog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gelar" TEXT,
    "spesialisasi" TEXT NOT NULL,
    "sipp" TEXT,
    "str" TEXT,
    "bio" TEXT,
    "pengalaman" INTEGER NOT NULL DEFAULT 0,
    "publik" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profil_psikolog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sesi_login" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userAgent" TEXT,
    "ip" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sesi_login_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "klien" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "nama" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telepon" TEXT NOT NULL,
    "tanggalLahir" TIMESTAMP(3),
    "jenisKelamin" TEXT,
    "alamat" TEXT,
    "pekerjaan" TEXT,
    "institusi" TEXT,
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "klien_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "layanan" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kategori" "KategoriLayanan" NOT NULL,
    "ringkasan" TEXT NOT NULL,
    "deskripsi" TEXT,
    "harga" DECIMAL(12,2),
    "satuanHarga" TEXT NOT NULL DEFAULT 'sesi',
    "durasiMenit" INTEGER,
    "metode" "MetodeLayanan"[] DEFAULT ARRAY['OFFLINE']::"MetodeLayanan"[],
    "unggulan" BOOLEAN NOT NULL DEFAULT false,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "layanan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pendaftaran" (
    "id" TEXT NOT NULL,
    "nomor" TEXT NOT NULL,
    "klienId" TEXT NOT NULL,
    "layananId" TEXT NOT NULL,
    "psikologId" TEXT,
    "metode" "MetodeLayanan" NOT NULL DEFAULT 'OFFLINE',
    "status" "StatusPendaftaran" NOT NULL DEFAULT 'BARU',
    "kebutuhan" TEXT,
    "sumber" TEXT,
    "institusi" TEXT,
    "informedConsent" BOOLEAN NOT NULL DEFAULT false,
    "catatanInternal" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pendaftaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pembayaran" (
    "id" TEXT NOT NULL,
    "pendaftaranId" TEXT NOT NULL,
    "jumlah" DECIMAL(12,2) NOT NULL,
    "metode" TEXT NOT NULL DEFAULT 'transfer',
    "buktiUrl" TEXT,
    "status" "StatusPembayaran" NOT NULL DEFAULT 'MENUNGGU',
    "catatan" TEXT,
    "diverifikasiOlehId" TEXT,
    "diverifikasiPada" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pembayaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jadwal_sesi" (
    "id" TEXT NOT NULL,
    "pendaftaranId" TEXT NOT NULL,
    "psikologId" TEXT NOT NULL,
    "mulai" TIMESTAMP(3) NOT NULL,
    "selesai" TIMESTAMP(3) NOT NULL,
    "metode" "MetodeLayanan" NOT NULL DEFAULT 'OFFLINE',
    "lokasi" TEXT,
    "tautan" TEXT,
    "status" "StatusSesi" NOT NULL DEFAULT 'TERJADWAL',
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jadwal_sesi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alat_tes" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kategori" TEXT NOT NULL,
    "deskripsi" TEXT,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alat_tes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lembar_tes" (
    "id" TEXT NOT NULL,
    "pendaftaranId" TEXT NOT NULL,
    "jadwalSesiId" TEXT,
    "alatTesId" TEXT NOT NULL,
    "asistenId" TEXT,
    "status" "StatusLembarTes" NOT NULL DEFAULT 'MENUNGGU',
    "catatan" TEXT,
    "dikerjakanPada" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lembar_tes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skor_mentah" (
    "id" TEXT NOT NULL,
    "lembarTesId" TEXT NOT NULL,
    "aspek" TEXT NOT NULL,
    "skor" DECIMAL(12,2) NOT NULL,
    "satuan" TEXT,
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skor_mentah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "laporan_hasil" (
    "id" TEXT NOT NULL,
    "pendaftaranId" TEXT NOT NULL,
    "psikologId" TEXT NOT NULL,
    "ringkasan" TEXT,
    "interpretasi" TEXT,
    "rekomendasi" TEXT,
    "kesimpulan" TEXT,
    "status" "StatusLaporan" NOT NULL DEFAULT 'DRAFT',
    "difinalkanPada" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "laporan_hasil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arsip_data" (
    "id" TEXT NOT NULL,
    "pendaftaranId" TEXT NOT NULL,
    "klasifikasi" "KlasifikasiData" NOT NULL DEFAULT 'ZONA_1',
    "lokasiBerkas" TEXT,
    "retensiSampai" TIMESTAMP(3),
    "diarsipkanPada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "catatan" TEXT,

    CONSTRAINT "arsip_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "aksi" TEXT NOT NULL,
    "entitas" TEXT NOT NULL,
    "entitasId" TEXT,
    "detail" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pengaturan_situs" (
    "id" TEXT NOT NULL DEFAULT 'utama',
    "namaBiro" TEXT NOT NULL DEFAULT 'Tabula Rasa',
    "tagline" TEXT,
    "deskripsi" TEXT,
    "telepon" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "alamat" TEXT,
    "jamOperasional" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pengaturan_situs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "profil_psikolog_userId_key" ON "profil_psikolog"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "sesi_login_token_key" ON "sesi_login"("token");

-- CreateIndex
CREATE INDEX "sesi_login_userId_idx" ON "sesi_login"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "klien_userId_key" ON "klien"("userId");

-- CreateIndex
CREATE INDEX "klien_email_idx" ON "klien"("email");

-- CreateIndex
CREATE UNIQUE INDEX "layanan_slug_key" ON "layanan"("slug");

-- CreateIndex
CREATE INDEX "layanan_kategori_idx" ON "layanan"("kategori");

-- CreateIndex
CREATE UNIQUE INDEX "pendaftaran_nomor_key" ON "pendaftaran"("nomor");

-- CreateIndex
CREATE INDEX "pendaftaran_status_idx" ON "pendaftaran"("status");

-- CreateIndex
CREATE INDEX "pendaftaran_psikologId_idx" ON "pendaftaran"("psikologId");

-- CreateIndex
CREATE INDEX "pembayaran_pendaftaranId_idx" ON "pembayaran"("pendaftaranId");

-- CreateIndex
CREATE INDEX "jadwal_sesi_psikologId_idx" ON "jadwal_sesi"("psikologId");

-- CreateIndex
CREATE INDEX "jadwal_sesi_mulai_idx" ON "jadwal_sesi"("mulai");

-- CreateIndex
CREATE UNIQUE INDEX "alat_tes_kode_key" ON "alat_tes"("kode");

-- CreateIndex
CREATE INDEX "lembar_tes_pendaftaranId_idx" ON "lembar_tes"("pendaftaranId");

-- CreateIndex
CREATE INDEX "skor_mentah_lembarTesId_idx" ON "skor_mentah"("lembarTesId");

-- CreateIndex
CREATE UNIQUE INDEX "laporan_hasil_pendaftaranId_key" ON "laporan_hasil"("pendaftaranId");

-- CreateIndex
CREATE INDEX "laporan_hasil_psikologId_idx" ON "laporan_hasil"("psikologId");

-- CreateIndex
CREATE UNIQUE INDEX "arsip_data_pendaftaranId_key" ON "arsip_data"("pendaftaranId");

-- CreateIndex
CREATE INDEX "audit_log_userId_idx" ON "audit_log"("userId");

-- CreateIndex
CREATE INDEX "audit_log_createdAt_idx" ON "audit_log"("createdAt");

-- AddForeignKey
ALTER TABLE "profil_psikolog" ADD CONSTRAINT "profil_psikolog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesi_login" ADD CONSTRAINT "sesi_login_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "klien" ADD CONSTRAINT "klien_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pendaftaran" ADD CONSTRAINT "pendaftaran_klienId_fkey" FOREIGN KEY ("klienId") REFERENCES "klien"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pendaftaran" ADD CONSTRAINT "pendaftaran_layananId_fkey" FOREIGN KEY ("layananId") REFERENCES "layanan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pendaftaran" ADD CONSTRAINT "pendaftaran_psikologId_fkey" FOREIGN KEY ("psikologId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pembayaran" ADD CONSTRAINT "pembayaran_pendaftaranId_fkey" FOREIGN KEY ("pendaftaranId") REFERENCES "pendaftaran"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pembayaran" ADD CONSTRAINT "pembayaran_diverifikasiOlehId_fkey" FOREIGN KEY ("diverifikasiOlehId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jadwal_sesi" ADD CONSTRAINT "jadwal_sesi_pendaftaranId_fkey" FOREIGN KEY ("pendaftaranId") REFERENCES "pendaftaran"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jadwal_sesi" ADD CONSTRAINT "jadwal_sesi_psikologId_fkey" FOREIGN KEY ("psikologId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lembar_tes" ADD CONSTRAINT "lembar_tes_pendaftaranId_fkey" FOREIGN KEY ("pendaftaranId") REFERENCES "pendaftaran"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lembar_tes" ADD CONSTRAINT "lembar_tes_jadwalSesiId_fkey" FOREIGN KEY ("jadwalSesiId") REFERENCES "jadwal_sesi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lembar_tes" ADD CONSTRAINT "lembar_tes_alatTesId_fkey" FOREIGN KEY ("alatTesId") REFERENCES "alat_tes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lembar_tes" ADD CONSTRAINT "lembar_tes_asistenId_fkey" FOREIGN KEY ("asistenId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skor_mentah" ADD CONSTRAINT "skor_mentah_lembarTesId_fkey" FOREIGN KEY ("lembarTesId") REFERENCES "lembar_tes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laporan_hasil" ADD CONSTRAINT "laporan_hasil_pendaftaranId_fkey" FOREIGN KEY ("pendaftaranId") REFERENCES "pendaftaran"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laporan_hasil" ADD CONSTRAINT "laporan_hasil_psikologId_fkey" FOREIGN KEY ("psikologId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arsip_data" ADD CONSTRAINT "arsip_data_pendaftaranId_fkey" FOREIGN KEY ("pendaftaranId") REFERENCES "pendaftaran"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
