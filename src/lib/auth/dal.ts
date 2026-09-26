import { cache } from "react";
import { redirect } from "next/navigation";

import { ambilTokenSesi, dekripsiSesi, type IsiSesi } from "@/lib/auth/session";
import { boleh, type Kemampuan, type Role } from "@/lib/rbac";

/** Sesi saat ini atau null. Di-memo per render pass. */
export const sesiSaatIni = cache(async (): Promise<IsiSesi | null> => {
  const token = await ambilTokenSesi();
  return dekripsiSesi(token);
});

/** Wajib login. Mengembalikan sesi atau mengalihkan ke /masuk. */
export const wajibMasuk = cache(async (): Promise<IsiSesi> => {
  const sesi = await sesiSaatIni();
  if (!sesi?.userId) redirect("/masuk");
  return sesi;
});

/** Wajib salah satu peran. */
export const wajibPeran = cache(
  async (...peran: Role[]): Promise<IsiSesi> => {
    const sesi = await wajibMasuk();
    if (!peran.includes(sesi.role)) redirect("/dashboard");
    return sesi;
  },
);

/** Wajib memiliki kemampuan tertentu (matriks hak akses). */
export async function wajibKemampuan(kemampuan: Kemampuan): Promise<IsiSesi> {
  const sesi = await wajibMasuk();
  if (!boleh(sesi.role, kemampuan)) redirect("/dashboard");
  return sesi;
}

/**
 * Batas isolasi psikolog: seorang psikolog hanya boleh menyentuh kasus yang
 * ditugaskan kepadanya. Mengembalikan filter `where` yang aman.
 */
export function filterKasusPsikolog(sesi: IsiSesi) {
  if (sesi.role === "PSIKOLOG") return { psikologId: sesi.userId };
  return {};
}

/** Pastikan seorang psikolog memang pemegang kasus ini. */
export function milikPsikolog(
  sesi: IsiSesi,
  pendaftaran: { psikologId: string | null },
) {
  if (sesi.role !== "PSIKOLOG") return true;
  return pendaftaran.psikologId === sesi.userId;
}
