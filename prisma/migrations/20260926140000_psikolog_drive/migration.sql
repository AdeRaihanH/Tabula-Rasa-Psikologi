-- 5 psikolog: foto profil + folder Google Drive masing-masing + spreadsheet arsip.
-- Pengaturan situs: folder data keseluruhan klien dan folder admin (lihat semua).

ALTER TABLE "profil_psikolog"
  ADD COLUMN "fotoUrl" TEXT,
  ADD COLUMN "driveFolderId" TEXT,
  ADD COLUMN "driveFolderUrl" TEXT,
  ADD COLUMN "spreadsheetId" TEXT,
  ADD COLUMN "spreadsheetUrl" TEXT;

ALTER TABLE "pengaturan_situs"
  ADD COLUMN "driveClientFolderId" TEXT,
  ADD COLUMN "driveAdminFolderId" TEXT;
