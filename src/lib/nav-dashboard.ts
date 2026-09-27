import type { Role } from "@/lib/rbac";

export type ItemNav = {
  href: string;
  label: string;
  zona?: "ZONA_1" | "ZONA_2" | "ZONA_3";
  ikon: string;
};

export const navDashboard: Record<Role, ItemNav[]> = {
  ADMIN: [
    { href: "/dashboard", label: "Ringkasan", ikon: "ringkasan" },
    { href: "/dashboard/pendaftaran", label: "Pendaftaran", zona: "ZONA_1", ikon: "berkas" },
    { href: "/dashboard/klien", label: "Data Klien", zona: "ZONA_1", ikon: "orang" },
    { href: "/dashboard/jadwal", label: "Jadwal Sesi", zona: "ZONA_1", ikon: "kalender" },
    { href: "/dashboard/psikolog", label: "Tim Psikolog", ikon: "orang" },
    { href: "/dashboard/layanan", label: "Katalog Layanan", ikon: "daftar" },
    { href: "/dashboard/arsip", label: "Pengarsipan", ikon: "arsip" },
    { href: "/dashboard/pengguna", label: "Pengguna & Peran", ikon: "orang" },
    { href: "/dashboard/audit", label: "Log Audit", ikon: "perisai" },
    { href: "/dashboard/pengaturan", label: "Pengaturan Situs", ikon: "atur" },
  ],
  ASISTEN: [
    { href: "/dashboard/asesmen", label: "Lembar Tes", zona: "ZONA_2", ikon: "lembar" },
    { href: "/dashboard/jadwal", label: "Jadwal Sesi", zona: "ZONA_1", ikon: "kalender" },
    { href: "/dashboard/alattes", label: "Master Alat Tes", zona: "ZONA_2", ikon: "daftar" },
    { href: "/dashboard/profil", label: "Profil Saya", ikon: "orang" },
  ],
  PSIKOLOG: [
    { href: "/dashboard/kasus", label: "Kasus Saya", zona: "ZONA_3", ikon: "berkas" },
    { href: "/dashboard/jadwal", label: "Jadwal Sesi", zona: "ZONA_1", ikon: "kalender" },
    { href: "/dashboard/profil", label: "Profil Saya", ikon: "orang" },
  ],
  KLIEN: [
    { href: "/dashboard/riwayat", label: "Riwayat Pendaftaran", ikon: "berkas" },
    { href: "/dashboard/profil", label: "Profil Saya", ikon: "orang" },
  ],
};

export const warnaZona: Record<string, string> = {
  ZONA_1: "var(--color-zona1)",
  ZONA_2: "var(--color-zona2)",
  ZONA_3: "var(--color-zona3)",
};
