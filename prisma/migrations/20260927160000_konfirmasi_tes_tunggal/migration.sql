-- Konfirmasi pelaksanaan tes oleh asisten psikolog menjadi satu tindakan
-- tunggal (bukan per alat tes). Asisten cukup menekan "Konfirmasi" bila klien
-- sudah melaksanakan tes Tatap Muka di biro.
ALTER TABLE "pendaftaran"
  ADD COLUMN "konfirmasiTesPada" TIMESTAMP(3),
  ADD COLUMN "konfirmasiTesOlehId" TEXT;

ALTER TABLE "pendaftaran"
  ADD CONSTRAINT "pendaftaran_konfirmasiTesOlehId_fkey"
  FOREIGN KEY ("konfirmasiTesOlehId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: kasus yang sudah punya lembar tes dianggap sudah dikonfirmasi.
UPDATE "pendaftaran" p
   SET "konfirmasiTesPada" = COALESCE(p."updatedAt", NOW()),
       "konfirmasiTesOlehId" = lt."asistenId"
  FROM (
    SELECT DISTINCT ON ("pendaftaranId") "pendaftaranId", "asistenId"
      FROM "lembar_tes"
     ORDER BY "pendaftaranId", "dikerjakanPada" DESC NULLS LAST
  ) lt
 WHERE lt."pendaftaranId" = p."id"
   AND p."konfirmasiTesPada" IS NULL;
