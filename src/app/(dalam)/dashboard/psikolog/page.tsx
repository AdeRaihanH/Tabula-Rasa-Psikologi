import { JudulHalaman } from "@/components/dashboard/ui";
import { FormPsikolog } from "@/components/dashboard/FormPsikolog";
import { PanelArsipGlobal } from "@/components/dashboard/PanelArsipGlobal";
import { wajibKemampuan } from "@/lib/auth/dal";
import { bisaMembuatBerkas, driveAktif, folderIndukId, statusGoogle } from "@/lib/gdrive";
import { prisma } from "@/lib/prisma";

export default async function HalamanPsikolog() {
  await wajibKemampuan("psikolog:kelola");

  const [daftar, pengaturan] = await Promise.all([
    prisma.profilPsikolog.findMany({
      include: {
        user: {
          select: {
            nama: true,
            email: true,
            aktif: true,
            _count: { select: { pendaftaranSebagaiPsikolog: true } },
          },
        },
      },
      orderBy: { user: { nama: "asc" } },
    }),
    prisma.pengaturanSitus.findUnique({ where: { id: "utama" } }),
  ]);

  const driveSiap = driveAktif();
  const bisaBuat = bisaMembuatBerkas();
  const status = statusGoogle();
  const adminFolderUrl = pengaturan?.driveAdminFolderId
    ? `https://drive.google.com/drive/folders/${pengaturan.driveAdminFolderId}`
    : folderIndukId()
      ? `https://drive.google.com/drive/folders/${folderIndukId()}`
      : null;
  const clientFolderUrl = pengaturan?.driveClientFolderId
    ? `https://drive.google.com/drive/folders/${pengaturan.driveClientFolderId}`
    : null;

  return (
    <>
      <JudulHalaman
        judul="Tim Psikolog"
        keterangan="Kelola profil publik psikolog beserta folder arsip Google Drive masing-masing. Setiap psikolog hanya melihat folder dan data kliennya sendiri."
      />

      <div className="mb-6">
        <PanelArsipGlobal
          driveSiap={driveSiap}
          bisaBuat={bisaBuat}
          clientSheetUrl={pengaturan?.spreadsheetUrl ?? null}
          adminFolderUrl={adminFolderUrl}
          clientFolderUrl={clientFolderUrl}
        />
      </div>

      {!driveSiap && (
        <div className="kartu mb-6 border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-semibold text-amber-800">
            Integrasi Google belum aktif
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-amber-800/80">
            Isi kredensial Google pada berkas <code>.env</code> (lokal) dan
            Environment Variables Vercel (produksi). Untuk mengisi spreadsheet
            manual, lihat petunjuk di kartu masing-masing psikolog.
          </p>
        </div>
      )}

      {driveSiap && !bisaBuat && (
        <div className="kartu mb-6 border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-semibold text-amber-800">
            Mode service account (terbatas)
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-amber-800/80">
            {status.pesan}
          </p>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-2">
        {daftar.map((p) => (
          <FormPsikolog
            key={p.id}
            driveSiap={driveSiap}
            bisaBuat={bisaBuat}
            data={{
              profilId: p.id,
              nama: p.user.nama,
              email: p.user.email,
              spesialisasi: p.spesialisasi,
              gelar: p.gelar ?? "",
              sipp: p.sipp ?? "",
              str: p.str ?? "",
              bio: p.bio ?? "",
              pengalaman: p.pengalaman,
              publik: p.publik,
              fotoUrl: p.fotoUrl ?? "",
              driveFolderUrl: p.driveFolderUrl ?? "",
              spreadsheetUrl: p.spreadsheetUrl,
              jumlahKasus: p.user._count.pendaftaranSebagaiPsikolog,
            }}
          />
        ))}

        {daftar.length === 0 && (
          <div className="kartu p-10 text-center text-sm text-ink-soft xl:col-span-2">
            Belum ada psikolog terdaftar. Jalankan seed atau tambah melalui
            halaman Pengguna &amp; Peran.
          </div>
        )}
      </div>
    </>
  );
}
