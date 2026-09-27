-- Dokumen Word interpretasi laporan (Zona 3), diunggah otomatis ke Drive
-- psikolog penanggung jawab saat laporan difinalkan.
ALTER TABLE "laporan_hasil"
  ADD COLUMN "dokumenUrl" TEXT,
  ADD COLUMN "dokumenId" TEXT,
  ADD COLUMN "dokumenNama" TEXT,
  ADD COLUMN "dokumenPada" TIMESTAMP(3);
