export type Zona = "ZONA_1" | "ZONA_2" | "ZONA_3";

export const infoZona: Record<
  Zona,
  { nama: string; pemegang: string; isi: string; warna: string }
> = {
  ZONA_1: {
    nama: "Zona 1 — Administratif",
    pemegang: "Admin",
    isi: "Data diri klien, kontak, jadwal sesi",
    warna: "#2563eb",
  },
  ZONA_2: {
    nama: "Zona 2 — Operasional Asesmen",
    pemegang: "Asisten Psikolog",
    isi: "Konfirmasi pelaksanaan tes, catatan pelaksanaan",
    warna: "#b45309",
  },
  ZONA_3: {
    nama: "Zona 3 — Hasil & Interpretasi",
    pemegang: "Psikolog",
    isi: "Laporan hasil, interpretasi, rekomendasi",
    warna: "#0f766e",
  },
};

export type Role = "ADMIN" | "ASISTEN" | "PSIKOLOG" | "KLIEN";

/**
 * Matriks hak akses. Setiap kemampuan dipetakan ke peran yang memilikinya.
 * Prinsip: pemisahan tugas (segregation of duties) — admin tidak menangani
 * pelaksanaan tes, asisten tidak membaca interpretasi, psikolog tidak mengubah
 * data administratif klien.
 */
export const hakAkses = {
  // Zona 1 — hanya admin. Pendaftaran memuat data diri klien, jadi psikolog &
  // asisten tidak diberi akses agar isolasi antar-psikolog tetap terjaga.
  "klien:lihat": ["ADMIN"],
  "klien:kelola": ["ADMIN"],
  "jadwal:lihat": ["ADMIN", "ASISTEN", "PSIKOLOG"],
  "jadwal:kelola": ["ADMIN"],
  "pendaftaran:lihat": ["ADMIN"],
  "pendaftaran:kelola": ["ADMIN"],
  "pembayaran:verifikasi": ["ADMIN"],

  // Zona 2 — hanya asisten. Psikolog melihat pelaksanaan tes lewat halaman
  // kasus miliknya sendiri (bukan daftar asesmen seluruh kasus).
  "lembartes:lihat": ["ASISTEN"],
  "lembartes:kelola": ["ASISTEN"],

  // Zona 3
  "laporan:lihat": ["PSIKOLOG"],
  "laporan:kelola": ["PSIKOLOG"],

  // Portal klien — hanya data milik sendiri (dijaga di DAL)
  "pendaftaran:milik": ["KLIEN"],
  "pembayaran:unggah": ["KLIEN"],

  // Lintas
  "audit:lihat": ["ADMIN"],
  "pengguna:kelola": ["ADMIN"],
  "layanan:kelola": ["ADMIN"],
  "pengaturan:kelola": ["ADMIN"],
  "arsip:kelola": ["ADMIN"],
  "profil:kelola": ["PSIKOLOG", "ADMIN", "KLIEN"],
  "psikolog:kelola": ["ADMIN"],
} as const satisfies Record<string, readonly Role[]>;

export type Kemampuan = keyof typeof hakAkses;

export function boleh(role: Role, kemampuan: Kemampuan): boolean {
  return (hakAkses[kemampuan] as readonly Role[]).includes(role);
}

/** Rumah dashboard default per peran. */
export function rumahDashboard(role: Role): string {
  switch (role) {
    case "ADMIN":
      return "/dashboard";
    case "ASISTEN":
      return "/dashboard/asesmen";
    case "PSIKOLOG":
      return "/dashboard/kasus";
    case "KLIEN":
      return "/dashboard/riwayat";
    default:
      return "/dashboard";
  }
}
