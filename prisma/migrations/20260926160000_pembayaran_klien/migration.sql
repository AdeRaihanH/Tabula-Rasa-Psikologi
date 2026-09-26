-- Harga per metode layanan + data rekening untuk pembayaran klien.

ALTER TABLE "layanan"
  ADD COLUMN "hargaOnline" DECIMAL(12,2),
  ADD COLUMN "hargaOffline" DECIMAL(12,2);

ALTER TABLE "pengaturan_situs"
  ADD COLUMN "bankNama" TEXT,
  ADD COLUMN "bankNomor" TEXT,
  ADD COLUMN "bankAtasNama" TEXT,
  ADD COLUMN "instruksiPembayaran" TEXT;
