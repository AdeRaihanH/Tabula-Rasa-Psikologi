import { JudulHalaman } from "@/components/dashboard/ui";
import { simpanPengaturan } from "@/app/actions/pengaturan";
import { wajibKemampuan } from "@/lib/auth/dal";
import { folderIndukId, statusGoogle } from "@/lib/gdrive";
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
    bankNama: p?.bankNama ?? "",
    bankNomor: p?.bankNomor ?? "",
    bankAtasNama: p?.bankAtasNama ?? "",
    instruksiPembayaran: p?.instruksiPembayaran ?? "",
  };

  const status = statusGoogle();

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

        {/* Rekening pembayaran */}
        <div className="mt-6 border-t border-line pt-5">
          <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-ink-soft">
            Rekening Pembayaran
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">
            Data ini ditampilkan kepada klien setelah mendaftar dan pada halaman
            Cek Status, supaya mereka tahu ke mana harus transfer.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="bankNama">
                Nama bank / e-wallet
              </label>
              <input
                id="bankNama"
                name="bankNama"
                defaultValue={nilai.bankNama}
                placeholder="mis. BCA / Mandiri / QRIS"
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="bankNomor">
                Nomor rekening
              </label>
              <input
                id="bankNomor"
                name="bankNomor"
                defaultValue={nilai.bankNomor}
                placeholder="1234567890"
                className="input"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="bankAtasNama">
                Atas nama
              </label>
              <input
                id="bankAtasNama"
                name="bankAtasNama"
                defaultValue={nilai.bankAtasNama}
                placeholder="Nama pemilik rekening"
                className="input"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="instruksiPembayaran">
                Instruksi pembayaran
              </label>
              <textarea
                id="instruksiPembayaran"
                name="instruksiPembayaran"
                rows={3}
                defaultValue={nilai.instruksiPembayaran}
                placeholder="mis. Transfer tepat sesuai nominal. Bukti pembayaran dapat langsung diunggah melalui tombol di bawah."
                className="input"
              />
            </div>
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
            Integrasi Google (Drive &amp; Spreadsheet)
          </h2>
          <span
            className="pil"
            style={
              status.aktif
                ? { background: "#f0fdf4", color: "#15803d" }
                : status.mode === "service-account"
                  ? { background: "#fef2f2", color: "#b91c1c" }
                  : { background: "#fffbeb", color: "#b45309" }
            }
          >
            {status.aktif ? "Aktif" : status.label}
          </span>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-ink-soft">{status.pesan}</p>

        <p className="mt-4 text-xs font-semibold text-ink-soft">
          Variabel untuk mode yang disarankan (OAuth akun biro):
        </p>
        <ul className="mt-2 space-y-1.5 font-mono text-[0.7rem] text-ink-soft">
          <li>
            GOOGLE_OAUTH_CLIENT_ID{" "}
            {process.env.GOOGLE_OAUTH_CLIENT_ID ? "✅" : "— belum diisi"}
          </li>
          <li>
            GOOGLE_OAUTH_CLIENT_SECRET{" "}
            {process.env.GOOGLE_OAUTH_CLIENT_SECRET ? "✅" : "— belum diisi"}
          </li>
          <li>
            GOOGLE_OAUTH_REFRESH_TOKEN{" "}
            {process.env.GOOGLE_OAUTH_REFRESH_TOKEN ? "✅" : "— belum diisi"}
          </li>
        </ul>

        {status.mode === "service-account" && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-xs leading-relaxed text-red-800">
              <span className="font-semibold">
                Service account tidak dapat dipakai untuk menulis.
              </span>{" "}
              Google memberi service account kuota penyimpanan 0 byte, sehingga
              pembuatan folder, berkas, dan spreadsheet selalu ditolak
              (<code>storageQuotaExceeded</code>). Ganti ke OAuth akun biro:
              buat <em>OAuth client ID</em> di Google Cloud, isi{" "}
              <code>GOOGLE_OAUTH_CLIENT_ID</code> dan{" "}
              <code>GOOGLE_OAUTH_CLIENT_SECRET</code>, lalu jalankan{" "}
              <code>npx tsx scripts/oauth-consent.ts</code> satu kali.
            </p>
          </div>
        )}

        <p className="mt-4 text-xs leading-relaxed text-ink-soft">
          Karena file dibuat atas nama akun biro sendiri, folder Drive{" "}
          <span className="font-semibold text-ink">
            tidak perlu dibagikan
          </span>{" "}
          ke akun lain, dan kuota penyimpanan yang terpakai adalah kuota akun
          biro. Untuk produksi, isi variabel yang sama pada Environment
          Variables Vercel.
        </p>
      </div>
    </>
  );
}
