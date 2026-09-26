import {
  JudulHalaman,
  Tabel,
  Td,
  Th,
} from "@/components/dashboard/ui";
import { FormPengguna } from "@/components/dashboard/FormPengguna";
import { perbaruiPengguna, resetPassword } from "@/app/actions/pengguna";
import { wajibKemampuan } from "@/lib/auth/dal";
import { labelRole } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import { formatTanggal } from "@/lib/utils";

export default async function HalamanPengguna() {
  const sesi = await wajibKemampuan("pengguna:kelola");

  const daftar = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { nama: "asc" }],
    include: {
      profilPsikolog: { select: { spesialisasi: true, sipp: true } },
      _count: { select: { pendaftaranSebagaiPsikolog: true } },
    },
  });

  return (
    <>
      <JudulHalaman
        judul="Pengguna & Peran"
        keterangan="Kelola akun internal beserta perannya. Perubahan peran langsung memengaruhi zona data yang dapat diakses."
      />

      <div className="space-y-6">
        <FormPengguna />

        <Tabel>
          <thead>
            <tr>
              <Th>Nama</Th>
              <Th>Email</Th>
              <Th>Peran</Th>
              <Th>Spesialisasi</Th>
              <Th>Kasus</Th>
              <Th>Status</Th>
              <Th>Dibuat</Th>
              <Th>Reset kata sandi</Th>
            </tr>
          </thead>
          <tbody>
            {daftar.map((u) => (
              <tr key={u.id} className="hover:bg-paper-2/40">
                <Td>
                  <form action={perbaruiPengguna} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={u.id} />
                    <input
                      name="nama"
                      defaultValue={u.nama}
                      className="input !w-44 !py-1.5 !text-xs"
                    />
                    <input
                      name="telepon"
                      defaultValue={u.telepon ?? ""}
                      placeholder="Telepon"
                      className="input !w-32 !py-1.5 !text-xs"
                    />
                    <select
                      name="role"
                      defaultValue={u.role}
                      className="input !w-32 !py-1.5 !text-xs"
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="ASISTEN">Asisten</option>
                      <option value="PSIKOLOG">Psikolog</option>
                      <option value="KLIEN">Klien</option>
                    </select>
                    <label className="flex items-center gap-1.5 text-xs text-ink-soft">
                      <input
                        type="checkbox"
                        name="aktif"
                        defaultChecked={u.aktif}
                        className="h-3.5 w-3.5 accent-brand-600"
                      />
                      Aktif
                    </label>
                    <button className="pil border-line bg-white text-ink-soft">Simpan</button>
                  </form>
                </Td>
                <Td className="text-xs">{u.email}</Td>
                <Td className="text-xs font-medium text-ink">{labelRole[u.role]}</Td>
                <Td className="text-xs">{u.profilPsikolog?.spesialisasi ?? "—"}</Td>
                <Td className="text-xs">
                  {u.role === "PSIKOLOG" ? `${u._count.pendaftaranSebagaiPsikolog}×` : "—"}
                </Td>
                <Td>
                  <span
                    className="pil"
                    style={
                      u.aktif
                        ? { background: "#f0fdf4", color: "#15803d" }
                        : { background: "#f8fafc", color: "#475569" }
                    }
                  >
                    {u.aktif ? "Aktif" : "Nonaktif"}
                  </span>
                  {u.id === sesi.userId && (
                    <span className="ml-1.5 text-[0.68rem] text-muted">(Anda)</span>
                  )}
                </Td>
                <Td className="whitespace-nowrap text-xs">{formatTanggal(u.createdAt)}</Td>
                <Td>
                  <form action={resetPassword} className="flex items-center gap-1.5">
                    <input type="hidden" name="id" value={u.id} />
                    <input
                      name="password"
                      type="text"
                      placeholder="Sandi baru"
                      className="input !w-32 !py-1.5 !text-xs"
                    />
                    <button className="pil bg-amber-50 text-amber-700">Reset</button>
                  </form>
                </Td>
              </tr>
            ))}
          </tbody>
        </Tabel>

        <div className="kartu border-dashed p-5">
          <p className="text-xs leading-relaxed text-ink-soft">
            <span className="font-semibold text-ink">Catatan keamanan:</span>{" "}
            akun yang dinonaktifkan tidak dapat masuk. Perubahan peran langsung
            berlaku pada sesi berikutnya. Semua perubahan dicatat pada log audit.
          </p>
        </div>
      </div>
    </>
  );
}
