-- Master alat tes dan checklist per layanan tidak lagi dipakai.
-- Asisten hanya mengonfirmasi pelaksanaan tes (satu tindakan), tanpa daftar
-- alat tes. Tabel berikut dihapus beserta relasinya.

DROP TABLE IF EXISTS "layanan_alat_tes";
DROP TABLE IF EXISTS "alat_tes";
