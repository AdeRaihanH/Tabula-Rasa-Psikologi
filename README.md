# Tabula Rasa — Web Biro Psikologi

Aplikasi web biro psikologi: situs publik untuk klien/korporasi dan portal
internal dengan **tiga zona kerahasiaan data**.

## Fitur

**Situs publik**

- Beranda (gaya Mindset Psychology), katalog layanan 2 kategori, detail layanan,
  biaya, tim psikolog, alur layanan, sistem kerahasiaan, FAQ, kontak, dan cek
  status pendaftaran.
- Formulir pendaftaran daring (Zona 1) dengan informed consent dan **pemilihan
  psikolog** (wajib).
- Palet warna *earth tone* (krem, terracotta, pasir, zaitun).

**Katalog layanan**

| Kategori | Layanan |
| --- | --- |
| A. Tes & Asesmen | Tes IQ · Tes Minat Bakat · Tes Kesiapan Sekolah |
| B. Untuk Perusahaan (B2B) | Psikologi Industri & Organisasi (PIO) |

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

Semua peran memiliki halaman **Profil Saya** untuk memperbarui data diri dan
kata sandi. Psikolog juga mengelola profil publiknya.

Alur pendaftaran mengikuti 8 tahap yang **ditegakkan sistem** — status tidak
dapat melompat dan setiap tahap punya syarat serta penanggung jawab:

| # | Tahap | Aktor | Syarat untuk dicapai |
| --- | --- | --- | --- |
| 1 | Pendaftaran Baru | Klien | — |
| 2 | Skrining Kebutuhan | Admin | — |
| 3 | Menunggu Pembayaran | Klien & Admin | Ada tagihan pembayaran |
| 4 | Terverifikasi | Admin | Pembayaran diverifikasi |
| 5 | Terjadwal | Admin | Ada jadwal sesi |
| 6 | Pelaksanaan | Asisten Psikolog | Ada lembar tes |
| 7 | Pengolahan Data | Asisten & Psikolog | Semua lembar tes punya skor |
| 8 | Selesai | Psikolog | Laporan berstatus FINAL |

Penanda tahap tampil di halaman detail pendaftaran (admin), detail asesmen
(asisten), detail kasus (psikolog), dan halaman publik **Cek Status**.

## Isolasi data

- Pemisahan tugas dijaga oleh matriks hak akses di `src/lib/rbac.ts`.
- **Psikolog hanya dapat membuka kasus yang ditugaskan kepadanya.** Daftar
  pasien psikolog lain tidak terlihat dan URL kasus psikolog lain ditolak
  (dialihkan). Lihat `src/lib/auth/dal.ts` dan `src/app/(dalam)/dashboard/kasus/`.
- Setiap tindakan penting dicatat pada `audit_log`, termasuk percobaan akses
  yang ditolak.

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

### Akun demo (hasil seed)

Kata sandi semuanya `TabulaRasa123!`

| Email | Peran |
| --- | --- |
| `admin@tabularasa.id` | Administrator |
| `asisten@tabularasa.id` | Asisten Psikolog |
| `anugrah@tabularasa.id` | Psikolog — Anugrah Mujaddidah Kadim |
| `nadia@tabularasa.id` | Psikolog — Nadia Rafa Aziza |
| `aprilia@tabularasa.id` | Psikolog — Aprilia Anggorowati |
| `anissa@tabularasa.id` | Psikolog — Anissa Salsabila |
| `amanda@tabularasa.id` | Psikolog — Amanda Fadhia Feriqhalisyah |

> Ganti kata sandi dan `SESSION_SECRET` sebelum dipakai produksi.

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
  app/(publik)/        # situs publik
  app/(dalam)/dashboard/  # portal internal
  app/masuk/           # login
  app/actions/         # server actions
  lib/
    config.ts          # identitas, katalog, konten publik
    rbac.ts            # matriks hak akses & 3 zona
    auth/              # session, password, DAL
    prisma.ts          # Prisma Client + driver adapter
    gdrive.ts          # Google Drive (folder, unggah berkas)
    gsheets.ts         # Google Sheets (spreadsheet arsip)
    drive-arsip.ts     # orkestrasi arsip per pendaftaran
  components/          # UI publik, dashboard, ui
  proxy.ts             # pemeriksaan optimistik rute /dashboard
```
