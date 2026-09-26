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
    isi: "Lembar tes, skor mentah, catatan pelaksanaan",
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
 * Prinsip: pemisahan tugas (segregation of duties) — admin tidak membaca isi
 * alat tes, asisten tidak membaca interpretasi, psikolog tidak mengubah data
 * administratif klien.
 */
export const hakAkses = {
  // Zona 1
  "klien:lihat": ["ADMIN"],
  "klien:kelola": ["ADMIN"],
  "jadwal:lihat": ["ADMIN", "ASISTEN", "PSIKOLOG"],
  "jadwal:kelola": ["ADMIN"],
  "pendaftaran:lihat": ["ADMIN", "ASISTEN", "PSIKOLOG"],
  "pendaftaran:kelola": ["ADMIN"],
  "pembayaran:verifikasi": ["ADMIN"],

  // Zona 2
  "lembartes:lihat": ["ASISTEN", "PSIKOLOG"],
  "lembartes:kelola": ["ASISTEN"],
  "skor:lihat": ["ASISTEN", "PSIKOLOG"],
  "skor:kelola": ["ASISTEN"],
  "alattes:kelola": ["ASISTEN", "ADMIN"],

  // Zona 3
  "laporan:lihat": ["PSIKOLOG"],
  "laporan:kelola": ["PSIKOLOG"],

  // Lintas
  "audit:lihat": ["ADMIN"],
  "pengguna:kelola": ["ADMIN"],
  "layanan:kelola": ["ADMIN"],
  "pengaturan:kelola": ["ADMIN"],
  "arsip:kelola": ["ADMIN"],
  "profil:kelola": ["PSIKOLOG", "ADMIN"],
  "psikolog:kelola": ["ADMIN"],
} as const satisfies Record<string, readonly Role[]>;

export type Kemampuan = keyof typeof hakAkses;

export function boleh(role: Role, kemampuan: Kemampuan): boolean {
  return (hakAkses[kemampuan] as readonly Role[]).includes(role);
}

/** Zona yang boleh diakses sebuah peran. */
export function zonaUntuk(role: Role): Zona[] {
  const zona: Zona[] = [];
  if (boleh(role, "klien:lihat") || boleh(role, "jadwal:kelola")) zona.push("ZONA_1");
  if (boleh(role, "lembartes:lihat")) zona.push("ZONA_2");
  if (boleh(role, "laporan:lihat")) zona.push("ZONA_3");
  return zona;
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
    default:
      return "/dashboard";
  }
}
