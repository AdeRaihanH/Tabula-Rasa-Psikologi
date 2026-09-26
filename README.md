# Tabula Rasa — Web Biro Psikologi

Aplikasi web biro psikologi: situs publik untuk klien/korporasi dan portal
internal dengan **tiga zona kerahasiaan data**.

## Fitur

**Situs publik**

- Beranda (gaya Mindset Psychology), katalog layanan 2 kategori, detail layanan,
  biaya, tim psikolog, alur layanan, sistem kerahasiaan, FAQ, kontak, dan cek
  status pendaftaran.
- Formulir pendaftaran daring (Zona 1) dengan informed consent.
- Palet warna *earth tone* (krem, terracotta, pasir, zaitun).

**Katalog layanan**

| Kategori | Layanan |
| --- | --- |
| A. Tes & Asesmen | Tes IQ · Tes Minat Bakat · Tes Kesiapan Sekolah |
| B. Untuk Perusahaan (B2B) | Psikologi Industri & Organisasi (PIO) |

**Arsip digital (Google Drive)** — opsional

- Setiap pendaftaran mendapat satu folder Drive berisi ringkasan pendaftaran.
- Unggah bukti pembayaran dan dokumen kasus langsung dari dashboard.
- Bila kredensial Drive belum diisi, fitur ini nonaktif dan aplikasi tetap jalan.

**Portal internal** (login email + kata sandi, sesi JWT httpOnly 8 jam)

| Peran | Zona | Cakupan |
| --- | --- | --- |
| Admin | Zona 1 | Data diri klien, pendaftaran, jadwal, verifikasi pembayaran, katalog layanan, pengarsipan, pengguna & peran, pengaturan situs, log audit |
| Asisten Psikolog | Zona 2 | Lembar tes, skor mentah, master alat tes |
| Psikolog | Zona 3 | Laporan hasil, interpretasi, rekomendasi — **hanya kasus miliknya** (Zona 2 hanya baca) |

Semua peran memiliki halaman **Profil Saya** untuk memperbarui data diri dan
kata sandi. Psikolog juga mengelola profil publiknya.

Alur pendaftaran mengikuti 8 tahap: pendaftaran → skrining → persetujuan &
pembayaran → penjadwalan → pelaksanaan → pengolahan data → penyerahan hasil →
evaluasi & pengarsipan.

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

   > Untuk Google Drive: buat *service account*, aktifkan Google Drive API,
   > bagikan folder tujuan ke email service account dengan akses **Editor**,
   > lalu isi `GOOGLE_DRIVE_FOLDER_ID` dengan ID folder tersebut.

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

### Akun demo (hasil seed)

Kata sandi semuanya `TabulaRasa123!`

| Email | Peran |
| --- | --- |
| `admin@tabularasa.id` | Administrator |
| `asisten@tabularasa.id` | Asisten Psikolog |
| `psikolog1@tabularasa.id` | Psikolog |
| `psikolog2@tabularasa.id` | Psikolog |
| `psikolog3@tabularasa.id` | Psikolog |

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
3. Terapkan migrasi ke database produksi dari mesin lokal:

   ```bash
   npx prisma migrate deploy
   npx prisma db seed   # opsional
   ```

4. Deploy.

## Struktur

```
prisma/
  schema.prisma        # model + enum (3 zona)
  seed.ts              # data awal: akun, katalog layanan, alat tes
src/
  app/(publik)/        # situs publik
  app/(dalam)/dashboard/  # portal internal
  app/masuk/           # login
  app/actions/         # server actions
  lib/                 # config, rbac, auth (session/dal), prisma
  components/          # UI publik, dashboard, ui
  proxy.ts             # pemeriksaan optimistik rute /dashboard
```
