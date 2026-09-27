-- Daring dihapus: harga khusus daring tidak lagi dipakai.
-- `harga` (umum) tetap ada sebagai cadangan bila `hargaOffline` kosong.
ALTER TABLE "layanan" DROP COLUMN IF EXISTS "hargaOnline";
