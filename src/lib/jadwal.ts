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
 * Validasi jadwal pertemuan.
 *
 * Jadwal WAJIB dipilih saat mendaftar karena seluruh tes dilaksanakan Tatap
 * Muka di biro — jadwal inilah yang dipakai admin, asisten, dan psikolog.
 * Tanggal dan waktu harus lengkap serta tidak boleh berada di masa lalu.
 */
export function validasiJadwal(
  tanggal: string | null,
  waktu: string | null,
  sekarang: Date = new Date(),
): HasilValidasiJadwal {
  if (!tanggal && !waktu) {
    return {
      ok: false,
      pesan: "Pilih tanggal dan waktu kedatangan Anda ke biro.",
    };
  }

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

/** Jam & menit dalam WIB ("07.00"). */
export function jamWIB(tanggal: Date) {
  return nilaiDatetimeLokal(tanggal).split("T")[1].replace(":", ".");
}

/** Tanggal dalam WIB ("YYYY-MM-DD"). */
export function tanggalWIB(tanggal: Date) {
  return bagianTanggal(tanggal);
}

/**
 * Label hari relatif terhadap hari ini menurut WIB: "hari ini", "besok",
 * "lusa", atau tanggal panjang bila lebih jauh.
 */
export function labelHariWIB(tanggal: Date, sekarang: Date = new Date()) {
  const hari = new Date(`${bagianTanggal(tanggal)}T00:00:00Z`);
  const kini = new Date(`${bagianTanggal(sekarang)}T00:00:00Z`);
  const selisih = Math.round((hari.getTime() - kini.getTime()) / 86_400_000);
  if (selisih === 0) return "hari ini";
  if (selisih === 1) return "besok";
  if (selisih === 2) return "lusa";
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: ZONA_WAKTU,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(tanggal);
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

/**
 * True bila baris jadwal pernah diubah admin setelah dibuat otomatis.
 *
 * Baris jadwal dibuat sekali dari pilihan pendaftar (`createdAt`), dan
 * satu-satunya penulis ulang adalah `buatJadwal` admin — sehingga
 * `updatedAt > createdAt` berarti admin pernah menyentuh jadwal tersebut
 * (menggeser jam, menetapkan ruangan, atau mengganti psikolog). Pemeriksaan
 * teks `catatan` dipakai sebagai jaring pengaman untuk baris yang dibuat
 * sebelum penanda ini ada.
 */
export function jadwalDiubahAdmin(jadwal: {
  createdAt: Date | string;
  updatedAt: Date | string;
  catatan?: string | null;
}): boolean {
  if (
    typeof jadwal.catatan === "string" &&
    /diubah admin|ditetapkan admin|dikoreksi|disesuaikan/i.test(jadwal.catatan)
  ) {
    return true;
  }
  return (
    new Date(jadwal.updatedAt).getTime() > new Date(jadwal.createdAt).getTime()
  );
}

/**
 * True bila jam jadwal BERGESER dari pilihan awal pendaftar.
 *
 * Lebih spesifik daripada `jadwalDiubahAdmin`: hanya true bila waktu mulai
 * benar-benar berbeda dari preferensi tanggal/waktu saat mendaftar (atau bila
 * tidak ada acuan preferensi sama sekali padahal baris pernah disentuh —
 * kasus baris lama). Bila admin hanya menetapkan ruangan tanpa menggeser jam,
 * hasilnya false sehingga label "Sesuai jadwal pilihan Anda" untuk jamnya
 * tetap boleh tampil berdampingan dengan highlight ruangan.
 */
export function jadwalBergeserDariPreferensi(
  mulai: Date | string,
  preferensi: { tanggal: string; waktu: string } | null,
  fallback = true,
): boolean {
  if (!preferensi) return fallback;
  const awalJam = preferensi.waktu.split(" - ")[0]?.trim();
  if (!awalJam) return fallback;
  const m = new Date(mulai);
  return tanggalWIB(m) !== preferensi.tanggal || jamWIB(m) !== awalJam;
}

/**
 * True bila klien perlu diperingatkan bahwa JAM sesi berubah (nada "diubah").
 *
 * Nada diambil dari EDIT TERAKHIR admin (ditulis `buatJadwal` ke `catatan`):
 * - ada tanda "Jadwal diubah admin — semula …" → true (edit terakhir
 *   menggeser jam);
 * - ada tanda info ("Ruangan ditetapkan admin" / "Info sesi diperbarui") →
 *   false meski waktu masih berbeda dari preferensi: edit terakhir hanya
 *   melengkapi info (mis. ruangan), jadi yang ditonjolkan adalah ruangannya,
 *   bukan klaim "jadwal diubah";
 * - tanpa tanda (baris warisan yang telanjur disentuh sebelum penanda ini
 *   ada) → bandingkan waktu dengan preferensi awal pendaftar; bila tidak ada
 *   preferensi sama sekali, sentuhan apa pun dianggap perubahan (aman).
 */
export function butuhPeringatanJam(
  jadwal: {
    mulai: Date | string;
    createdAt: Date | string;
    updatedAt: Date | string;
    catatan?: string | null;
  },
  preferensi: { tanggal: string; waktu: string } | null,
): boolean {
  const c = jadwal.catatan ?? "";
  if (/jadwal diubah admin — semula/i.test(c)) return true;
  if (
    /ruangan ditetapkan admin|ruangan dikosongkan|info sesi diperbarui/i.test(c)
  ) {
    return false;
  }
  const disentuh =
    new Date(jadwal.updatedAt).getTime() >
    new Date(jadwal.createdAt).getTime();
  if (!preferensi) return disentuh;
  return disentuh && jadwalBergeserDariPreferensi(jadwal.mulai, preferensi, true);
}

/**
 * True bila jadwal masih murni pilihan pendaftar (belum pernah diubah admin).
 * Dipakai agar label "Sesuai jadwal yang Anda pilih saat mendaftar" tidak
 * tampil lagi setelah admin menggeser jam — kasus yang selama ini
 * menyesatkan karena `catatan` lama tidak pernah diperbarui saat edit.
 */
export function jadwalMasihPilihanPendaftar(jadwal: {
  createdAt: Date | string;
  updatedAt: Date | string;
  catatan?: string | null;
}): boolean {
  if (jadwalDiubahAdmin(jadwal)) return false;
  return Boolean(jadwal.catatan?.includes("pilihan pendaftar"));
}
