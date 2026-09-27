-- Skoring dihapus dari sistem. Asisten psikolog hanya mengonfirmasi bahwa
-- klien sudah mengerjakan alat tes; psikolog langsung menyusun interpretasi.
--
-- Dibuang:
--   1. tabel `skor_mentah` (skor mentah + hasil konversi),
--   2. tabel `konversi_skor` (tabel rumus konversi per layanan),
--   3. kolom `lembar_tes.tautan` & `lembar_tes.instruksi` (sisa mode daring).

DROP TABLE IF EXISTS "skor_mentah";
DROP TABLE IF EXISTS "konversi_skor";

ALTER TABLE "lembar_tes" DROP COLUMN IF EXISTS "tautan";
ALTER TABLE "lembar_tes" DROP COLUMN IF EXISTS "instruksi";
