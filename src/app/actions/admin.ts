"use server";

import { revalidatePath } from "next/cache";

import { wajibKemampuan } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import type { StatusPendaftaran } from "@/generated/prisma/enums";

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

export async function ubahStatusPendaftaran(formData: FormData) {
  const sesi = await wajibKemampuan("pendaftaran:kelola");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as StatusPendaftaran;
  if (!id || !status) return;

  const p = await prisma.pendaftaran.update({
    where: { id },
    data: { status },
    include: { klien: { select: { nama: true } } },
  });

  await catat(
    sesi.userId,
    "UBAH_STATUS_PENDAFTARAN",
    "Pendaftaran",
    id,
    `${p.nomor} (${p.klien.nama}) → ${status}`,
  );

  revalidatePath("/dashboard/pendaftaran");
  revalidatePath(`/dashboard/pendaftaran/${id}`);
  revalidatePath("/dashboard");
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
    await prisma.pendaftaran.update({
      where: { id: bayar.pendaftaranId },
      data: { status: "TERVERIFIKASI" },
    });
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

  await prisma.pendaftaran.update({
    where: { id: pendaftaranId },
    data: { status: "MENUNGGU_PEMBAYARAN" },
  });

  await catat(
    sesi.userId,
    "CATAT_PEMBAYARAN",
    "Pendaftaran",
    pendaftaranId,
    `Tagihan pembayaran ${jumlah} dicatat`,
  );

  revalidatePath(`/dashboard/pendaftaran/${pendaftaranId}`);
  revalidatePath("/dashboard/pendaftaran");
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

  const sesiBaru = await prisma.jadwalSesi.create({
    data: {
      pendaftaranId,
      psikologId,
      mulai: new Date(mulai),
      selesai: new Date(selesai),
      metode: metode === "ONLINE" ? "ONLINE" : "OFFLINE",
      lokasi,
      tautan,
      status: "TERJADWAL",
    },
  });

  await prisma.pendaftaran.update({
    where: { id: pendaftaranId },
    data: { status: "TERJADWAL", psikologId },
  });

  await catat(
    sesi.userId,
    "BUAT_JADWAL",
    "JadwalSesi",
    sesiBaru.id,
    `Jadwal sesi ${new Date(mulai).toLocaleString("id-ID")} dibuat`,
  );

  revalidatePath(`/dashboard/pendaftaran/${pendaftaranId}`);
  revalidatePath("/dashboard/jadwal");
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
