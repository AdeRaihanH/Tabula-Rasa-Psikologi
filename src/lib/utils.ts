export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatRupiah(nilai: number | string | null | undefined) {
  if (nilai === null || nilai === undefined) return "—";
  const angka = typeof nilai === "string" ? Number(nilai) : nilai;
  if (Number.isNaN(angka)) return "—";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(angka);
}

export function formatTanggal(tanggal: Date | string | null | undefined) {
  if (!tanggal) return "—";
  const d = typeof tanggal === "string" ? new Date(tanggal) : tanggal;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function formatTanggalWaktu(tanggal: Date | string | null | undefined) {
  if (!tanggal) return "—";
  const d = typeof tanggal === "string" ? new Date(tanggal) : tanggal;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function buatNomorPendaftaran(urutan: number) {
  const tahun = new Date().getFullYear();
  return `TR-${tahun}-${String(urutan).padStart(5, "0")}`;
}

export function inisial(nama: string) {
  return nama
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((k) => k[0]?.toUpperCase() ?? "")
    .join("");
}
