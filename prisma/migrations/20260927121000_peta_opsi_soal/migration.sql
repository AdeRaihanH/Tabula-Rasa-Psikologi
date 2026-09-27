-- Pemetaan opsi → aspek untuk soal inventori (minat bakat / kepribadian),
-- yang tidak punya jawaban benar.
ALTER TABLE "soal_tes" ADD COLUMN "petaOpsi" JSONB;
