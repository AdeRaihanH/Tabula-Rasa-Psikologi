/**
 * Skrip satu kali: mengambil refresh token OAuth untuk akun Google biro.
 *
 * Cara pakai:
 *   1. Isi di .env:
 *        GOOGLE_OAUTH_CLIENT_ID="....apps.googleusercontent.com"
 *        GOOGLE_OAUTH_CLIENT_SECRET="...."
 *   2. Jalankan: npx tsx scripts/oauth-consent.ts
 *   3. Buka tautan yang dicetak, setujui akses.
 *   4. Refresh token otomatis tersimpan ke .env.
 */
import "dotenv/config";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { exec } from "node:child_process";

import { google } from "googleapis";

const PORT = 4567;
const REDIRECT = `http://localhost:${PORT}/oauth2callback`;
const SCOPE = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/spreadsheets",
];

const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error(
    "GAGAL: GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET belum diisi di .env",
  );
  process.exit(1);
}

const oauth2 = new google.auth.OAuth2(clientId, clientSecret, REDIRECT);

const url = oauth2.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: SCOPE,
});

function simpanKeEnv(nama: string, nilai: string) {
  const berkas = path.join(process.cwd(), ".env");
  let isi = fs.existsSync(berkas) ? fs.readFileSync(berkas, "utf8") : "";
  const baris = `${nama}="${nilai}"`;

  if (new RegExp(`^${nama}=`, "m").test(isi)) {
    isi = isi.replace(new RegExp(`^${nama}=.*$`, "m"), baris);
  } else {
    if (isi.length > 0 && !isi.endsWith("\n")) isi += "\n";
    isi += `\n# Token OAuth akun Google biro (diperoleh otomatis)\n${baris}\n`;
  }
  fs.writeFileSync(berkas, isi);
}

const server = http.createServer(async (req, res) => {
  const alamat = new URL(req.url ?? "/", REDIRECT);

  if (alamat.pathname !== "/oauth2callback") {
    res.writeHead(404).end("Not found");
    return;
  }

  const code = alamat.searchParams.get("code");
  const galat = alamat.searchParams.get("error");

  if (galat || !code) {
    res
      .writeHead(400, { "content-type": "text/html; charset=utf-8" })
      .end(`<h2>Gagal</h2><p>${galat ?? "Kode otorisasi tidak diterima."}</p>`);
    console.error("GAGAL: otorisasi ditolak ->", galat);
    server.close();
    process.exit(1);
  }

  try {
    const { tokens } = await oauth2.getToken(code);

    if (!tokens.refresh_token) {
      res
        .writeHead(400, { "content-type": "text/html; charset=utf-8" })
        .end(
          "<h2>Refresh token tidak diterima</h2><p>Cabut akses aplikasi di akun Google Anda lalu jalankan skrip ini lagi.</p>",
        );
      console.error("GAGAL: refresh_token kosong.");
      server.close();
      process.exit(1);
    }

    simpanKeEnv("GOOGLE_OAUTH_REFRESH_TOKEN", tokens.refresh_token);

    res
      .writeHead(200, { "content-type": "text/html; charset=utf-8" })
      .end(
        `<div style="font-family:system-ui;max-width:32rem;margin:4rem auto;text-align:center">
          <h2 style="color:#0f766e">Berhasil ✓</h2>
          <p>Refresh token sudah disimpan ke <code>.env</code>.</p>
          <p>Silakan tutup tab ini dan kembali ke terminal.</p>
        </div>`,
      );

    console.log("\n=== BERHASIL ===");
    console.log("refresh_token tersimpan ke .env");
    console.log("SCOPE:", tokens.scope);
    server.close();
    setTimeout(() => process.exit(0), 300);
  } catch (e) {
    res.writeHead(500).end("Gagal menukar kode otorisasi.");
    console.error("GAGAL menukar code:", e);
    server.close();
    process.exit(1);
  }
});

server.listen(PORT, () => {
  console.log("\n=== IZINKAN AKSES GOOGLE ===");
  console.log("Buka tautan berikut di browser, login dengan akun Google BIRO");
  console.log("(akun pemilik folder Drive), lalu klik Allow/Setujui:\n");
  console.log(url);
  console.log("\nMenunggu otorisasi... (jangan tutup terminal ini)");

  // Buka browser otomatis (best effort, Windows).
  exec(`start "" "${url}"`, () => {
    /* diabaikan bila gagal */
  });
});

setTimeout(
  () => {
    console.error("\nGAGAL: waktu habis (10 menit). Jalankan ulang skrip ini.");
    server.close();
    process.exit(1);
  },
  10 * 60 * 1000,
);
