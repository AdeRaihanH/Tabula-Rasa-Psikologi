-- Tes dilaksanakan TATAP MUKA di biro (daring dihapus), plus checklist alat tes
-- dan tabel konversi skor per layanan.

-- 1. Semua metode daring yang sudah ada diubah menjadi tatap muka.
UPDATE "layanan" SET "metode" = ARRAY['OFFLINE']::"MetodeLayanan"[]
  WHERE 'ONLINE'::"MetodeLayanan" = ANY("metode");
UPDATE "pendaftaran" SET "metode" = 'OFFLINE' WHERE "metode" = 'ONLINE';
UPDATE "jadwal_sesi" SET "metode" = 'OFFLINE' WHERE "metode" = 'ONLINE';

-- 2. Enum MetodeLayanan hanya menyisakan OFFLINE.
CREATE TYPE "MetodeLayanan_new" AS ENUM ('OFFLINE');
ALTER TABLE "layanan"
  ALTER COLUMN "metode" DROP DEFAULT;
ALTER TABLE "layanan"
  ALTER COLUMN "metode" TYPE "MetodeLayanan_new"[]
  USING (ARRAY['OFFLINE']::text[]::"MetodeLayanan_new"[]);
ALTER TABLE "layanan"
  ALTER COLUMN "metode" SET DEFAULT ARRAY['OFFLINE']::"MetodeLayanan_new"[];
ALTER TABLE "pendaftaran"
  ALTER COLUMN "metode" DROP DEFAULT;
ALTER TABLE "pendaftaran"
  ALTER COLUMN "metode" TYPE "MetodeLayanan_new"
  USING ("metode"::text::"MetodeLayanan_new");
ALTER TABLE "pendaftaran"
  ALTER COLUMN "metode" SET DEFAULT 'OFFLINE'::"MetodeLayanan_new";
ALTER TABLE "jadwal_sesi"
  ALTER COLUMN "metode" DROP DEFAULT;
ALTER TABLE "jadwal_sesi"
  ALTER COLUMN "metode" TYPE "MetodeLayanan_new"
  USING ("metode"::text::"MetodeLayanan_new");
ALTER TABLE "jadwal_sesi"
  ALTER COLUMN "metode" SET DEFAULT 'OFFLINE'::"MetodeLayanan_new";
DROP TYPE "MetodeLayanan";
ALTER TYPE "MetodeLayanan_new" RENAME TO "MetodeLayanan";

-- 3. Bank soal daring dibuang (tes dilakukan langsung oleh asisten di biro).
DROP TABLE IF EXISTS "jawaban_tes";
DROP TABLE IF EXISTS "soal_tes";
DROP TYPE IF EXISTS "JenisSoal";

-- 4. Checklist alat tes per layanan.
CREATE TABLE "layanan_alat_tes" (
    "id" TEXT NOT NULL,
    "layananId" TEXT NOT NULL,
    "alatTesId" TEXT NOT NULL,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "wajib" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "layanan_alat_tes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "layanan_alat_tes_layananId_alatTesId_key"
  ON "layanan_alat_tes"("layananId", "alatTesId");
CREATE INDEX "layanan_alat_tes_layananId_idx" ON "layanan_alat_tes"("layananId");
ALTER TABLE "layanan_alat_tes" ADD CONSTRAINT "layanan_alat_tes_layananId_fkey"
  FOREIGN KEY ("layananId") REFERENCES "layanan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "layanan_alat_tes" ADD CONSTRAINT "layanan_alat_tes_alatTesId_fkey"
  FOREIGN KEY ("alatTesId") REFERENCES "alat_tes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 5. Tabel konversi skor mentah → hasil olahan (rumus berbeda per layanan).
CREATE TABLE "konversi_skor" (
    "id" TEXT NOT NULL,
    "layananId" TEXT NOT NULL,
    "aspek" TEXT NOT NULL,
    "minRaw" DECIMAL(8,2) NOT NULL,
    "maxRaw" DECIMAL(8,2) NOT NULL,
    "nilai" DECIMAL(8,2) NOT NULL,
    "kategori" TEXT,
    "urutan" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "konversi_skor_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "konversi_skor_layananId_aspek_idx" ON "konversi_skor"("layananId", "aspek");
ALTER TABLE "konversi_skor" ADD CONSTRAINT "konversi_skor_layananId_fkey"
  FOREIGN KEY ("layananId") REFERENCES "layanan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 6. Hasil konversi pada skor mentah.
ALTER TABLE "skor_mentah"
  ADD COLUMN "nilai" DECIMAL(10,2),
  ADD COLUMN "kategori" TEXT;
