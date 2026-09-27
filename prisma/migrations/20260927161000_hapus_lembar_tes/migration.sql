-- `lembar_tes` (pencatatan per alat tes) tidak lagi dipakai: konfirmasi
-- pelaksanaan tes kini satu tindakan tunggal pada `pendaftaran`
-- (`konfirmasiTesPada` / `konfirmasiTesOlehId`). Alat tes yang berlaku sudah
-- ditentukan oleh `layanan_alat_tes` per layanan.
DROP TABLE IF EXISTS "lembar_tes";
DROP TYPE IF EXISTS "StatusLembarTes";
