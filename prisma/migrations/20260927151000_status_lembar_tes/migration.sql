-- Status lembar tes tidak lagi mengenal tahap "skor diisi" karena skoring
-- dihapus dari sistem. Lembar tes hanya: menunggu → dikerjakan → selesai.

-- Data lama SKOR_DIISI dipetakan ke SELESAI.
ALTER TABLE "lembar_tes" ALTER COLUMN "status" DROP DEFAULT;

CREATE TYPE "StatusLembarTes_new" AS ENUM ('MENUNGGU', 'DIKERJAKAN', 'SELESAI');

ALTER TABLE "lembar_tes"
  ALTER COLUMN "status" TYPE "StatusLembarTes_new"
  USING (
    CASE WHEN "status"::text = 'SKOR_DIISI' THEN 'SELESAI' ELSE "status"::text END
  )::"StatusLembarTes_new";

ALTER TABLE "lembar_tes" ALTER COLUMN "status" SET DEFAULT 'MENUNGGU';

DROP TYPE "StatusLembarTes";
ALTER TYPE "StatusLembarTes_new" RENAME TO "StatusLembarTes";
