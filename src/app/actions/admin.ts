"use server";

import { revalidatePath } from "next/cache";

import { majuOtomatis } from "@/lib/alur-otomatis";
import { wajibKemampuan } from "@/lib/auth/dal";
import { pastikanJadwalOtomatis } from "@/lib/jadwal-otomatis";
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
  const catatanInput = String(formData.get("catatan") ?? "").trim();
  if (!id) return;

  const ditolak = keputusan !== "TERIMA";
  // Alasan penolakan wajib — klien harus tahu kenapa ditolak dan apa yang
  // perlu diperbaiki. Bila admin mengosongkan, pakai kalimat baku agar
  // klien tidak melihat status DITOLAK tanpa penjelasan.
  const catatan = ditolak
    ? catatanInput ||
      "Bukti tidak dapat diverifikasi. Pastikan foto/screenshot transfer jelas, nominal sesuai tagihan, lalu kirim ulang."
    : catatanInput || null;

  const bayar = await prisma.pembayaran.update({
    where: { id },
    data: {
      status: ditolak ? "DITOLAK" : "TERVERIFIKASI",
      catatan,
      diverifikasiOlehId: sesi.userId,
      diverifikasiPada: new Date(),
    },
  });

  if (!ditolak) {
    // Tahap 2 — pembayaran sah.
    await majuOtomatis(bayar.pendaftaranId, "TERVERIFIKASI");
    // Backfill: pendaftar lama yang belum punya baris jadwal dibuatkan dari
    // preferensi hari/jam yang ia pilih, agar jadwal langsung tampil di
    // halaman asisten begitu pembayaran disetujui.
    try {
      await pastikanJadwalOtomatis(bayar.pendaftaranId);
    } catch (e) {
      console.error("[verifikasiPembayaran] gagal backfill jadwal:", e);
    }
  }
  // Saat DITOLAK status pendaftaran sengaja TIDAK diubah — ia tetap di tahap
  // pembayaran, dan sisi klien menampilkan status "Bukti Ditolak" + alasan
  // + perintah kirim ulang (bukan kembali seolah belum pernah mengunggah).

  await catat(
    sesi.userId,
    ditolak ? "TOLAK_PEMBAYARAN" : "VERIFIKASI_PEMBAYARAN",
    "Pembayaran",
    id,
    ditolak
      ? `Pembayaran ${bayar.jumlah.toString()} ditolak. Alasan: ${catatan}`
      : `Pembayaran ${bayar.jumlah.toString()} diverifikasi sebagai sah`,
  );

  revalidatePath(`/dashboard/pendaftaran/${bayar.pendaftaranId}`);
  revalidatePath("/dashboard/pendaftaran");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/asesmen");
  revalidatePath(`/dashboard/asesmen/${bayar.pendaftaranId}`);
  revalidatePath("/dashboard/jadwal");
  revalidatePath("/dashboard/riwayat");
  revalidatePath(`/dashboard/riwayat/${bayar.pendaftaranId}`);
}

export async function buatJadwal(formData: FormData) {
  const sesi = await wajibKemampuan("jadwal:kelola");
  const pendaftaranId = String(formData.get("pendaftaranId") ?? "");
  const psikologId = String(formData.get("psikologId") ?? "");
  const mulai = String(formData.get("mulai") ?? "");
  const selesai = String(formData.get("selesai") ?? "");
  const lokasi = String(formData.get("lokasi") ?? "").trim() || null;
  const tautan = String(formData.get("tautan") ?? "").trim() || null;
  if (!pendaftaranId || !psikologId || !mulai || !selesai) return;

  // Bila klien sudah memilih jadwal saat mendaftar, jadwal itu DIPERBARUI
  // (bukan ditambah), supaya tidak ada sesi ganda untuk satu pendaftaran.
  const jadwalLama = await prisma.jadwalSesi.findFirst({
    where: { pendaftaranId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      mulai: true,
      selesai: true,
      lokasi: true,
      psikologId: true,
      catatan: true,
    },
  });

  const mulaiBaru = new Date(mulai);
  const selesaiBaru = new Date(selesai);

  // Deteksi apa yang berubah agar sisi klien bisa diberi tahu dengan tepat:
  // geser jam vs hanya penetapan ruangan/psikolog. Tanpa ini, label
  // "Sesuai jadwal yang Anda pilih saat mendaftar" tetap tampil meski jam
  // sudah digeser admin — karena `catatan` lama tidak pernah diperbarui.
  const jamBerubah =
    jadwalLama != null &&
    (jadwalLama.mulai.getTime() !== mulaiBaru.getTime() ||
      jadwalLama.selesai.getTime() !== selesaiBaru.getTime());
  const lokasiLama = (jadwalLama?.lokasi ?? "").trim();
  const lokasiBaru = (lokasi ?? "").trim();
  const lokasiBerubah = jadwalLama != null && lokasiLama !== lokasiBaru;
  const psikologBerubah =
    jadwalLama != null && jadwalLama.psikologId !== psikologId;

  const formatSingkat = (d: Date) =>
    d.toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  // `undefined` = jangan sentuh kolom catatan; string/null = tulis eksplisit.
  // Nada catatan mengikuti EDIT TERAKHIR: penggeser jam menulis tanda "diubah",
  // sedangkan pelengkap info (ruangan) menghapus tanda itu dan menulis tanda
  // netral — supaya halaman klien menonjolkan ruangan tanpa menuduh jadwal
  // digeser pada edit yang sebenarnya tidak menyentuh jam.
  let catatanBaru: string | null | undefined;
  if (jamBerubah && jadwalLama) {
    catatanBaru =
      `Jadwal diubah admin — semula ${formatSingkat(jadwalLama.mulai)} ` +
      `menjadi ${formatSingkat(mulaiBaru)}`;
  } else if (jadwalLama && (lokasiBerubah || psikologBerubah)) {
    const sisa = (jadwalLama.catatan ?? "")
      .split("·")
      .map((s) => s.trim())
      .filter(
        (s) =>
          s.length > 0 &&
          !/jadwal diubah admin/i.test(s) &&
          !/ruangan ditetapkan admin|ruangan dikosongkan|info sesi diperbarui/i.test(s),
      );
    if (lokasiBerubah && lokasiBaru) {
      sisa.push(`Ruangan ditetapkan admin: ${lokasiBaru}`);
    } else if (lokasiBerubah && !lokasiBaru) {
      sisa.push("Ruangan dikosongkan admin — menunggu penetapan baru");
    } else {
      sisa.push("Info sesi diperbarui admin");
    }
    catatanBaru = sisa.join(" · ") || null;
  } else {
    catatanBaru = undefined;
  }

  const dataJadwal = {
    psikologId,
    mulai: mulaiBaru,
    selesai: selesaiBaru,
    metode: "OFFLINE" as const,
    lokasi,
    tautan,
    status: "TERJADWAL" as const,
    ...(catatanBaru !== undefined ? { catatan: catatanBaru } : {}),
  };

  const sesiBaru = jadwalLama
    ? await prisma.jadwalSesi.update({
        where: { id: jadwalLama.id },
        data: dataJadwal,
      })
    : await prisma.jadwalSesi.create({
        data: {
          pendaftaranId,
          ...dataJadwal,
          // Jadwal manual murni (tanpa pilihan pendaftar sebelumnya).
          ...(catatanBaru === undefined && lokasiBaru
            ? { catatan: `Ruangan ditetapkan admin: ${lokasiBaru}` }
            : {}),
        },
      });

  await prisma.pendaftaran.update({
    where: { id: pendaftaranId },
    data: { psikologId },
  });

  // Jadwal manual oleh admin (koreksi/penyesuaian — jadwal utama sudah dibuat
  // otomatis dari pilihan pendaftar). Bila pembayaran sudah terverifikasi,
  // kasus otomatis maju ke tahap 3 Pelaksanaan Tes.
  await majuOtomatis(pendaftaranId, "PELAKSANAAN");

  await catat(
    sesi.userId,
    jadwalLama ? "PERBARUI_JADWAL" : "BUAT_JADWAL",
    "JadwalSesi",
    sesiBaru.id,
    jadwalLama
      ? `Jadwal sesi diperbarui: ${formatSingkat(mulaiBaru)}${
          lokasiBaru ? ` · ${lokasiBaru}` : ""
        }${
          jamBerubah
            ? ` (semula ${formatSingkat(jadwalLama.mulai)} — klien diberi tahu lewat notifikasi & detail pendaftaran)`
            : lokasiBerubah
              ? " (jam sama, ruangan diperbarui — klien diberi tahu)"
              : ""
        }`
      : `Jadwal sesi ${formatSingkat(mulaiBaru)} dibuat`,
  );

  revalidatePath(`/dashboard/pendaftaran/${pendaftaranId}`);
  revalidatePath("/dashboard/jadwal");
  revalidatePath("/dashboard/asesmen");
  revalidatePath("/dashboard/kasus");
  revalidatePath("/dashboard/riwayat");
  revalidatePath(`/dashboard/riwayat/${pendaftaranId}`);
  revalidatePath("/dashboard");
}

/**
 * Membuatkan jadwal dari pilihan hari/jam yang klien isi saat mendaftar.
 * Dipakai admin sebagai tombol "Buatkan dari pilihan klien" untuk pendaftaran
 * lama yang belum punya baris jadwal.
 */
export async function buatJadwalDariPilihan(formData: FormData) {
  const sesi = await wajibKemampuan("jadwal:kelola");
  const pendaftaranId = String(formData.get("pendaftaranId") ?? "");
  if (!pendaftaranId) return;

  const dibuat = await pastikanJadwalOtomatis(pendaftaranId);

  await catat(
    sesi.userId,
    "BUAT_JADWAL_DARI_PILIHAN",
    "JadwalSesi",
    pendaftaranId,
    dibuat
      ? "Jadwal dibuat dari pilihan hari/jam pendaftar"
      : "Jadwal tidak dibuat (pilihan tidak terbaca atau jadwal sudah ada)",
  );

  revalidatePath(`/dashboard/pendaftaran/${pendaftaranId}`);
  revalidatePath("/dashboard/pendaftaran");
  revalidatePath("/dashboard/jadwal");
  revalidatePath("/dashboard/asesmen");
  revalidatePath("/dashboard/kasus");
  revalidatePath("/dashboard/riwayat");
  revalidatePath(`/dashboard/riwayat/${pendaftaranId}`);
  revalidatePath("/dashboard");
}
