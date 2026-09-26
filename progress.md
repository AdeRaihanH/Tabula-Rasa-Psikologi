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
