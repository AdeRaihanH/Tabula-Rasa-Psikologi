-- Katalog disederhanakan menjadi 2 kategori: TES_ASESMEN & PERUSAHAAN
-- plus kolom integrasi Google Drive.

-- 1. Hapus data demo agar enum lama tidak menghambat perubahan.
DELETE FROM "pendaftaran" WHERE "nomor" LIKE 'TR-DEMO-%';
DELETE FROM "layanan";

-- 2. Ganti tipe enum KategoriLayanan.
CREATE TYPE "KategoriLayanan_new" AS ENUM ('TES_ASESMEN', 'PERUSAHAAN');
ALTER TABLE "layanan"
  ALTER COLUMN "kategori" TYPE "KategoriLayanan_new"
  USING ("kategori"::text::"KategoriLayanan_new");
DROP TYPE "KategoriLayanan";
ALTER TYPE "KategoriLayanan_new" RENAME TO "KategoriLayanan";

-- 3. Kolom integrasi Google Drive.
ALTER TABLE "pengaturan_situs" ADD COLUMN "driveFolderId" TEXT;
ALTER TABLE "pendaftaran" ADD COLUMN "folderDriveUrl" TEXT;
ALTER TABLE "arsip_data" ADD COLUMN "folderDriveUrl" TEXT;
