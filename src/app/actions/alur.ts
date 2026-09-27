"use server";

import { revalidatePath } from "next/cache";

import { wajibMasuk } from "@/lib/auth/dal";
import { cekSyaratTahap, type HasilSyarat } from "@/lib/alur-otomatis";
import { tahapBerikutnya, tahapSebelumnya } from "@/lib/alur";
import { prisma } from "@/lib/prisma";
import { boleh } from "@/lib/rbac";
import type { StatusPendaftaran } from "@/generated/prisma/enums";

export type HasilTahap = HasilSyarat;

async function catat(
  userId: string,
  aksi: string,
  entitasId: string,
  detail: string,
) {
  await prisma.auditLog.create({
    data: { userId, aksi, entitas: "Pendaftaran", entitasId, detail },
  });
}

function bersihkanJalur(id: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/pendaftaran");
  revalidatePath(`/dashboard/pendaftaran/${id}`);
  revalidatePath("/dashboard/asesmen");
  revalidatePath(`/dashboard/asesmen/${id}`);
  revalidatePath("/dashboard/kasus");
  revalidatePath(`/dashboard/kasus/${id}`);
}

/**
 * Menaikkan status ke tahap berikutnya setelah syaratnya terpenuhi.
 * Hanya peran penanggung jawab tahap tersebut yang boleh menjalankannya.
 */
export async function naikkanTahap(
  _sebelumnya: HasilTahap | undefined,
  formData: FormData,
): Promise<HasilTahap | undefined> {
  const sesi = await wajibMasuk();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, pesan: "Pendaftaran tidak dikenali." };

  const p = await prisma.pendaftaran.findUnique({
    where: { id },
    select: { nomor: true, status: true, psikologId: true },
  });
  if (!p) return { ok: false, pesan: "Pendaftaran tidak ditemukan." };

  const berikut = tahapBerikutnya(p.status);
  if (!berikut) {
    return { ok: false, pesan: "Kasus sudah berada di tahap terakhir." };
  }

  if (!berikut.peran.includes(sesi.role)) {
    return {
      ok: false,
      pesan: `Tahap "${berikut.judul}" menjadi tanggung jawab ${berikut.aktor}.`,
    };
  }

  if (sesi.role === "PSIKOLOG" && p.psikologId !== sesi.userId) {
    return { ok: false, pesan: "Kasus ini bukan milik Anda." };
  }

  const syarat = await cekSyaratTahap(id, berikut.kode);
  if (!syarat.ok) return syarat;

  await prisma.pendaftaran.update({
    where: { id },
    data: { status: berikut.kode },
  });

  await catat(
    sesi.userId,
    "NAIK_TAHAP",
    id,
    `${p.nomor}: ${p.status} → ${berikut.kode} (tahap ${berikut.nomor})`,
  );

  bersihkanJalur(id);
  return {
    ok: true,
    pesan: `Berhasil. Kasus naik ke tahap ${berikut.nomor} — ${berikut.judul}.`,
  };
}

/** Mengembalikan status ke tahap sebelumnya (koreksi oleh admin). */
export async function turunkanTahap(
  _sebelumnya: HasilTahap | undefined,
  formData: FormData,
): Promise<HasilTahap | undefined> {
  const sesi = await wajibMasuk();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, pesan: "Pendaftaran tidak dikenali." };

  const p = await prisma.pendaftaran.findUnique({
    where: { id },
    select: { nomor: true, status: true, psikologId: true },
  });
  if (!p) return { ok: false, pesan: "Pendaftaran tidak ditemukan." };

  const sebelum = tahapSebelumnya(p.status);
  if (!sebelum) {
    return { ok: false, pesan: "Sudah berada di tahap paling awal." };
  }

  const bolehMundur =
    boleh(sesi.role, "pendaftaran:kelola") ||
    (sesi.role === "PSIKOLOG" && p.psikologId === sesi.userId);
  if (!bolehMundur) {
    return { ok: false, pesan: "Anda tidak berwenang mengoreksi tahap kasus ini." };
  }

  await prisma.pendaftaran.update({
    where: { id },
    data: { status: sebelum.kode },
  });

  await catat(
    sesi.userId,
    "TURUN_TAHAP",
    id,
    `${p.nomor}: ${p.status} → ${sebelum.kode} (koreksi)`,
  );

  bersihkanJalur(id);
  return {
    ok: true,
    pesan: `Status dikembalikan ke tahap ${sebelum.nomor} — ${sebelum.judul}.`,
  };
}

/** Membatalkan pendaftaran (admin). */
export async function batalkanPendaftaran(
  _sebelumnya: HasilTahap | undefined,
  formData: FormData,
): Promise<HasilTahap | undefined> {
  const sesi = await wajibMasuk();
  if (!boleh(sesi.role, "pendaftaran:kelola")) {
    return { ok: false, pesan: "Hanya admin yang dapat membatalkan pendaftaran." };
  }

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, pesan: "Pendaftaran tidak dikenali." };

  const p = await prisma.pendaftaran.findUnique({
    where: { id },
    select: { nomor: true, status: true },
  });
  if (!p) return { ok: false, pesan: "Pendaftaran tidak ditemukan." };

  await prisma.pendaftaran.update({
    where: { id },
    data: { status: "DIBATALKAN" as StatusPendaftaran },
  });

  await catat(
    sesi.userId,
    "BATALKAN_PENDAFTARAN",
    id,
    `${p.nomor}: ${p.status} → DIBATALKAN`,
  );

  bersihkanJalur(id);
  return { ok: true, pesan: "Pendaftaran dibatalkan." };
}
