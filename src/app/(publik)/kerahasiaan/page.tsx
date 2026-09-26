import type { Metadata } from "next";
import Link from "next/link";

import { hakAkses, infoZona, type Kemampuan, type Zona } from "@/lib/rbac";

export const metadata: Metadata = {
  title: "Sistem Kerahasiaan Data",
  description:
    "Matriks hak akses dan kategorisasi tiga zona kerahasiaan data klien.",
};

const peran = ["ADMIN", "ASISTEN", "PSIKOLOG"] as const;
const labelPeran: Record<string, string> = {
  ADMIN: "Admin",
  ASISTEN: "Asisten Psikolog",
  PSIKOLOG: "Psikolog",
};

const grupKemampuan: Array<{ zona: Zona; kemampuan: Array<[Kemampuan, string]> }> = [
  {
    zona: "ZONA_1",
    kemampuan: [
      ["klien:lihat", "Melihat data diri klien"],
      ["klien:kelola", "Menambah / mengubah data klien"],
      ["jadwal:lihat", "Melihat jadwal sesi"],
      ["jadwal:kelola", "Menyusun & mengubah jadwal"],
      ["pendaftaran:lihat", "Melihat daftar pendaftaran"],
      ["pendaftaran:kelola", "Mengubah status pendaftaran"],
      ["pembayaran:verifikasi", "Memverifikasi pembayaran"],
    ],
  },
  {
    zona: "ZONA_2",
    kemampuan: [
      ["lembartes:lihat", "Melihat lembar tes"],
      ["lembartes:kelola", "Mengelola lembar tes"],
      ["skor:lihat", "Melihat skor mentah"],
      ["skor:kelola", "Mengisi / mengubah skor mentah"],
      ["alattes:kelola", "Mengelola master alat tes"],
    ],
  },
  {
    zona: "ZONA_3",
    kemampuan: [
      ["laporan:lihat", "Membaca laporan hasil & interpretasi"],
      ["laporan:kelola", "Menyusun laporan & interpretasi"],
    ],
  },
];

const prinsip = [
  {
    judul: "Pemisahan tugas",
    isi: "Admin mengurus administrasi, asisten mengurus instrumen dan skor, psikolog menyusun interpretasi. Tidak ada peran yang memegang seluruh rantai data.",
  },
  {
    judul: "Isolasi antar-psikolog",
    isi: "Psikolog hanya dapat membuka kasus yang ditugaskan kepadanya. Daftar pasien satu psikolog tidak terlihat oleh psikolog lain.",
  },
  {
    judul: "Minimalisasi data",
    isi: "Setiap layar hanya menampilkan data yang benar-benar diperlukan untuk tugas peran tersebut.",
  },
  {
    judul: "Jejak audit",
    isi: "Setiap tindakan penting dicatat pada log audit: siapa, kapan, dan apa yang diubah.",
  },
];

export default function HalamanKerahasiaan() {
  return (
    <>
      <section className="border-b border-line bg-paper-2">
        <div className="wadah py-14 lg:py-16">
          <span className="label-kecil">Sistem Kerahasiaan Data</span>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl">
            Klasifikasi data berlapis dan matriks hak akses
          </h1>
          <p className="mt-5 max-w-2xl text-ink-soft">
            Data psikologi bersifat sangat pribadi. Karena itu kami membaginya
            ke dalam tiga zona, masing-masing dengan pemegang akses yang
            berbeda.
          </p>
        </div>
      </section>

      {/* ZONA */}
      <section className="wadah py-14">
        <div className="grid gap-4 lg:grid-cols-3">
          {(["ZONA_1", "ZONA_2", "ZONA_3"] as Zona[]).map((z) => (
            <div key={z} className="kartu overflow-hidden">
              <div className="h-1.5 w-full" style={{ background: infoZona[z].warna }} />
              <div className="p-6">
                <h2 className="text-lg font-bold text-ink">{infoZona[z].nama}</h2>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.1em] text-muted">
                  Pemegang akses: {infoZona[z].pemegang}
                </p>
                <p className="mt-4 text-sm leading-relaxed text-ink-soft">
                  {infoZona[z].isi}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* MATRIKS */}
      <section className="border-y border-line bg-white py-14">
        <div className="wadah">
          <h2 className="text-2xl font-bold tracking-tight text-ink">
            Matriks hak akses
          </h2>
          <p className="mt-3 max-w-2xl text-ink-soft">
            Tanda centang menunjukkan peran yang memiliki kewenangan tersebut.
          </p>

          <div className="mt-8 space-y-8">
            {grupKemampuan.map((grup) => (
              <div key={grup.zona}>
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: infoZona[grup.zona].warna }}
                  />
                  <h3 className="text-sm font-bold uppercase tracking-[0.1em] text-ink-soft">
                    {infoZona[grup.zona].nama}
                  </h3>
                </div>

                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[34rem] border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-line text-left">
                        <th className="py-2.5 pr-4 font-semibold text-muted">
                          Kewenangan
                        </th>
                        {peran.map((p) => (
                          <th
                            key={p}
                            className="w-28 py-2.5 text-center font-semibold text-muted"
                          >
                            {labelPeran[p]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {grup.kemampuan.map(([kode, label]) => (
                        <tr key={kode} className="border-b border-line last:border-0">
                          <td className="py-2.5 pr-4 text-ink-soft">{label}</td>
                          {peran.map((p) => {
                            const punya = (hakAkses[kode] as readonly string[]).includes(p);
                            return (
                              <td key={p} className="py-2.5 text-center">
                                {punya ? (
                                  <span className="inline-grid h-5 w-5 place-items-center rounded-full bg-brand-100 text-brand-700">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                      <path
                                        d="M5 13l4 4L19 7"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  </span>
                                ) : (
                                  <span className="text-line">—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRINSIP */}
      <section className="wadah py-14">
        <h2 className="text-2xl font-bold tracking-tight text-ink">
          Empat prinsip yang kami pegang
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {prinsip.map((p) => (
            <div key={p.judul} className="kartu p-6">
              <h3 className="font-bold text-ink">{p.judul}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{p.isi}</p>
            </div>
          ))}
        </div>

        <div className="kartu mt-10 flex flex-col items-center justify-between gap-5 bg-brand-800 p-8 text-white sm:flex-row">
          <div>
            <h2 className="text-lg font-bold">Punya pertanyaan tentang data Anda?</h2>
            <p className="mt-1.5 text-sm text-white/70">
              Kami terbuka menjelaskan bagaimana data Anda disimpan dan diakses.
            </p>
          </div>
          <Link href="/kontak" className="tombol tombol-sand shrink-0">
            Hubungi Kami
          </Link>
        </div>
      </section>
    </>
  );
}
