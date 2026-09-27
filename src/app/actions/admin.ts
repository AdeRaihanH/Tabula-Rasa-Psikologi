"use server";

import { revalidatePath } from "next/cache";

import { majuOtomatis } from "@/lib/alur-otomatis";
import { wajibKemampuan } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";

async function catat(
  userId: string,
  aksi: string,
  entitas: string,
  entitasId: string,
  detail: string,
) {
  await prisma.auditLog.create({
    data: { userId, aksi, entitas, entitasId, detail },
  });
}

export async function tetapkanPsikolog(formData: FormData) {
  const sesi = await wajibKemampuan("pendaftaran:kelola");
  const id = String(formData.get("id") ?? "");
  const psikologId = String(formData.get("psikologId") ?? "");
  if (!id) return;

  const p = await prisma.pendaftaran.update({
    where: { id },
    data: { psikologId: psikologId || null },
    include: {
      klien: { select: { nama: true } },
      psikolog: { select: { nama: true } },
    },
  });

  await catat(
    sesi.userId,
    "TETAPKAN_PSIKOLOG",
    "Pendaftaran",
    id,
    `${p.nomor} (${p.klien.nama}) → ${p.psikolog?.nama ?? "belum ditetapkan"}`,
  );

  revalidatePath(`/dashboard/pendaftaran/${id}`);
  revalidatePath("/dashboard/pendaftaran");
}

export async function verifikasiPembayaran(formData: FormData) {
  const sesi = await wajibKemampuan("pembayaran:verifikasi");
  const id = String(formData.get("id") ?? "");
  const keputusan = String(formData.get("keputusan") ?? "");
  const catatan = String(formData.get("catatan") ?? "").trim() || null;
  if (!id) return;

  const bayar = await prisma.pembayaran.update({
    where: { id },
    data: {
      status: keputusan === "TERIMA" ? "TERVERIFIKASI" : "DITOLAK",
      catatan,
      diverifikasiOlehId: sesi.userId,
      diverifikasiPada: new Date(),
    },
  });

  if (keputusan === "TERIMA") {
    // Tahap 4 — pembayaran sah.
    await majuOtomatis(bayar.pendaftaranId, "TERVERIFIKASI");
  }

  await catat(
    sesi.userId,
    keputusan === "TERIMA" ? "VERIFIKASI_PEMBAYARAN" : "TOLAK_PEMBAYARAN",
    "Pembayaran",
    id,
    `Pembayaran ${bayar.jumlah.toString()} diverifikasi sebagai ${
      keputusan === "TERIMA" ? "sah" : "ditolak"
    }`,
  );

  revalidatePath(`/dashboard/pendaftaran/${bayar.pendaftaranId}`);
  revalidatePath("/dashboard/pendaftaran");
  revalidatePath("/dashboard");
}

export async function catatPembayaran(formData: FormData) {
  const sesi = await wajibKemampuan("pembayaran:verifikasi");
  const pendaftaranId = String(formData.get("pendaftaranId") ?? "");
  const jumlah = Number(formData.get("jumlah") ?? 0);
  const metode = String(formData.get("metode") ?? "transfer");
  const catatan = String(formData.get("catatan") ?? "").trim() || null;
  if (!pendaftaranId || !jumlah) return;

  await prisma.pembayaran.create({
    data: {
      pendaftaranId,
      jumlah,
      metode,
      catatan,
      status: "MENUNGGU",
    },
  });

  // Tahap 3 — tagihan diterbitkan.
  await majuOtomatis(pendaftaranId, "MENUNGGU_PEMBAYARAN");

  await catat(
    sesi.userId,
    "CATAT_PEMBAYARAN",
    "Pendaftaran",
    pendaftaranId,
    `Tagihan pembayaran ${jumlah} dicatat`,
  );

  revalidatePath(`/dashboard/pendaftaran/${pendaftaranId}`);
  revalidatePath("/dashboard/pendaftaran");
  revalidatePath("/dashboard");
}

export async function buatJadwal(formData: FormData) {
  const sesi = await wajibKemampuan("jadwal:kelola");
  const pendaftaranId = String(formData.get("pendaftaranId") ?? "");
  const psikologId = String(formData.get("psikologId") ?? "");
  const mulai = String(formData.get("mulai") ?? "");
  const selesai = String(formData.get("selesai") ?? "");
  const metode = String(formData.get("metode") ?? "OFFLINE");
  const lokasi = String(formData.get("lokasi") ?? "").trim() || null;
  const tautan = String(formData.get("tautan") ?? "").trim() || null;
  if (!pendaftaranId || !psikologId || !mulai || !selesai) return;

  // Bila klien sudah memilih jadwal saat mendaftar, jadwal itu DIPERBARUI
  // (bukan ditambah), supaya tidak ada sesi ganda untuk satu pendaftaran.
  const jadwalAda = await prisma.jadwalSesi.findFirst({
    where: { pendaftaranId },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  const dataJadwal = {
    psikologId,
    mulai: new Date(mulai),
    selesai: new Date(selesai),
    metode: (metode === "ONLINE" ? "ONLINE" : "OFFLINE") as "ONLINE" | "OFFLINE",
    lokasi,
    tautan,
    status: "TERJADWAL" as const,
  };

  const sesiBaru = jadwalAda
    ? await prisma.jadwalSesi.update({
        where: { id: jadwalAda.id },
        data: dataJadwal,
      })
    : await prisma.jadwalSesi.create({
        data: { pendaftaranId, ...dataJadwal },
      });

  await prisma.pendaftaran.update({
    where: { id: pendaftaranId },
    data: { psikologId },
  });

  // Tahap 5 — sesi sudah dijadwalkan.
  await majuOtomatis(pendaftaranId, "TERJADWAL");

  await catat(
    sesi.userId,
    jadwalAda ? "PERBARUI_JADWAL" : "BUAT_JADWAL",
    "JadwalSesi",
    sesiBaru.id,
    `Jadwal sesi ${new Date(mulai).toLocaleString("id-ID")} ${
      jadwalAda ? "diperbarui" : "dibuat"
    }`,
  );

  revalidatePath(`/dashboard/pendaftaran/${pendaftaranId}`);
  revalidatePath("/dashboard/jadwal");
  revalidatePath("/dashboard/asesmen");
  revalidatePath("/dashboard/kasus");
  revalidatePath("/dashboard");
}

export async function ubahStatusJadwal(formData: FormData) {
  const sesi = await wajibKemampuan("jadwal:kelola");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !status) return;

  await prisma.jadwalSesi.update({
    where: { id },
    data: {
      status: status as "TERJADWAL" | "BERLANGSUNG" | "SELESAI" | "DIBATALKAN",
    },
  });

  await catat(sesi.userId, "UBAH_STATUS_JADWAL", "JadwalSesi", id, `Status → ${status}`);
  revalidatePath("/dashboard/jadwal");
}
