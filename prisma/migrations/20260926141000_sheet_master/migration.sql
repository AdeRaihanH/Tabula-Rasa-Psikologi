-- Spreadsheet master (data keseluruhan klien) pada pengaturan situs.

ALTER TABLE "pengaturan_situs"
  ADD COLUMN "spreadsheetId" TEXT,
  ADD COLUMN "spreadsheetUrl" TEXT;
