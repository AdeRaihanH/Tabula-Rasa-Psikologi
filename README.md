# Tabula Rasa — Web Biro Psikologi

Aplikasi web biro psikologi: situs publik untuk klien/korporasi, **portal klien**
untuk memantau pendaftaran sendiri, dan portal internal dengan **tiga zona
kerahasiaan data**.

## Fitur

**Situs publik**

- Beranda (gaya Mindset Psychology), katalog layanan 2 kategori, detail layanan,
  biaya, tim psikolog, alur layanan, sistem kerahasiaan, FAQ, kontak, dan cek
  status pendaftaran.
- **Pembuatan akun klien** (`/daftar-akun`) — satu akun untuk mendaftar layanan,
  memantau status, mengunggah bukti pembayaran, dan mengakses riwayat.
- Formulir pendaftaran daring (Zona 1) dengan informed consent dan **pemilihan
  psikolog** (wajib). Halaman `/daftar` **memerlukan login klien**; data diri
  otomatis terisi dari akun dan dapat diubah di **Profil Saya**.
- Header sadar sesi: menampilkan tombol *Masuk/Buat Akun* atau *Dashboard Saya*.
- Palet warna *earth tone* (krem, terracotta, pasir, zaitun).

**Katalog layanan**

| Kategori | Layanan | Harga |
| --- | --- | --- |
| A. Tes & Asesmen | Tes IQ | Rp375.000 daring / Rp545.000 tatap muka |
| A. Tes & Asesmen | Tes Minat Bakat | Rp375.000 daring / Rp545.000 tatap muka |
| A. Tes & Asesmen | Tes Kesiapan Sekolah | Rp545.000 tatap muka |
| B. Untuk Perusahaan (B2B) | Psikologi Industri & Organisasi (PIO) | Sesuai proposal |

Harga dikelola admin di `/dashboard/layanan` (per metode) dan otomatis menjadi
tagihan saat klien mendaftar.

**Alur pembayaran klien**

1. Klien mendaftar → **tagihan otomatis** dibuat sesuai layanan + metode.
2. Halaman sukses menampilkan total biaya, nomor rekening, dan langkah pembayaran.
3. Klien **mengunggah bukti transfer** langsung dari portal
   (`/dashboard/riwayat/[id]`) — atau mengirimnya via WhatsApp/email.
4. Admin memverifikasi di detail pendaftaran (status naik ke *Terverifikasi*).
5. Klien dapat memantau biaya & status pembayaran di `/cek-status` atau portal.

Nomor rekening dan instruksi pembayaran diatur di `/dashboard/pengaturan`.

**Tim psikolog**

Lima psikolog dengan foto profil (folder `public/psikolog/`), spesialisasi, dan
folder arsip Google Drive masing-masing. Kartu psikolog menampilkan foto bulat
di atas dan nama di bawahnya, serta tombol *Daftar dengan psikolog ini*.

**Arsip digital (Google Drive & Spreadsheet)** — opsional

- Setiap pendaftaran mendapat satu folder Drive di folder psikolog yang dipilih,
  berisi ringkasan pendaftaran, plus tautan pintas di folder *Data Keseluruhan Klien*.
- Baris pendaftaran otomatis tercatat di spreadsheet arsip psikolog **dan**
  spreadsheet master seluruh klien.
- Tabel spreadsheet **otomatis dirapikan**: header terwarnai, baris judul
  dibekukan, lebar kolom disesuaikan, warna baris selang-seling, filter aktif,
  dan kolom telepon diformat teks agar angka `0` di depan tidak hilang.
- Tombol **Rapikan semua tabel** tersedia di `/dashboard/psikolog`.
- Bila kredensial Drive belum diisi, seluruh fitur Google nonaktif dan aplikasi
  tetap berjalan normal (pendaftaran tetap tersimpan).

> **Penting:** service account Google **tidak punya kuota penyimpanan**, jadi
> ia tidak bisa membuat folder/berkas/spreadsheet baru. Karena itu spreadsheet
> dibuat manual lalu di-*share* sebagai **Editor** ke email service account;
> aplikasi hanya menambah baris ke spreadsheet tersebut. Untuk pembuatan
> otomatis penuh, gunakan mode OAuth (`npm run google:consent`).

**Portal internal** (login email + kata sandi, sesi JWT httpOnly 8 jam)

| Peran | Zona | Cakupan |
| --- | --- | --- |
| Admin | Zona 1 | Data diri klien, pendaftaran, jadwal, verifikasi pembayaran, katalog layanan, **tim psikolog & arsip Drive**, pengarsipan, pengguna & peran, pengaturan situs, log audit |
| Asisten Psikolog | Zona 2 | Lembar tes, skor mentah, master alat tes |
| Psikolog | Zona 3 | Laporan hasil, interpretasi, rekomendasi — **hanya kasus miliknya** (Zona 2 hanya baca) |
| Klien | — | **Hanya data miliknya sendiri**: riwayat pendaftaran, jadwal, dan unggah bukti pembayaran |

Semua peran memiliki halaman **Profil Saya** untuk memperbarui data diri dan
kata sandi. Psikolog juga mengelola profil publiknya.

**Portal klien** (`/dashboard/riwayat`)

- Akun dibuat sendiri melalui `/daftar-akun` (nama, email, telepon, kata sandi).
  Bila sebelumnya klien pernah mendaftar tanpa akun dengan email yang sama,
  **riwayat lamanya otomatis ditautkan** ke akun baru.
- `/dashboard/riwayat` — daftar semua pendaftaran klien beserta status terkini,
  biaya, dan ringkasan tahap (mis. *Tahap 3 dari 5*).
- `/dashboard/riwayat/[id]` — detail: ringkasan layanan, jadwal sesi (dibuat
  otomatis dari pilihan saat mendaftar), penanda 5 tahap, total biaya +
  rekening, **form unggah bukti pembayaran** (PDF/JPG/PNG, maks. 8 MB), dan
  **kartu Pelaksanaan Tes** berisi tautan pengerjaan dari asisten yang aktif
  mengikuti jadwal. Hasil asesmen dan interpretasi psikolog **tidak**
  ditampilkan di portal — diserahkan langsung melalui sesi umpan balik.
- Hasil asesmen dan interpretasi psikolog **tidak** ditampilkan di portal —
  diserahkan langsung melalui sesi umpan balik.

Alur pendaftaran mengikuti 5 tahap yang **ditegakkan sistem** — status tidak
dapat melompat dan setiap tahap punya syarat serta penanggung jawab:

| # | Tahap | Aktor | Syarat untuk dicapai |
| --- | --- | --- | --- |
| 1 | Pendaftaran & Pembayaran | Klien | Ada tagihan pembayaran |
| 2 | Verifikasi Pembayaran | Admin | Pembayaran diverifikasi |
| 3 | Pelaksanaan Tes | Klien & Asisten | Ada jadwal sesi (otomatis dari pilihan pendaftar) |
| 4 | Pelaporan Hasil | Psikolog | Semua lembar tes punya skor |
| 5 | Selesai | Psikolog | Laporan berstatus FINAL |

Penanda tahap tampil di halaman detail pendaftaran (admin), detail asesmen
(asisten), detail kasus (psikolog), dan halaman publik **Cek Status**.

## Isolasi data

- Pemisahan tugas dijaga oleh matriks hak akses di `src/lib/rbac.ts`.
- **Psikolog hanya dapat membuka kasus yang ditugaskan kepadanya.** Daftar
  pasien psikolog lain tidak terlihat dan URL kasus psikolog lain ditolak
  (dialihkan). Lihat `src/lib/auth/dal.ts` dan `src/app/(dalam)/dashboard/kasus/`.
- **Klien hanya dapat membuka pendaftarannya sendiri.** Filter `where`
  (`filterPendaftaranKlien`) membatasi query berdasarkan kepemilikan, dan aksi
  unggah bukti memverifikasi ulang kepemilikan sebelum menyentuh berkas.
- Setiap tindakan penting dicatat pada `audit_log`, termasuk percobaan akses
  yang ditolak (`AKSES_DITOLAK`, `AKSES_BUKTI_DITOLAK`).

## Keamanan

Perlindungan berlapis; modulnya ada di `src/lib/keamanan/`.

**Sesi & cookie**

- Cookie sesi `httpOnly`, `SameSite=Lax`, dan `Secure` di produksi.
- Di produksi namanya berawalan **`__Host-`** (`__Host-tr_session`) sehingga
  hanya berlaku untuk origin itu sendiri — subdomain lain tidak bisa menimpa
  atau menyuntik cookie sesi.
- Sesi tidak hanya berupa JWT: setiap login membuat baris di `sesi_login`
  (ID sesi baru setiap login), dan setiap permintaan divalidasi ulang ke
  database. Sesi karenanya **dapat dicabut** dari server.
- Sesi diikat ke perangkat (User-Agent). Cookie yang dicuri lalu dipakai di
  peramban lain akan ditolak.
- Mengubah/menyetel ulang kata sandi atau menonaktifkan akun **mencabut semua
  sesi** akun tersebut. Saat pengguna mengganti sandinya sendiri, sesi di
  perangkat lain dicabut sementara sesi berjalan tetap aktif.

**Anti brute force login**

- Maksimal 5 kegagalan per akun dan 25 per alamat IP dalam 15 menit; sesudahnya
  login diblokir sementara. Hitungan disimpan di `audit_log` agar tetap benar
  walau permintaan tersebar ke banyak instance.
- Pesan galat selalu seragam (*"Email atau kata sandi salah"*) dan perbandingan
  bcrypt tetap dijalankan walau akun tidak ada, sehingga email terdaftar tidak
  dapat ditebak dari waktu atau isi respons.
- Jebakan bot (honeypot) menolak pengiriman otomatis.

**Anti-spam formulir publik**

- Field jebakan (`situs_web`) dan penanda waktu isi (`_waktu`) menolak bot pada
  formulir masuk, daftar akun, pendaftaran, dan cek status.
- Pembatas laju per IP/akun: daftar akun 5/jam, pendaftaran 5/jam, cek status
  20/15 menit, unggah bukti 15/jam.
- Pencarian **Cek Status** memerlukan nomor **dan** email yang cocok, dan
  percobaan gagal dicatat.

**CSRF & header keamanan**

- Server Actions Next.js sudah membandingkan `Origin` dengan `Host`; `proxy.ts`
  menambah pemeriksaan serupa untuk semua permintaan yang mengubah data.
- `next.config.ts` memasang **CSP**, **HSTS**, `X-Content-Type-Options`,
  `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, dan
  menyembunyikan header `X-Powered-By`.

**Penyalahgunaan & DDoS**

- `proxy.ts` membatasi ~300 permintaan/menit per IP dan menolak path pemindai
  umum (`/.env`, `/.git`, `/wp-admin`, dll.).
- Pembatas di proxy bersifat **per instance** (best-effort pada serverless).
  Untuk perlindungan DDoS sungguhan, andalkan mitigasi platform Vercel dan
  lengkapi dengan **Vercel WAF / Rate Limiting** pada domain produksi.

> Ganti `SESSION_SECRET` sebelum produksi. Karena sesi kini divalidasi ke
> database, mengubah `SESSION_SECRET` sekaligus membuat semua sesi lama tidak
> berlaku.

## Teknologi

- Next.js 16 (App Router, Turbopack, React Compiler) + React 19
- Tailwind CSS v4
- Prisma ORM 7 + driver adapter `@prisma/adapter-pg`
- PostgreSQL (Supabase)
- Autentikasi: `bcryptjs` + `jose` (JWT httpOnly)

## Menjalankan secara lokal

1. Siapkan `.env`:

   ```env
   DATABASE_URL="postgresql://...:6543/postgres?pgbouncer=true"  # transaction pooler (runtime)
   DIRECT_URL="postgresql://...:5432/postgres"                   # session pooler (migrasi)
   SESSION_SECRET="hasil openssl rand -base64 32"
   SEED_PASSWORD="kata-sandi-awal-akun-staf"                     # dipakai saat seed

   # Opsional — arsip digital Google Drive
   GOOGLE_SERVICE_ACCOUNT_EMAIL="nama@proyek.iam.gserviceaccount.com"
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   GOOGLE_DRIVE_FOLDER_ID="1AbCdEfGhIjKlMnOpQrStUv"
   ```

   > Untuk Google Drive & Spreadsheet: buat *service account*, aktifkan
   > **Google Drive API** dan **Google Sheets API**, lalu bagikan **setiap**
   > folder tujuan ke email service account dengan akses **Editor**.
   > Daftar folder diatur di aplikasi (Admin → Tim Psikolog dan Pengaturan Situs),
   > sehingga `GOOGLE_DRIVE_FOLDER_ID` hanya sebagai cadangan.

2. Pasang dependensi, migrasi, dan seed:

   ```bash
   npm install
   npx prisma migrate deploy
   npx prisma db seed
   ```

3. Jalankan:

   ```bash
   npm run dev
   ```

   > Bila baru mengubah skema Prisma, **restart** dev server agar Prisma Client
   > yang baru dipakai.

### Akun awal (hasil seed)

Seed membuat satu akun Administrator, satu Asisten Psikolog, dan lima akun
Psikolog. **Kata sandi awal diambil dari `SEED_PASSWORD`** (min. 8 karakter) dan
tidak disimpan di repositori. Wajib diganti sebelum dipakai produksi.

> Akun **klien tidak di-seed** — buat sendiri melalui `/daftar-akun`.
> Isi `SEED_PASSWORD` dan `SESSION_SECRET` sebelum dipakai produksi.

## Perintah

| Perintah | Kegunaan |
| --- | --- |
| `npm run dev` | Server pengembangan |
| `npm run build` | `prisma generate` + build produksi |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Buat & terapkan migrasi baru |
| `npm run db:deploy` | Terapkan migrasi (produksi) |
| `npm run db:push` | Sinkronkan skema tanpa migrasi |
| `npm run db:studio` | Prisma Studio |

## Deploy ke Vercel

1. Push repositori ke GitHub, lalu import di Vercel (framework terdeteksi
   otomatis; build memakai `npm run build`).
2. Tambahkan Environment Variables di Vercel:
   - `DATABASE_URL` — transaction pooler (port `6543`, `?pgbouncer=true`)
   - `DIRECT_URL` — session pooler (port `5432`)
   - `SESSION_SECRET` — nilai acak
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`,
     `GOOGLE_DRIVE_FOLDER_ID` — bila memakai arsip Google (opsional)
3. Terapkan migrasi ke database produksi dari mesin lokal:

   ```bash
   npx prisma migrate deploy
   npx prisma db seed   # opsional
   ```

4. Deploy.

> **Catatan Google Drive di Vercel:** pada Environment Variables, tempel
> `GOOGLE_PRIVATE_KEY` **apa adanya** (dengan `\n` literal) — aplikasi otomatis
> mengubahnya menjadi baris baru.

## Struktur

```
prisma/
  schema.prisma        # model + enum (3 zona)
  seed.ts              # data awal: 5 psikolog, 4 layanan, alat tes, folder Drive
public/
  psikolog/            # foto profil psikolog
src/
   app/(publik)/        # situs publik (termasuk /daftar-akun)
   app/(dalam)/dashboard/  # portal internal + portal klien (/riwayat)
   app/masuk/           # login
   app/actions/         # server actions (termasuk akun.ts untuk klien)
  lib/
    config.ts          # identitas, katalog, konten publik
    rbac.ts            # matriks hak akses & 3 zona
    auth/              # session (cookie, sesi DB), password, DAL
    keamanan/          # rate limit, IP, jebakan bot
    prisma.ts          # Prisma Client + driver adapter
    gdrive.ts          # Google Drive (folder, unggah berkas)
    gsheets.ts         # Google Sheets (spreadsheet arsip)
    drive-arsip.ts     # orkestrasi arsip per pendaftaran
  components/          # UI publik, dashboard, ui
  proxy.ts             # throttle, CSRF, blokir pemindai, penjaga /dashboard
```
