-- Bank soal per layanan + jawaban klien.
-- Soal pilihan ganda dinilai otomatis dari `kunci`; soal isian menunggu
-- penilaian asisten psikolog. Nilai/skor tetap di Zona 2.

-- CreateEnum
CREATE TYPE "JenisSoal" AS ENUM ('PILIHAN_GANDA', 'ISIAN');

-- CreateTable
CREATE TABLE "soal_tes" (
    "id" TEXT NOT NULL,
    "layananId" TEXT NOT NULL,
    "nomor" INTEGER NOT NULL,
    "pertanyaan" TEXT NOT NULL,
    "jenis" "JenisSoal" NOT NULL DEFAULT 'PILIHAN_GANDA',
    "opsi" JSONB,
    "kunci" TEXT,
    "aspek" TEXT NOT NULL,
    "bobot" DECIMAL(6,2) NOT NULL DEFAULT 1,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "soal_tes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jawaban_tes" (
    "id" TEXT NOT NULL,
    "lembarTesId" TEXT NOT NULL,
    "soalId" TEXT NOT NULL,
    "jawaban" TEXT,
    "benar" BOOLEAN,
    "skor" DECIMAL(6,2),
    "dinilaiOlehId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jawaban_tes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "soal_tes_layananId_idx" ON "soal_tes"("layananId");

-- CreateIndex
CREATE INDEX "jawaban_tes_lembarTesId_idx" ON "jawaban_tes"("lembarTesId");

-- CreateIndex
CREATE UNIQUE INDEX "jawaban_tes_lembarTesId_soalId_key" ON "jawaban_tes"("lembarTesId", "soalId");

-- AddForeignKey
ALTER TABLE "soal_tes" ADD CONSTRAINT "soal_tes_layananId_fkey" FOREIGN KEY ("layananId") REFERENCES "layanan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jawaban_tes" ADD CONSTRAINT "jawaban_tes_lembarTesId_fkey" FOREIGN KEY ("lembarTesId") REFERENCES "lembar_tes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jawaban_tes" ADD CONSTRAINT "jawaban_tes_soalId_fkey" FOREIGN KEY ("soalId") REFERENCES "soal_tes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jawaban_tes" ADD CONSTRAINT "jawaban_tes_dinilaiOlehId_fkey" FOREIGN KEY ("dinilaiOlehId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
