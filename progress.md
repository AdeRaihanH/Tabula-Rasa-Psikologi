# Progress — Tabula Rasa (Web Biro Psikologi)

Catatan kronologis pembangunan. Diperbarui setiap kali ada penambahan.

---

## Ringkasan Status

| Area | Status |
| --- | --- |
| Setup Next.js 16 + Supabase + Prisma 7 | ✅ Selesai |
| Skema data 3 zona kerahasiaan | ✅ Selesai |
| Autentikasi & otorisasi (RBAC) | ✅ Selesai |
| Situs publik | ✅ Selesai |
| Portal internal (Admin / Asisten / Psikolog) | ✅ Selesai |
| Isolasi data antar-psikolog | ✅ Selesai & teruji |
| Siap deploy Vercel | ✅ Selesai |

---

## 1. Fondasi Proyek

- **Stack**: Next.js 16.3.6 (App Router, Turbopack, React Compiler), React 19,
  Tailwind CSS v4, Prisma ORM 7 + `@prisma/adapter-pg`, PostgreSQL (Supabase),
  `bcryptjs` + `jose` untuk autentikasi.
- **Prisma 7** (bukan Prisma 8 RC):
  - `prisma/schema.prisma` memakai generator `prisma-client` dengan output
    `src/generated/prisma`.
  - URL database dipindah ke `prisma.config.ts` (Prisma 7 melarang `url` di
    schema — error P1012).
  - Driver adapter wajib: `PrismaPg` dipakai di `src/lib/prisma.ts` dan seed.
  - `prisma.config.ts` memuat `dotenv/config` (Prisma 7 tidak auto-load `.env`).
- **Script** `package.json`: `build = prisma generate && next build`,
  `postinstall = prisma generate`, plus `db:migrate`, `db:deploy`, `db:push`,
  `db:studio`, `db:generate`.

## 2. Skema Database (`prisma/schema.prisma`)

Enum: `Role`, `KategoriLayanan`, `MetodeLayanan`, `StatusPendaftaran`,
`StatusPembayaran`, `StatusSesi`, `StatusLembarTes`, `StatusLaporan`,
`KlasifikasiData`.

Model:

| Model | Zona | Isi |
| --- | --- | --- |
| `User`, `SesiLogin` | — | Akun & sesi login |
| `ProfilPsikolog` | — | Profil publik psikolog (SIPP/STR/spesialisasi) |
| `Klien` | Zona 1 | Data diri & kontak klien |
| `Layanan` | — | Katalog 14 layanan |
| `Pendaftaran` | — | Kasus/permintaan layanan (pusat alur) |
| `Pembayaran` | Zona 1 | Tagihan & verifikasi |
| `JadwalSesi` | Zona 1 | Jadwal sesi |
| `AlatTes`, `LembarTes`, `SkorMentah` | Zona 2 | Instrumen & skor mentah |
| `LaporanHasil` | Zona 3 | Interpretasi & rekomendasi |
| `ArsipData`, `AuditLog`, `PengaturanSitus` | — | Pengarsipan, audit, pengaturan |

Migrasi: `20260926091626_init` — sudah diterapkan ke Supabase.

Seed (`prisma/seed.ts`): 1 pengaturan situs, 5 akun (1 admin, 1 asisten,
3 psikolog), 14 layanan, 11 alat tes.

## 3. Autentikasi & Otorisasi

- `src/lib/auth/password.ts` — hash & verifikasi bcrypt.
- `src/lib/auth/session.ts` — JWT `jose`, cookie httpOnly `tr_session`, 8 jam.
- `src/lib/auth/dal.ts` — `sesiSaatIni`, `wajibMasuk`, `wajibPeran`,
  `wajibKemampuan`, `filterKasusPsikolog`, `milikPsikolog`.
- `src/lib/rbac.ts` — matriks hak akses + definisi 3 zona.
- `src/proxy.ts` — Next 16 mengganti *middleware* menjadi *proxy*; memeriksa
  cookie secara optimistik dan mengalihkan rute `/dashboard` yang belum login.
- `SESSION_SECRET` disimpan di `.env` (di-gitignore).

## 4. Situs Publik

| Rute | Isi |
| --- | --- |
| `/` | Beranda: hero, statistik, 5 lini layanan, layanan unggulan, penjelasan 3 zona, 8 alur, tim, CTA |
| `/layanan` | Katalog lengkap per kategori |
| `/layanan/[slug]` | Detail layanan + ringkasan + langkah + CTA pendaftaran |
| `/tim` | Profil psikolog publik dengan SIPP/STR |
| `/alur` | 8 tahap layanan + catatan (informed consent, MOU, umpan balik, retensi) |
| `/kerahasiaan` | Penjelasan 3 zona + **matriks hak akses** + 4 prinsip |
| `/kontak` | Kanal kontak, alamat, jam operasional |
| `/daftar` | Formulir pendaftaran (Zona 1) dengan informed consent |

Desain: tema "kertas" hangat (paper/ink/brand teal/sand), font Plus Jakarta Sans,
komponen bersama di `src/components/ui` dan `src/components/publik`.

## 5. Portal Internal

Layout `src/app/(dalam)/layout.tsx` + sidebar per peran
(`src/lib/nav-dashboard.ts`).

**Admin — Zona 1**

- `/dashboard` — ringkasan: statistik, hitungan per zona, pendaftaran terbaru,
  aktivitas terakhir.
- `/dashboard/pendaftaran` — daftar + filter status.
- `/dashboard/pendaftaran/[id]` — detail: data klien, kebutuhan, pembayaran
  (catat tagihan + verifikasi/tolak), jadwal (buat jadwal), ubah status,
  tetapkan psikolog penanggung jawab.
- `/dashboard/klien` — data klien.
- `/dashboard/jadwal` — agenda sesi.
- `/dashboard/layanan` — katalog + jumlah pendaftar.
- `/dashboard/audit` — log audit (termasuk percobaan akses ditolak).

**Asisten Psikolog — Zona 2**

- `/dashboard/asesmen` — daftar kasus siap diasesmen.
- `/dashboard/asesmen/[id]` — kelola lembar tes, input skor mentah, catatan.
- `/dashboard/alattes` — master instrumen.
- `/dashboard/jadwal` — jadwal.

**Psikolog — Zona 3**

- `/dashboard/kasus` — hanya kasus yang ditugaskan kepadanya.
- `/dashboard/kasus/[id]` — skor mentah (baca) + form laporan
  (ringkasan, interpretasi, kesimpulan, rekomendasi), simpan draft / finalkan.
- `/dashboard/jadwal` — jadwal miliknya.

## 6. Isolasi Data Antar-Psikolog

Dijaga berlapis:

1. **Matriks hak akses** (`rbac.ts`) — peran tanpa kemampuan dialihkan.
2. **Batas kepemilikan kasus** — `/dashboard/kasus/[id]` mengalihkan bila
   `pendaftaran.psikologId !== sesi.userId`.
3. **Aksi server** (`simpanLaporan`) memverifikasi kepemilikan sebelum menulis.
4. **Jejak audit** — percobaan akses ditolak dicatat (`AKSES_LAPORAN_DITOLAK`).

Hasil uji HTTP (semua sesuai harapan):

```
Admin     : Zona 1 = 200 · Zona 2 = 307 ditolak
Psikolog1 : kasus sendiri = 200 · kasus psikolog2 = 307 DITOLAK · data klien = 307
Psikolog2 : kasus sendiri = 200
Asisten   : Zona 2 = 200 · Zona 3 = 307 ditolak · data klien = 307
Tanpa login: /dashboard = 307 → /masuk
```

## 7. Verifikasi

- `prisma validate` ✅
- `prisma migrate` + `prisma db seed` ke Supabase ✅
- `tsc --noEmit` ✅
- `eslint` ✅
- `next build` — 34 rute ✅
- Uji HTTP RBAC & isolasi psikolog ✅

## 8. Kebersihan Repositori

- File AI/agent **tidak** masuk git (`.gitignore`): `.agents/`, `.claude/`,
  `.cursor/`, `.devin/`, `.aider-desk/`, `.opencode/`, `AGENTS.md`, `CLAUDE.md`,
  `skills-lock.json`, `.env*`, `/src/generated/prisma`.
- Folder tak terpakai dihapus (`.cursor`, `.devin`, `.aider-desk`, skill Prisma 8).
- Skrip uji sementara dihapus setelah verifikasi.

## 9. Deploy Vercel

1. Push ke GitHub, import di Vercel.
2. Environment Variables: `DATABASE_URL` (pooler 6543 + `?pgbouncer=true`),
   `DIRECT_URL` (pooler 5432), `SESSION_SECRET`.
3. `npx prisma migrate deploy` (dari lokal) lalu deploy.

## 10. Akun Demo

Kata sandi semua: `TabulaRasa123!`

| Email | Peran |
| --- | --- |
| `admin@tabularasa.id` | Administrator |
| `asisten@tabularasa.id` | Asisten Psikolog |
| `psikolog1@tabularasa.id` | Psikolog (Klinis) |
| `psikolog2@tabularasa.id` | Psikolog (PIO) |
| `psikolog3@tabularasa.id` | Psikolog (Pendidikan) |

---

## Penambahan Lanjutan

### 11. Halaman Publik Tambahan

| Rute | Isi |
| --- | --- |
| `/cek-status` | Klien memeriksa status pendaftaran dengan **nomor + email** (keduanya harus cocok) — hanya informasi administratif minimal yang ditampilkan |
| `/biaya` | Tarif transparan per kategori layanan + catatan biaya institusi |
| `/faq` | Pertanyaan umum (layanan, kerahasiaan data, hasil & pembayaran) dalam accordion |
| `/robots.txt` | Disallow `/dashboard`, `/masuk`, `/api`; menunjuk sitemap |
| `/sitemap.xml` | Beranda, layanan, detail layanan, dan seluruh halaman publik |
| `not-found` | Halaman 404 kustom |

Navigasi publik kini: Beranda · Layanan · Biaya · Tim Psikolog · Alur Layanan ·
Kerahasiaan · Kontak. Tautan tambahan (Biaya, FAQ, Cek Status) tersedia di footer.

### 12. Halaman Dashboard Tambahan

**Admin**

| Rute | Isi |
| --- | --- |
| `/dashboard/pengguna` | Kelola akun: tambah pengguna, ubah nama/telepon/peran/status aktif, reset kata sandi. Akun sendiri tidak dapat dinonaktifkan |
| `/dashboard/pengaturan` | Identitas biro (nama, tagline, kontak, alamat, jam operasional) — langsung dipakai situs publik |
| `/dashboard/arsip` | Pengarsipan: kasus selesai → klasifikasi zona + masa retensi (1/3/5/10 tahun), status jatuh tempo, batal arsip |
| `/dashboard/klien/[id]` | Detail klien + riwayat pendaftaran + total pembayaran terverifikasi |

**Semua peran**

| Rute | Isi |
| --- | --- |
| `/dashboard/profil` | Ubah nama/telepon, ubah kata sandi sendiri (verifikasi sandi lama). Psikolog juga mengelola profil publiknya (spesialisasi, gelar, SIPP, STR, bio, pengalaman, tampil/tidak di `/tim`) |

**Kemampuan RBAC baru** (`src/lib/rbac.ts`): `pengaturan:kelola` (admin),
`arsip:kelola` (admin), `profil:kelola` (psikolog & admin).

### 13. Penyesuaian Zona 2 untuk Psikolog

`lembartes:lihat` dan `skor:lihat` dimiliki **asisten dan psikolog** (psikolog
perlu membaca skor mentah untuk menyusun interpretasi), sedangkan
`lembartes:kelola` dan `skor:kelola` hanya asisten. Halaman
`/dashboard/asesmen/[id]` karena itu menampilkan **mode baca** untuk psikolog:
form pengisian skor dan tombol tambah lembar tes disembunyikan, diganti
tampilan skor yang hanya bisa dibaca.

### 14. Pengaturan Situs Dinamis

Situs publik kini membaca identitas biro dari tabel `pengaturan_situs` (dapat
diubah admin lewat `/dashboard/pengaturan`), dengan nilai bawaan dari
`src/lib/config.ts` bila database belum terisi. Diterapkan pada footer dan
meta situs melalui `ambilIdentitas()` di `src/lib/data-publik.ts`.

### 15. Polish & SEO

- `loading.tsx` (skeleton) dan `error.tsx` (dengan tombol coba lagi) pada
  segmen `/dashboard`.
- `metadataBase`, `sitemap.ts`, `robots.ts`.
- `NEXT_PUBLIC_SITE_URL` opsional untuk URL kanonik.

> **Catatan teknis:** karena `/dashboard` memiliki `loading.tsx`, respons
> di-*streaming*, sehingga redirect dari Server Component muncul sebagai HTTP
> 200 dengan penanda `NEXT_REDIRECT` pada payload — bukan 307. Verifikasi
> otorisasi karenanya dilakukan dengan memeriksa **konten** (halaman terlarang
> tidak boleh mengandung penanda uniknya), bukan sekadar kode status.

### 16. Hasil Uji Akhir

Skrip uji akses (`scripts/uji-akses.ts`) menguji 32 skenario — **32/32 lulus**:

- Publik: `/cek-status`, `/faq`, `/biaya`, `/robots.txt`, `/sitemap.xml` tampil.
- Admin: seluruh halaman Zona 1 + kelola tampil; Zona 2 & Zona 3 **tertutup**.
- Asisten: Zona 2 + profil tampil; arsip, pengguna, pengaturan, Zona 3, dan
  data klien **tertutup**.
- Psikolog: kasus, jadwal, profil, Zona 2 (baca) tampil; data klien, pengguna,
  arsip **tertutup**.
- **Isolasi**: psikolog1 membuka kasus psikolog2 → tertutup; psikolog2 membuka
  kasusnya sendiri → tampil.
- Tanpa login → tertutup.

Verifikasi: `tsc` ✅ · `eslint` ✅ · `next build` (**43 rute**) ✅ · uji akses ✅

Skrip uji sementara dihapus setelah verifikasi.


---

## Revisi sesuai Masukan Klien

### 17. Katalog Layanan Disederhanakan

Kategori layanan dipangkas menjadi **dua** sesuai permintaan klien:

| Kategori | Layanan |
| --- | --- |
| **A. Tes & Asesmen** (Layanan 1) | Tes IQ · Tes Minat Bakat · Tes Kesiapan Sekolah |
| **B. Untuk Perusahaan (B2B)** | Psikologi Industri & Organisasi (PIO) |

- Enum `KategoriLayanan` diubah dari 5 nilai lama menjadi `TES_ASESMEN` dan
  `PERUSAHAAN` (migrasi `20260926120000_katalog_earth_tone_drive`).
- Data layanan lama dihapus, lalu 4 layanan baru di-seed.
- Halaman `/layanan` kini menampilkan dua blok kategori besar, masing-masing
  dengan penjelasan *Cocok untuk* dan *Tahapan*.

### 18. Palet Warna Earth Tone

Seluruh palet diganti menjadi *earth tone* di `src/app/globals.css`:

| Peran | Warna |
| --- | --- |
| Latar | krem `#FBF7F1` / `#F4ECE0` |
| Teks | cokelat gelap `#2B2622` |
| Aksen utama (brand) | terracotta `#945034` → `#42231A` |
| Aksen sekunder (sand) | pasir keemasan `#C9A458` |
| Aksen ketiga (sage) | zaitun `#687A52` |

Warna zona juga dihangatkan: Zona 1 dusty blue, Zona 2 ochre, Zona 3 olive.

### 19. Tampilan Mengikuti Gaya Mindset Psychology

- **Bar informasi atas**: jam operasional, email, telepon, dan tautan Chat Admin.
- **Header** lengkap dengan menu, tautan Cek Status, tombol Masuk & Daftar,
  serta tombol WhatsApp di menu seluler.
- **Beranda** disusun ulang: hero dengan badge kepercayaan (rating & jumlah
  klien), statistik, dua kartu kategori layanan, bagian keunggulan,
  tim psikolog, alur singkat, kerahasiaan, testimoni, FAQ singkat, dan CTA.
- **Footer** diperluas: identitas, kontak, tombol WhatsApp & Daftar, serta tiga
  kolom tautan layanan/biro/akses.

### 20. Integrasi Google Drive untuk Arsip Data

Modul baru `src/lib/gdrive.ts` dan `src/lib/drive-arsip.ts` memakai
*service account* Google Drive.

- Setiap pendaftaran memperoleh **satu folder Drive** (dibuat otomatis),
  berisi ringkasan pendaftaran dalam bentuk berkas teks.
- **Unggah bukti pembayaran** langsung dari halaman detail pendaftaran.
- **Unggah dokumen** (PDF/gambar/office) ke folder kasus.
- Halaman **Pengarsipan** menyimpan tautan folder Drive dan menampilkannya
  sebagai kolom *Arsip Digital*.
- Kolom `folderDriveUrl` ditambahkan pada `pendaftaran` dan `arsip_data`, serta
  `driveFolderId` pada `pengaturan_situs`.
- Konfigurasi melalui Environment Variables (lihat `.env`):
  `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_DRIVE_FOLDER_ID`.
- **Graceful degradation**: bila kredensial belum diisi, fitur Drive dinonaktifkan
  dan aplikasi tetap berjalan normal. Halaman Pengaturan menampilkan status
  kesiapan integrasi.
- Batas unggah dinaikkan ke 8 MB melalui `serverActions.bodySizeLimit`.

### 21. Hasil Uji Akhir Revisi

`tsc` ✅ · `eslint` ✅ · `next build` ✅ · uji akses **31/31 lulus**,
termasuk isolasi antar-psikolog (psikolog1 tidak dapat membuka kasus
psikolog2, sedangkan psikolog2 dapat membuka kasusnya sendiri).

Skrip uji sementara dihapus setelah verifikasi.

---

## Revisi Kedua: Psikolog & Arsip Google

### 22. Data 5 Psikolog

Katalog psikolog placeholder diganti dengan 5 psikolog sesuai data klien:

| Psikolog | Spesialisasi | Folder Google Drive |
| --- | --- | --- |
| Anugrah Mujaddidah Kadim | Psikolog Klinis | `11IYflposUKrD6wyoWMaTKebk_oz7jTt6` |
| Nadia Rafa Aziza | Psikolog Klinis | `15V5N-NjOe6lbouNkMCqDHl30zxccXrzp` |
| Aprilia Anggorowati | Psikolog Pendidikan | `1sdnX6Oc98OhOB1mrevt96p1hAwWH1TkG` |
| Anissa Salsabila | Psikolog Klinis | `1trCNA2wcUwevp_daQoqkSNzIv2yknkt5` |
| Amanda Fadhia Feriqhalisyah | Psikolog Industri & Organisasi | `16S35pkY4WS0TGn7nsVXRMyKkP7dklWRf` |

- Email login: `anugrah@`, `nadia@`, `aprilia@`, `anissa@`, `amanda@tabularasa.id`
  (kata sandi tetap `TabulaRasa123!`).
- Foto masing-masing psikolog diletakkan di `public/psikolog/` dengan nama
  berbasis slug, lalu dipetakan melalui kolom `ProfilPsikolog.fotoUrl`.
- Psikolog lama (`psikolog1-3@`) beserta kasus ujinya dibersihkan oleh seed.

### 23. Pemilihan Psikolog pada Pendaftaran

- Formulir pendaftaran publik kini **mewajibkan memilih psikolog**. Pilihan
  ditampilkan sebagai kartu berisi foto bulat, nama, dan spesialisasi.
- Validasi di server: `psikologId` wajib, dan psikolog harus berperan
  `PSIKOLOG` serta aktif.
- `psikologId` langsung tersimpan pada pendaftaran sehingga kasus otomatis
  masuk ke isolasi milik psikolog tersebut.
- Halaman `/tim` menyediakan tombol *Daftar dengan psikolog ini* yang membawa
  `?psikolog=<id>` ke formulir (pilihan otomatis tercentang).

### 24. Foto Psikolog

Komponen `KartuPsikolog` menampilkan **foto bulat berukuran sama** (128 px)
bagian atas, dengan **nama dan spesialisasi di bawahnya**, ditambah bio,
SIPP/STR, pengalaman, dan tombol pendaftaran. Dipakai di beranda (ringkas) dan
halaman `/tim` (lengkap).

### 25. Arsip Google Drive & Spreadsheet

Alur arsip otomatis untuk setiap pendaftaran baru:

1. Folder kasus dibuat di folder Drive **psikolog yang dipilih**, dengan nama
   `NOMOR — Nama Klien`.
2. Ringkasan pendaftaran ditulis sebagai berkas teks di dalam folder tersebut.
3. Tautan pintas (shortcut) ke folder kasus dibuat di folder **Data Keseluruhan
   Klien** sehingga seluruh klien dapat dilihat dari satu tempat.
4. Baris pendaftaran ditambahkan ke **spreadsheet arsip psikolog**.
5. Baris yang sama ditambahkan ke **spreadsheet master (data keseluruhan klien)**.

Folder yang digunakan:

| Keperluan | Folder |
| --- | --- |
| Data keseluruhan klien | `16F1c4BWs8WDDuy4PQio76gOG1Hf4zUNc` |
| Admin (melihat semua) | `1cH7UOUcErtOdcgvI0h0in8gyB1Sy0xEe` |
| Per psikolog | folder masing-masing (tabel bagian 22) |

Halaman **Admin → Tim Psikolog** (`/dashboard/psikolog`) menyediakan:

- Panel *Arsip Digital Keseluruhan*: siapkan spreadsheet master, sinkronkan
  tautan pintas folder psikolog ke folder admin, dan tautan ke folder klien.
- Kartu per psikolog: sunting profil, foto, tautan folder Drive, dan siapkan
  spreadsheet arsip psikolog.

Kolom database baru:
`ProfilPsikolog.fotoUrl`, `.driveFolderId`, `.driveFolderUrl`,
`.spreadsheetId`, `.spreadsheetUrl`; `PengaturanSitus.driveClientFolderId`,
`.driveAdminFolderId`, `.spreadsheetId`, `.spreadsheetUrl`.

### 26. Ketahanan (Graceful Degradation)

- Seluruh proses Google dibungkus penanganan kegagalan: bila kredensial belum
  diisi atau folder belum dibagikan, pendaftaran **tetap tersimpan** dan
  pengguna tidak melihat galat.
- `after()` dibungkus helper `jalankanSetelahRespons()` yang otomatis jatuh ke
  eksekusi langsung bila dipanggil di luar konteks request.
- `revalidatePath` dibungkus `revalidasiAman()` agar kegagalan revalidasi tidak
  menggagalkan pendaftaran yang sudah tersimpan.

### 27. Hasil Uji Akhir

- `tsc` ✅ · `eslint` ✅ · `next build` ✅
- Uji akses RBAC & isolasi: **37/37 lulus** (termasuk Anugrah tidak dapat
  membuka kasus Nadia, sedangkan Nadia dapat membuka kasusnya sendiri).
- Uji logika server action pendaftaran: **lulus** — tanpa psikolog ditolak,
  dengan psikolog menghasilkan `TR-2026-00005` dengan `psikolog` terisi benar.
- Foto psikolog tersedia (HTTP 200) dan tampil sebagai `<img>` di `/tim`.
- Data uji dibersihkan; database berisi 5 psikolog, 4 layanan, 0 pendaftaran.

---

## Revisi Ketiga: Perbaikan Integrasi Google (Kuota Service Account)

### 28. Temuan: Service Account Tidak Bisa Menulis

Diagnosa langsung terhadap kredensial service account milik klien:

```
[1] AUTH                    : OK
[2] BACA folder             : OK (folder "Data Klien" & folder psikolog)
[3] BUAT spreadsheet        : 403 storageQuotaExceeded
[4] BUAT di folder          : 403 storageQuotaExceeded
[5] UNGGAH berkas           : 403 "Service Accounts do not have storage quota.
                                   Leverage shared drives, or use OAuth delegation instead."
[6] Jenis folder            : MY DRIVE (akun biasa)
```

Penyebab: Google memberi service account **kuota penyimpanan 0 byte**. Ia hanya
bisa membaca folder yang dibagikan, tetapi tidak dapat membuat folder, berkas,
maupun spreadsheet. Jadi error tersebut bukan disebabkan oleh kode aplikasi.

### 29. Solusi: Mode OAuth Akun Biro

`src/lib/gdrive.ts` kini mendukung dua mode koneksi dan memilih otomatis:

| Mode | Variabel | Dapat menulis? |
| --- | --- | --- |
| **OAuth akun biro** (dipakai) | `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REFRESH_TOKEN` | ✅ Ya |
| Service account (cadangan) | `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY` | ❌ Tidak (baca saja) |

Keuntungan mode OAuth: berkas dibuat atas nama akun biro sendiri, sehingga
**folder tidak perlu dibagikan** ke akun lain dan kuota yang terpakai adalah
kuota akun biro (15 GB gratis).

Fungsi baru `statusGoogle()` melaporkan mode aktif beserta penjelasan, dan
halaman **Pengaturan Situs** menampilkan peringatan merah bila masih memakai
service account.

### 30. Skrip Otorisasi Sekali Jalan

`scripts/oauth-consent.ts` (dijalankan via `npm run google:consent`):

1. Membaca `GOOGLE_OAUTH_CLIENT_ID` & `GOOGLE_OAUTH_CLIENT_SECRET` dari `.env`.
2. Menjalankan server lokal `http://localhost:4567/oauth2callback`.
3. Membuka browser ke halaman izin Google.
4. Menukar kode otorisasi menjadi token.
5. **Menyimpan refresh token ke `.env` secara otomatis**.

Skrip ini tidak dihapus karena merupakan alat setup permanen.

### 31. Verifikasi

`tsc` ✅ · `eslint` ✅ · `next build` ✅ · `statusGoogle()` melaporkan mode
`service-account` dengan penjelasan yang benar.

---

## Revisi Keempat: Mode Service Account Terbatas + Spreadsheet Manual

### 32. Akar Masalah

Google memberi service account kuota penyimpanan **0 byte**. Diagnosa membuktikan:

- Membaca folder yang dibagikan → berhasil.
- Membuat folder/berkas/spreadsheet → selalu `403 storageQuotaExceeded`.
- Pesan resmi Google: *"Service Accounts do not have storage quota. Leverage
  shared drives, or use OAuth delegation instead."*

### 33. Solusi yang Dipakai

Karena menambah baris ke spreadsheet yang **sudah ada** tidak memerlukan kuota
penyimpanan, arsitektur diubah:

| Operasi | Mode service account | Mode OAuth |
| --- | --- | --- |
| Menambah baris ke spreadsheet | ✅ (spreadsheet dibuat manual lalu di-share) | ✅ |
| Membuat folder/berkas/spreadsheet | ❌ | ✅ |
| Tautan pintas folder | ❌ | ✅ |

Admin membuat spreadsheet manual (5 spreadsheet psikolog + 1 master), membagikan
ke email service account sebagai **Editor**, lalu menempelkan tautannya:

- Spreadsheet master → halaman **Pengaturan Situs** / panel *Arsip Digital
  Keseluruhan* di `/dashboard/psikolog`.
- Spreadsheet per psikolog → kolom *Tautan spreadsheet arsip psikolog* pada
  kartu masing-masing psikolog.

Aplikasi menyimpan `spreadsheetId` hasil penguraian tautan, lalu otomatis
menambah baris setiap ada pendaftaran baru.

### 34. Penyesuaian Teknis

- `src/lib/gsheets.ts` kini **mendeteksi nama sheet** yang tersedia (memakai
  sheet bernama `Pendaftaran` bila ada, jika tidak memakai sheet pertama) dan
  **menulis baris judul otomatis** bila baris pertama masih kosong. Ini penting
  karena spreadsheet buatan manual umumnya bernama `Sheet1`.
- `src/lib/gdrive.ts`: fungsi baru `modeGoogle()`, `bisaMembuatBerkas()`,
  `idSpreadsheetDariTautan()`; `driveAktif()` kini benar untuk kedua mode;
  `statusGoogle()` menjelaskan batasan tiap mode.
- `src/lib/drive-arsip.ts`: pemisahan `buatSpreadsheet*` (khusus OAuth) dan
  `spreadsheet*` (baca tautan dari database); `folderPendaftaran()` memakai
  folder psikolog yang ada saat mode service account; fungsi `ujiSpreadsheet()`
  untuk menulis baris uji.
- Aksi baru: `simpanSpreadsheetKlien`, `ujiSpreadsheetPsikolog`,
  `ujiSpreadsheetKlien`. Tombol *Uji tulis baris* memudahkan verifikasi.
- `scripts/oauth-consent.ts` + `npm run google:consent` tetap disediakan sebagai
  jalur opsional menuju mode OAuth penuh.

### 35. Verifikasi

`tsc` ✅ · `eslint` ✅ · `next build` ✅ · `statusGoogle()` melaporkan mode
`service-account` beserta batasannya.

---

## Revisi Kelima: Pemformatan Tabel Spreadsheet

### 36. Format Tabel Otomatis

Sesuai permintaan klien, spreadsheet arsip kini otomatis dirapikan agar nyaman
dilihat. Fungsi baru `rapikanSpreadsheet()` di `src/lib/gsheets.ts` menerapkan:

| Elemen | Perlakuan |
| --- | --- |
| Baris judul | Dibekukan (freeze) + tinggi 42 px |
| Header | Bold, font 10, latar terracotta `#945034`, teks putih, rata tengah, wrap |
| Garis header | Garis bawah tebal `#763F2A` |
| Lebar kolom | Disesuaikan per kolom (135–260 px) |
| Kolom tengah | Tanggal Lahir, Jenis Kelamin, Metode, Status |
| Kolom wrap | Kebutuhan, Folder Drive (rata atas) |
| Kolom teks | Telepon diformat `TEXT` agar `08…` tidak berubah menjadi angka |
| Warna baris | Selang-seling putih `#FFFFFF` dan krem `#FBF7F1` (banding) |
| Filter | Filter otomatis pada baris judul |

Lebar kolom: 135, 145, 185, 205, 120, 110, 105, 165, 205, 185, 95, 135, 260, 235 px.

### 37. Deteksi Sheet & Header Otomatis

Spreadsheet buatan manual umumnya bernama `Sheet1`, bukan `Pendaftaran`.
`judulSheetTujuan()` mencari sheet bernama `Pendaftaran` terlebih dahulu; bila
tidak ada, memakai sheet pertama. `pastikanHeader()` menulis baris judul 14
kolom bila baris pertama masih kosong, lalu **langsung merapikan tabel**.

### 38. Tombol di Dashboard

- **Rapikan semua tabel** (panel Arsip Digital) — merapikan 5 spreadsheet
  psikolog + master sekaligus.
- **Rapikan tabel** per psikolog dan pada panel master.
- **Uji tulis baris** untuk memverifikasi koneksi tulis.

### 39. Hasil Uji Nyata

Diuji langsung terhadap 6 spreadsheet milik klien:

- `rapikanSemuaSpreadsheet()` → **6/6 berhasil**, 0 gagal.
- Verifikasi metadata: freeze baris = 1, banding = 1 blok, header bold,
  warna header `rgb(148,80,52)`, lebar kolom 14 kolom sesuai rencana.
- Uji tulis end-to-end: pendaftaran uji menghasilkan satu baris lengkap di
  spreadsheet psikolog **dan** master, dengan telepon tetap `081200007777`.
- Baris uji dibersihkan kembali sehingga spreadsheet hanya berisi baris judul.

`tsc` ✅ · `eslint` ✅ · `next build` ✅

---

## Revisi Keenam: Link Arsip di Halaman Kasus Psikolog

### 40. Kartu "Arsip Digital Saya"

Pada halaman **Kasus Saya** (`/dashboard/kasus`) ditambahkan kartu di bagian atas
berisi tautan arsip milik psikolog yang sedang login:

- **Buka spreadsheet arsip ↗** — menuju `ProfilPsikolog.spreadsheetUrl`.
- **Buka folder Drive ↗** — menuju `ProfilPsikolog.driveFolderUrl` (bila ada).
- Bila spreadsheet belum diatur, ditampilkan label "Spreadsheet belum diatur".

Data diambil dari `ProfilPsikolog` milik `sesi.userId` (query paralel dengan
daftar kasus). Karena tautan berasal dari profil sendiri, **psikolog hanya
melihat arsipnya sendiri** — tidak ada tautan ke arsip psikolog lain.

### 41. Verifikasi

Diuji dengan token dua psikolog berbeda (Anugrah & Nadia):

- status 200 untuk keduanya,
- kartu "Arsip Digital Saya" tampil,
- kedua tombol tautan tampil,
- URL spreadsheet di HTML sama dengan nilai di database.

`tsc` ✅ · `eslint` ✅ · `next build` ✅

---

## Revisi Ketujuh: Alur 8 Tahap Benar-benar Terhubung

### 42. Masalah yang Ditemukan

Kasus uji `TR-2026-00001` berstatus **SELESAI** padahal belum ada pembayaran,
jadwal, maupun lembar tes. Penyebabnya: psikolog dapat langsung menekan
"Finalkan laporan" tanpa syarat apa pun, dan `majuOtomatis()` bisa **melompat**
langsung ke tahap mana pun (mis. BARU → SELESAI).

### 43. Alur 8 Tahap Dijadikan Sumber Kebenaran

Modul baru `src/lib/alur.ts` (murni, tanpa database) memuat definisi resmi 8
tahap beserta penanggung jawabnya:

| # | Tahap | Aktor |
| --- | --- | --- |
| 1 | Pendaftaran Baru | Klien |
| 2 | Skrining Kebutuhan | Admin |
| 3 | Menunggu Pembayaran | Klien & Admin |
| 4 | Terverifikasi | Admin |
| 5 | Terjadwal | Admin |
| 6 | Pelaksanaan | Asisten Psikolog |
| 7 | Pengolahan Data | Asisten & Psikolog |
| 8 | Selesai | Psikolog |

### 44. Syarat Setiap Tahap Ditegakkan

`src/lib/alur-otomatis.ts` menambahkan:

- `cekSyaratTahap()` — memeriksa kelengkapan sebelum sebuah tahap dicapai:
  - Tahap 3 butuh minimal satu tagihan pembayaran.
  - Tahap 4 butuh pembayaran berstatus TERVERIFIKASI.
  - Tahap 5 butuh minimal satu jadwal sesi.
  - Tahap 6 butuh minimal satu lembar tes.
  - Tahap 7 butuh **seluruh** lembar tes memiliki skor mentah.
  - Tahap 8 butuh laporan berstatus FINAL.
- `syaratFinalkan()` — syarat khusus finalisasi laporan.
- `majuOtomatis()` — **diperbaiki**: kini naik satu tahap demi satu dan
  memeriksa syarat setiap tahap, sehingga kasus tidak dapat melompat.

### 45. Kenaikan Tahap Otomatis dari Tindakan Nyata

| Tindakan | Tahap yang dicapai |
| --- | --- |
| Admin catat tagihan | 3 — Menunggu Pembayaran |
| Admin verifikasi pembayaran | 4 — Terverifikasi |
| Admin buat jadwal | 5 — Terjadwal |
| Asisten tambah lembar tes | 6 — Pelaksanaan |
| Asisten simpan skor (semua lembar lengkap) | 7 — Pengolahan Data |
| Psikolog simpan draft laporan | 7 — Pengolahan Data |
| Psikolog finalkan laporan | 8 — Selesai |

### 46. Tampilan Alur di Semua Halaman

Komponen baru `AlurStatus` menampilkan penanda 8 tahap (centang untuk tahap
lewat, sorot untuk tahap aktif, judul + deskripsi + penanggung jawab).
`PanelTahap` menampilkan tahap berikutnya, syarat yang belum lengkap, tombol
"Selesaikan tahap ini", serta bagian Koreksi (kembalikan tahap / batalkan).

Dipasang di:

- `/dashboard/pendaftaran/[id]` (admin)
- `/dashboard/asesmen/[id]` (asisten, stepper ringkas)
- `/dashboard/kasus/[id]` (psikolog, stepper ringkas)
- `/cek-status` (publik, memakai data `TAHAP` yang sama)

Dropdown "Ubah Status" yang bebas diganti tombol bertahap yang tervalidasi.
Form laporan menjadi komponen klien `FormLaporan` yang menampilkan pesan galat
dan **menonaktifkan tombol Finalkan** bila syarat belum lengkap.

### 47. Hasil Uji

Skrip uji alur (27 skenario) — **27/27 lulus**:

- Semua syarat tahap terkunci saat belum lengkap (6 pemeriksaan).
- Finalisasi ditolak tanpa lembar tes dan tanpa skor.
- **Tidak bisa melompat**: permintaan maju ke SELESAI dari BARU berhenti di
  SKRINING karena tagihan belum ada.
- Alur penuh 8 tahap berjalan berurutan dengan status benar di setiap tahap.

Uji tampilan (4 halaman) — semua penanda muncul:

```
200 admin detail pendaftaran | Alur Layanan | Tahap Berikutnya | Sedang di sini | Selesaikan tahap ini | Koreksi
200 asisten detail asesmen   | Alur Layanan | Tahap Berikutnya | dijalankan oleh
200 psikolog detail kasus    | Alur Layanan | Laporan Hasil | Belum bisa difinalkan | Finalkan laporan
200 publik cek-status        | Pendaftaran Baru | Penanggung jawab
```

Kasus uji `TR-2026-00001` direset ke **Pendaftaran Baru** agar dapat dicoba
ulang dari tahap 1.

`tsc` ✅ · `eslint` ✅ · `next build` ✅

---

## Revisi Kedelapan: Alur Pembayaran Klien

### 48. Masalah

Setelah mengirim pendaftaran, klien tidak diberi tahu biaya maupun cara
membayar. Harga juga masih dummy di halaman publik (sama untuk semua layanan),
dan admin tidak punya tempat mengelola harga maupun nomor rekening.

### 49. Harga per Metode

`Layanan` kini punya `hargaOnline` dan `hargaOffline` (selain `harga` lama
sebagai cadangan). Modul baru `src/lib/pembayaran.ts`:

- `hitungBiaya(layanan, metode)` — memilih harga sesuai metode, fallback ke `harga`.
- `hargaPerMetode(layanan)` — ringkasan harga daring & tatap muka.
- `keAngka()` — konversi Decimal Prisma ke number.

Harga seed: Tes IQ & Tes Minat Bakat Rp375.000 daring / Rp545.000 tatap muka;
Tes Kesiapan Sekolah Rp545.000 (hanya tatap muka); PIO tanpa harga (sesuai proposal).

### 50. Tagihan Otomatis + Instruksi Pembayaran

Saat klien mendaftar:

1. Biaya dihitung dari layanan + metode yang dipilih.
2. Bila biaya tersedia, **tagihan otomatis dibuat** (`Pembayaran` MENUNGGU).
3. Respons sukses membawa nama layanan, metode, biaya, data rekening, dan kontak.

Tampilan sukses pendaftaran menampilkan kartu **Pembayaran**: rincian layanan,
metode, total biaya, nomor rekening tujuan, 4 langkah pembayaran, instruksi dari
pengaturan, serta tombol kirim bukti via WhatsApp/email. Bila layanan belum
berharga, ditampilkan pesan menunggu konfirmasi admin.

Data rekening baru pada `PengaturanSitus`: `bankNama`, `bankNomor`,
`bankAtasNama`, `instruksiPembayaran`, dapat diubah admin di
`/dashboard/pengaturan`.

### 51. Cek Status Menampilkan Biaya

`cekStatusPendaftaran` kini juga mengembalikan metode, biaya, status pembayaran,
dan data rekening. Halaman `/cek-status` menampilkan biaya layanan, blok
instruksi pembayaran (rekening + langkah + tombol kirim bukti), peringatan bila
bukti ditolak, dan konfirmasi bila sudah terverifikasi.

### 52. Admin Mengelola Harga

Halaman `/dashboard/layanan` dirombak dari tabel baca menjadi **form per
layanan** (`FormHargaLayanan`): input harga daring & tatap muka (dinonaktifkan
bila metode tidak tersedia), toggle tampil di situs, dan ringkasan jumlah
pendaftar. Peringatan muncul bila ada layanan tanpa harga. Aksi server baru
`simpanLayanan` di `src/app/actions/layanan.ts` mencatat perubahan ke log audit.

### 53. Harga Asli di Situs Publik

Harga dummy diganti data database di `/layanan`, `/biaya`, dan
`/layanan/[slug]`. Harga hanya tampil untuk metode yang benar-benar tersedia.
Form pendaftaran menampilkan **perkiraan biaya** yang berubah mengikuti layanan
& metode, dan metode yang tidak didukung layanan otomatis dinonaktifkan
(dengan fallback ke metode pertama yang tersedia). Server tetap memvalidasi
ulang dan menolak metode yang tidak didukung.

### 54. Hasil Uji

Skrip uji alur pembayaran — **17/17 lulus**:

- Daftar daring → biaya 375000, tagihan otomatis dibuat, status MENUNGGU.
- Cek status menampilkan biaya, metode, rekening, status pembayaran.
- Metode daring pada layanan tatap muka **ditolak** dengan pesan jelas.
- Layanan tanpa harga (PIO) → tanpa tagihan otomatis, pesan konfirmasi admin.

Uji tampilan (7 halaman) — semua 200 dan penanda muncul; harga tampil dalam
format `Rp 375.000` / `Rp 545.000`.

`tsc` ✅ · `eslint` ✅ · `next build` ✅

> **Catatan:** setelah perubahan skema Prisma, dev server perlu di-restart agar
> Prisma Client baru dipakai. Tanpa restart, `/layanan` dan `/biaya` sempat
> mengembalikan 500.

---

## Catatan Operasional Penting

### 50. Panic Turbopack saat Mengubah Skema Prisma

Gejala yang pernah terjadi:

```
FATAL: An unexpected Turbopack error occurred.
[Server HMR] Subscription error, resubscribing: Error [TurbopackInternalError]:
  Cell CellId { ... } no longer exists in task TaskId { ... }
```

**Penyebab:** mengubah `prisma/schema.prisma` dan menjalankan `prisma generate`
**sementara dev server sedang berjalan**. Prisma Client yang diregenerasi
membuat cache HMR Turbopack tidak konsisten (cell hilang), sehingga HMR panic.

**Bukan bug kode aplikasi** — hanya cache pengembangan yang rusak.

**Solusi (urutan wajib):**

```bash
# 1. hentikan dev server (Ctrl+C, atau taskkill /PID <pid> /F)
# 2. hapus cache Next.js
rmdir /s /q .next        # Windows: rmdir /s /q .next
# 3. jalankan ulang
npm run dev
```

**Kebiasaan yang benar:** setiap kali mengubah `prisma/schema.prisma`:
hentikan dev server → jalankan `npx prisma generate` → (bila perlu) migrasi →
baru `npm run dev` kembali.

Setelah dibersihkan, seluruh **31 halaman diuji dan mengembalikan 200**
(14 publik, 13 admin, 5 asisten, 3 psikolog) tanpa panic baru.
