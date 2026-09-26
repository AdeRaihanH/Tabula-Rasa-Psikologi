import { JudulHalaman } from "@/components/dashboard/ui";
import { simpanPengaturan } from "@/app/actions/pengaturan";
import { wajibKemampuan } from "@/lib/auth/dal";
import { driveAktif, folderIndukId } from "@/lib/gdrive";
import { prisma } from "@/lib/prisma";

const contoh = [
  ["namaBiro", "Tabula Rasa", "Nama yang tampil di header, footer, dan judul halaman."],
  ["tagline", "Ruang untuk bertumbuh, lembar yang belum tertulis.", "Satu kalimat pendek."],
  ["telepon", "0812-0000-0000", "Ditampilkan di footer dan halaman kontak."],
  ["whatsapp", "6281200000000", "Format internasional tanpa tanda + (dipakai tautan wa.me)."],
  ["email", "halo@tabularasa.id", "Alamat surel resmi."],
  ["alamat", "Jl. Contoh No. 1, Kota Anda", "Alamat kantor."],
  ["jamOperasional", "Senin–Sabtu, 08.00–20.00 WIB", "Jam layanan."],
  ["driveFolderId", "1AbCdEfGhIjKlMnOpQrStUv", "ID folder Google Drive untuk arsip digital."],
] as const;

export default async function HalamanPengaturan() {
  await wajibKemampuan("pengaturan:kelola");

  const p = await prisma.pengaturanSitus.findUnique({ where: { id: "utama" } });

  const nilai: Record<string, string> = {
    namaBiro: p?.namaBiro ?? "Tabula Rasa",
    tagline: p?.tagline ?? "",
    deskripsi: p?.deskripsi ?? "",
    telepon: p?.telepon ?? "",
    whatsapp: p?.whatsapp ?? "",
    email: p?.email ?? "",
    alamat: p?.alamat ?? "",
    jamOperasional: p?.jamOperasional ?? "",
    driveFolderId: p?.driveFolderId ?? folderIndukId() ?? "",
  };

  const driveSiap = driveAktif();

  return (
    <>
      <JudulHalaman
        judul="Pengaturan Situs"
        keterangan="Identitas biro yang dipakai di seluruh situs publik. Perubahan langsung berlaku setelah disimpan."
      />

      <form action={simpanPengaturan} className="kartu max-w-3xl p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {contoh.map(([nama, placeholder, bantuan]) => (
            <div key={nama} className={nama === "tagline" || nama === "alamat" ? "sm:col-span-2" : ""}>
              <label className="label" htmlFor={nama}>
                {nama}
              </label>
              <input
                id={nama}
                name={nama}
                defaultValue={nilai[nama]}
                placeholder={placeholder}
                className="input"
              />
              <p className="mt-1 text-[0.68rem] text-muted">{bantuan}</p>
            </div>
          ))}

          <div className="sm:col-span-2">
            <label className="label" htmlFor="deskripsi">
              deskripsi
            </label>
            <textarea
              id="deskripsi"
              name="deskripsi"
              rows={3}
              defaultValue={nilai.deskripsi}
              placeholder="Deskripsi singkat biro untuk footer."
              className="input"
            />
            <p className="mt-1 text-[0.68rem] text-muted">
              Dipakai pada footer dan meta deskripsi situs.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3 border-t border-line pt-5">
          <button className="tombol tombol-utama">Simpan pengaturan</button>
          <span className="text-xs text-muted">
            Perubahan dicatat pada log audit.
          </span>
        </div>
      </form>

      <div className="kartu mt-6 max-w-3xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-ink-soft">
            Integrasi Google Drive
          </h2>
          <span
            className="pil"
            style={
              driveSiap
                ? { background: "#f0fdf4", color: "#15803d" }
                : { background: "#fffbeb", color: "#b45309" }
            }
          >
            {driveSiap ? "Aktif" : "Belum aktif"}
          </span>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-ink-soft">
          Arsip digital memakai Google Drive melalui <em>service account</em>.
          Isi variabel lingkungan berikut pada berkas <code>.env</code> (lokal)
          dan pada Environment Variables Vercel (produksi):
        </p>

        <ul className="mt-3 space-y-1.5 font-mono text-[0.7rem] text-ink-soft">
          <li>
            GOOGLE_SERVICE_ACCOUNT_EMAIL{" "}
            {process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? "✅" : "— belum diisi"}
          </li>
          <li>
            GOOGLE_PRIVATE_KEY{" "}
            {process.env.GOOGLE_PRIVATE_KEY ? "✅" : "— belum diisi"}
          </li>
          <li>
            GOOGLE_DRIVE_FOLDER_ID{" "}
            {process.env.GOOGLE_DRIVE_FOLDER_ID ? "✅" : "— belum diisi"}
          </li>
        </ul>

        <p className="mt-4 text-xs leading-relaxed text-ink-soft">
          Bagikan folder tujuan ke email service account dengan akses{" "}
          <span className="font-semibold text-ink">Editor</span>, lalu tempel ID
          folder pada kolom di atas. ID folder adalah bagian akhir tautan:
          <span className="ml-1 font-mono text-[0.7rem]">
            drive.google.com/drive/folders/&lt;ID_FOLDER&gt;
          </span>
        </p>
      </div>
    </>
  );
}
