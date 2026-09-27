/**
 * Aturan jadwal pertemuan. Dipakai bersama oleh formulir (klien) dan server
 * action agar tidak ada jadwal yang sudah lewat.
 *
 * Zona waktu dipatok ke WIB supaya "hari ini" dan "jam sekarang" tidak
 * bergeser mengikuti zona waktu server (mis. UTC saat deploy ke Vercel).
 */

export const ZONA_WAKTU = "Asia/Jakarta";

export const SLOT_WAKTU = [
  { label: "07.00 - 09.00", mulaiJam: 7, selesaiJam: 9 },
  { label: "12.00 - 14.00", mulaiJam: 12, selesaiJam: 14 },
  { label: "15.00 - 17.00", mulaiJam: 15, selesaiJam: 17 },
] as const;

export type SlotWaktu = (typeof SLOT_WAKTU)[number];

function bagianTanggal(sekarang: Date) {
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone: ZONA_WAKTU,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(sekarang);
  const ambil = (tipe: string) => p.find((x) => x.type === tipe)?.value ?? "";
  return `${ambil("year")}-${ambil("month")}-${ambil("day")}`;
}

/** Tanggal hari ini menurut WIB, format YYYY-MM-DD (siap dipakai input date). */
export function tanggalHariIni(sekarang: Date = new Date()) {
  return bagianTanggal(sekarang);
}

/** Jam sekarang (0-23) menurut WIB. */
export function jamSekarang(sekarang: Date = new Date()) {
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone: ZONA_WAKTU,
    hour: "2-digit",
    hour12: false,
  }).format(sekarang);
  return Number(p);
}

/** True bila tanggal berformat YYYY-MM-DD dan benar-benar ada. */
export function tanggalValid(tanggal: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) return false;
  const [y, m, d] = tanggal.split("-").map(Number);
  const uji = new Date(Date.UTC(y, m - 1, d));
  return (
    uji.getUTCFullYear() === y &&
    uji.getUTCMonth() === m - 1 &&
    uji.getUTCDate() === d
  );
}

/**
 * Slot waktu yang sudah tidak bisa dipilih pada tanggal tertentu.
 * - Tanggal mendatang  → tidak ada yang terlewat.
 * - Tanggal lampau     → semua slot terlewat.
 * - Hari ini           → slot terlewat bila jam mulai sudah berlalu.
 */
export function slotTerlewat(
  tanggal: string,
  sekarang: Date = new Date(),
): string[] {
  if (!tanggalValid(tanggal)) return SLOT_WAKTU.map((s) => s.label);

  const hariIni = tanggalHariIni(sekarang);
  if (tanggal > hariIni) return [];
  if (tanggal < hariIni) return SLOT_WAKTU.map((s) => s.label);

  const jam = jamSekarang(sekarang);
  return SLOT_WAKTU.filter((s) => jam > s.mulaiJam).map((s) => s.label);
}

export type HasilValidasiJadwal = { ok: true } | { ok: false; pesan: string };

/**
 * Validasi jadwal pertemuan. Kedua kolom bersifat opsional, tetapi bila salah
 * satu diisi maka keduanya wajib, dan tidak boleh berada di masa lalu.
 */
export function validasiJadwal(
  tanggal: string | null,
  waktu: string | null,
  sekarang: Date = new Date(),
): HasilValidasiJadwal {
  if (!tanggal && !waktu) return { ok: true };

  if (!tanggal) {
    return { ok: false, pesan: "Pilih tanggal pertemuan terlebih dahulu." };
  }
  if (!waktu) {
    return { ok: false, pesan: "Pilih waktu kedatangan terlebih dahulu." };
  }
  if (!tanggalValid(tanggal)) {
    return { ok: false, pesan: "Format tanggal pertemuan tidak valid." };
  }

  const hariIni = tanggalHariIni(sekarang);
  if (tanggal < hariIni) {
    return {
      ok: false,
      pesan: "Tanggal pertemuan sudah lewat. Silakan pilih tanggal lain.",
    };
  }

  const slot = SLOT_WAKTU.find((s) => s.label === waktu);
  if (!slot) {
    return { ok: false, pesan: "Waktu kedatangan tidak dikenali." };
  }

  if (tanggal === hariIni && jamSekarang(sekarang) > slot.mulaiJam) {
    return {
      ok: false,
      pesan: `Waktu ${waktu} sudah lewat. Silakan pilih waktu lain.`,
    };
  }

  return { ok: true };
}

/**
 * Nilai untuk `<input type="datetime-local">` menurut WIB (`YYYY-MM-DDTHH:mm`).
 * Dipakai agar admin melihat jadwal yang sudah ada pada formulirnya.
 */
export function nilaiDatetimeLokal(tanggal: Date) {
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone: ZONA_WAKTU,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(tanggal);
  const ambil = (tipe: string) => p.find((x) => x.type === tipe)?.value ?? "";
  const jam = ambil("hour") === "24" ? "00" : ambil("hour");
  return `${ambil("year")}-${ambil("month")}-${ambil("day")}T${jam}:${ambil("minute")}`;
}

/**
 * Preferensi hari/jam yang ditulis pendaftar pada formulir
 * ("[Preferensi Jadwal]\nTanggal: ...\nWaktu: ..."). Dipakai untuk membuat
 * jadwal otomatis dan sebagai tampilan cadangan bila baris jadwal belum ada.
 */
export function parsePreferensiJadwal(kebutuhan: string | null | undefined): {
  tanggal: string;
  waktu: string;
} | null {
  if (!kebutuhan || !kebutuhan.includes("[Preferensi Jadwal]")) return null;
  const tanggal = kebutuhan.match(/^Tanggal:\s*(.+)$/m)?.[1]?.trim();
  const waktu = kebutuhan.match(/^Waktu:\s*(.+)$/m)?.[1]?.trim();
  if (!tanggal || !waktu || tanggal === "-" || waktu === "-") return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) return null;
  if (!SLOT_WAKTU.some((s) => s.label === waktu)) return null;
  return { tanggal, waktu };
}
