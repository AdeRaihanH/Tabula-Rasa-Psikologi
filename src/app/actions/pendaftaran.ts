"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";

import { arsipkanPendaftaranBaru } from "@/lib/drive-arsip";
import { validasiJadwal } from "@/lib/jadwal";
import { hitungBiaya } from "@/lib/pembayaran";
import { prisma } from "@/lib/prisma";
import { buatNomorPendaftaran } from "@/lib/utils";

/**
 * Menjalankan pekerjaan latar setelah respons dikirim. Bila dipanggil di luar
 * konteks request (mis. skrip/CLI), pekerjaan dijalankan langsung tanpa
 * menggagalkan alur utama.
 */
function jalankanSetelahRespons(kerja: () => Promise<void>) {
  try {
    after(kerja);
  } catch {
    void kerja();
  }
}

/**
 * Revalidasi aman: kegagalan revalidasi tidak boleh menggagalkan pendaftaran
 * yang sudah tersimpan.
 */
function revalidasiAman(jalur: string) {
  try {
    revalidatePath(jalur);
  } catch {
    // Diabaikan — hanya berlaku di luar konteks request.
  }
}

export type Rekening = {
  bank: string | null;
  nomor: string | null;
  atasNama: string | null;
  instruksi: string | null;
};

export type HasilPendaftaran =
  | {
      ok: true;
      nomor: string;
      layanan: string;
      metode: "ONLINE" | "OFFLINE";
      biaya: number | null;
      rekening: Rekening;
      whatsapp: string | null;
      telepon: string | null;
      email: string | null;
    }
  | { ok: false; pesan: string; galat?: Record<string, string> };

function bersih(v: FormDataEntryValue | null) {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length > 0 ? s : null;
}

async function nomorBerikutnya() {
  const tahun = new Date().getFullYear();
  const awal = new Date(tahun, 0, 1);
  const jumlah = await prisma.pendaftaran.count({
    where: { createdAt: { gte: awal } },
  });
  return buatNomorPendaftaran(jumlah + 1);
}

export async function kirimPendaftaran(
  _sebelumnya: HasilPendaftaran | undefined,
  formData: FormData,
): Promise<HasilPendaftaran> {
  const nama = bersih(formData.get("nama"));
  const email = bersih(formData.get("email"));
  const telepon = bersih(formData.get("telepon"));
  const layananId = bersih(formData.get("layananId"));
  const psikologId = bersih(formData.get("psikologId"));
  const metode = bersih(formData.get("metode")) ?? "OFFLINE";
  const consent = formData.get("informedConsent") === "on";
  const tanggalPertemuan = bersih(formData.get("tanggalPertemuan"));
  const waktuPertemuan = bersih(formData.get("waktuPertemuan"));

  const galat: Record<string, string> = {};
  if (!nama) galat.nama = "Nama wajib diisi.";
  if (!email) galat.email = "Email wajib diisi.";
  else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    galat.email = "Format email tidak valid.";
  if (!telepon) galat.telepon = "Nomor telepon wajib diisi.";
  if (!layananId) galat.layananId = "Pilih layanan yang diinginkan.";
  if (!psikologId) galat.psikologId = "Pilih psikolog yang Anda inginkan.";
  if (!consent) galat.informedConsent = "Persetujuan wajib dicentang.";

  // Jadwal pertemuan tidak boleh di masa lalu (dicek ulang di server).
  const jadwal = validasiJadwal(tanggalPertemuan, waktuPertemuan);
  if (!jadwal.ok) galat.jadwal = jadwal.pesan;

  if (Object.keys(galat).length > 0) {
    return { ok: false, pesan: "Mohon lengkapi data yang ditandai.", galat };
  }

  try {
    const layanan = await prisma.layanan.findFirst({
      where: { id: layananId!, aktif: true },
    });
    if (!layanan) {
      return { ok: false, pesan: "Layanan tidak ditemukan atau sudah tidak aktif." };
    }

    const psikolog = await prisma.user.findFirst({
      where: { id: psikologId!, role: "PSIKOLOG", aktif: true },
      select: { id: true, nama: true },
    });
    if (!psikolog) {
      return {
        ok: false,
        pesan: "Psikolog yang dipilih tidak tersedia. Silakan pilih kembali.",
      };
    }

    const metodeDiminta: "ONLINE" | "OFFLINE" =
      metode === "ONLINE" ? "ONLINE" : "OFFLINE";
    if (!layanan.metode.includes(metodeDiminta)) {
      return {
        ok: false,
        pesan: `Layanan ${layanan.nama} tidak menyediakan metode ${
          metodeDiminta === "ONLINE" ? "daring" : "tatap muka"
        }. Silakan pilih metode lain.`,
      };
    }

    const tanggalLahirRaw = bersih(formData.get("tanggalLahir"));
    const nomor = await nomorBerikutnya();

    const klien = await prisma.klien.create({
      data: {
        nama: nama!,
        email: email!,
        telepon: telepon!,
        tanggalLahir: tanggalLahirRaw ? new Date(tanggalLahirRaw) : null,
        jenisKelamin: bersih(formData.get("jenisKelamin")),
        alamat: bersih(formData.get("alamat")),
        pekerjaan: bersih(formData.get("pekerjaan")),
        institusi: bersih(formData.get("institusi")),
      },
    });

    // Biaya ditentukan dari layanan + metode yang dipilih.
    const biaya = hitungBiaya(layanan, metodeDiminta);

    const pendaftaran = await prisma.pendaftaran.create({
      data: {
        nomor,
        klienId: klien.id,
        layananId: layanan.id,
        psikologId: psikolog.id,
        metode: metodeDiminta,
        kebutuhan: (() => {
          let keb = bersih(formData.get("kebutuhan")) ?? "";
          if (tanggalPertemuan || waktuPertemuan) {
            keb += `\n\n[Preferensi Jadwal]\nTanggal: ${tanggalPertemuan || "-"}\nWaktu: ${waktuPertemuan || "-"}`;
          }
          return keb.trim() || null;
        })(),
        institusi: bersih(formData.get("institusi")),
        informedConsent: consent,
        sumber: "web",
        status: "BARU",
      },
    });

    // Tagihan dibuat otomatis bila harga layanan sudah ditetapkan, supaya
    // klien langsung tahu nominal yang harus dibayar.
    if (biaya !== null && biaya > 0) {
      await prisma.pembayaran.create({
        data: {
          pendaftaranId: pendaftaran.id,
          jumlah: biaya,
          metode: "transfer",
          status: "MENUNGGU",
          catatan: `Tagihan otomatis: ${layanan.nama} (${metodeDiminta === "ONLINE" ? "daring" : "tatap muka"})`,
        },
      });
    }

    const set = await prisma.pengaturanSitus.findUnique({
      where: { id: "utama" },
    });

    await prisma.auditLog.create({
      data: {
        aksi: "PENDAFTARAN_BARU",
        entitas: "Pendaftaran",
        entitasId: pendaftaran.id,
        detail: `Pendaftaran daring ${nomor} untuk ${layanan.nama} — psikolog ${psikolog.nama}${
          biaya ? ` — tagihan ${biaya}` : ""
        }`,
      },
    });

    // Arsip digital (folder + spreadsheet) dijalankan setelah respons dikirim
    // agar pengguna tidak menunggu proses Google API.
    const idPendaftaran = pendaftaran.id;
    jalankanSetelahRespons(async () => {
      await arsipkanPendaftaranBaru(idPendaftaran);
    });

    revalidasiAman("/dashboard/pendaftaran");

    return {
      ok: true,
      nomor,
      layanan: layanan.nama,
      metode: metodeDiminta,
      biaya,
      rekening: {
        bank: set?.bankNama ?? null,
        nomor: set?.bankNomor ?? null,
        atasNama: set?.bankAtasNama ?? null,
        instruksi: set?.instruksiPembayaran ?? null,
      },
      whatsapp: set?.whatsapp ?? null,
      telepon: set?.telepon ?? null,
      email: set?.email ?? null,
    };
  } catch (e) {
    console.error("[kirimPendaftaran] gagal menyimpan pendaftaran:", e);
    return {
      ok: false,
      pesan: "Terjadi kesalahan saat menyimpan pendaftaran. Silakan coba lagi.",
    };
  }
}

export type HasilCekStatus =
  | {
      ok: true;
      nomor: string;
      layanan: string;
      status: string;
      tanggal: string;
      psikolog: string | null;
      jadwal: string | null;
      metode: "ONLINE" | "OFFLINE";
      biaya: number | null;
      pembayaranStatus: string | null;
      rekening: Rekening;
      whatsapp: string | null;
      email: string | null;
    }
  | { ok: false; pesan: string }
  | undefined;

/**
 * Pemeriksaan status untuk klien. Memerlukan nomor pendaftaran DAN email yang
 * cocok, sehingga nomor saja tidak cukup untuk menebak data orang lain.
 * Hanya mengembalikan informasi administratif minimal (Zona 1) beserta
 * rincian pembayaran agar klien tahu nominal yang harus dibayar.
 */
export async function cekStatusPendaftaran(
  _sebelumnya: HasilCekStatus,
  formData: FormData,
): Promise<HasilCekStatus> {
  const nomor = bersih(formData.get("nomor"))?.toUpperCase();
  const email = bersih(formData.get("email"))?.toLowerCase();
  if (!nomor || !email) {
    return { ok: false, pesan: "Nomor pendaftaran dan email wajib diisi." };
  }

  try {
    const [p, set] = await Promise.all([
      prisma.pendaftaran.findFirst({
        where: { nomor, klien: { email } },
        include: {
          layanan: { select: { nama: true } },
          psikolog: { select: { nama: true } },
          jadwal: { orderBy: { mulai: "asc" }, take: 1, select: { mulai: true } },
          pembayaran: {
            orderBy: { createdAt: "desc" },
            select: { jumlah: true, status: true },
          },
        },
      }),
      prisma.pengaturanSitus.findUnique({ where: { id: "utama" } }),
    ]);

    if (!p) {
      return {
        ok: false,
        pesan: "Data tidak ditemukan. Periksa kembali nomor pendaftaran dan email Anda.",
      };
    }

    const bayar = p.pembayaran[0] ?? null;

    return {
      ok: true,
      nomor: p.nomor,
      layanan: p.layanan.nama,
      status: p.status,
      tanggal: p.createdAt.toISOString(),
      psikolog: p.psikolog?.nama ?? null,
      jadwal: p.jadwal[0]?.mulai.toISOString() ?? null,
      metode: p.metode,
      biaya: bayar ? Number(bayar.jumlah) : null,
      pembayaranStatus: bayar?.status ?? null,
      rekening: {
        bank: set?.bankNama ?? null,
        nomor: set?.bankNomor ?? null,
        atasNama: set?.bankAtasNama ?? null,
        instruksi: set?.instruksiPembayaran ?? null,
      },
      whatsapp: set?.whatsapp ?? null,
      email: set?.email ?? null,
    };
  } catch {
    return { ok: false, pesan: "Terjadi kesalahan. Silakan coba lagi." };
  }
}
