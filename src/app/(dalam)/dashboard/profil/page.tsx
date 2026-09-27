import { JudulHalaman } from "@/components/dashboard/ui";
import { FormProfil } from "@/components/dashboard/FormProfil";
import { wajibMasuk } from "@/lib/auth/dal";
import { labelRole } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import { formatTanggal } from "@/lib/utils";

export default async function HalamanProfil() {
  const sesi = await wajibMasuk();

  const user = await prisma.user.findUnique({
    where: { id: sesi.userId },
    include: { profilPsikolog: true },
  });

  if (!user) return null;

  return (
    <>
      <JudulHalaman
        judul="Profil Saya"
        keterangan={`Peran Anda: ${labelRole[user.role]}. Perubahan data di bawah langsung tersimpan pada akun Anda.`}
      />

      <FormProfil
        role={user.role}
        awal={{
          nama: user.nama,
          email: user.email,
          terdaftarSejak: formatTanggal(user.createdAt),
          telepon: user.telepon ?? "",
          spesialisasi: user.profilPsikolog?.spesialisasi ?? "",
          gelar: user.profilPsikolog?.gelar ?? "",
          sipp: user.profilPsikolog?.sipp ?? "",
          str: user.profilPsikolog?.str ?? "",
          bio: user.profilPsikolog?.bio ?? "",
          pengalaman: user.profilPsikolog?.pengalaman ?? 0,
          publik: user.profilPsikolog?.publik ?? true,
        }}
      />
    </>
  );
}
