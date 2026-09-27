import type { Metadata } from "next";
import Link from "next/link";

import { FilterFaq } from "@/components/publik/FilterFaq";
import { Muncul } from "@/components/publik/gerak";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "Pertanyaan yang Sering Diajukan",
  description:
    "Jawaban atas pertanyaan umum tentang layanan, kerahasiaan data, dan alur pendaftaran.",
};

const grup = [
  {
    judul: "Layanan & Pendaftaran",
    tanya: [
      {
        q: "Bagaimana cara mendaftar layanan?",
        a: "Isi formulir di halaman Pendaftaran. Setelah dikirim, Anda akan menerima nomor pendaftaran yang dapat dipakai untuk memantau status di halaman Cek Status. Admin akan menghubungi Anda dalam 1×24 jam kerja.",
      },
      {
        q: "Apakah bisa mendaftar atas nama perusahaan atau sekolah?",
        a: "Bisa. Isi kolom institusi/perusahaan pada formulir. Untuk kebutuhan institusi berskala besar, kami akan menyusun proposal dan kesepakatan kerja sama (MOU) sebelum pelaksanaan.",
      },
      {
        q: "Berapa lama satu sesi konseling?",
        a: "Umumnya 60 menit. Asesmen seperti tes IQ dapat memerlukan waktu lebih lama, dan akan diinformasikan saat penjadwalan.",
      },
      {
        q: "Bagaimana metode pelaksanaan tesnya?",
        a: "Seluruh layanan dilaksanakan Tatap Muka di biro. Anda memilih tanggal dan jam saat mendaftar, lalu datang ke biro sesuai jadwal untuk mengerjakan tes bersama asisten psikolog.",
      },
    ],
  },
  {
    judul: "Kerahasiaan Data",
    tanya: [
      {
        q: "Siapa yang bisa melihat data saya?",
        a: "Data diri dan jadwal dikelola oleh admin; dokumen tes dikelola oleh asisten psikolog; dan laporan hasil dikelola langsung oleh psikolog penanggung jawab. Privasi Anda dijaga dengan ketat.",
      },
      {
        q: "Apakah psikolog lain bisa melihat data saya?",
        a: "Tidak. Setiap psikolog hanya dapat membuka kasus yang ditugaskan kepadanya. Daftar pasien satu psikolog tidak terlihat oleh psikolog lain.",
      },
      {
        q: "Apakah ada informed consent?",
        a: "Ya. Sebelum layanan dimulai, Anda menandatangani informed consent yang menjelaskan tujuan asesmen, alat yang digunakan, dan penggunaan hasilnya.",
      },
      {
        q: "Berapa lama data disimpan?",
        a: "Setiap kasus diarsipkan dengan klasifikasi kerahasiaan dan masa retensi yang disepakati, lalu dimusnahkan secara aman setelah masa retensi berakhir.",
      },
    ],
  },
  {
    judul: "Hasil & Pembayaran",
    tanya: [
      {
        q: "Bagaimana hasil asesmen diserahkan?",
        a: "Hasil diserahkan melalui sesi umpan balik bersama psikolog, bukan sekadar berupa dokumen, agar dapat dipahami dan ditindaklanjuti.",
      },
      {
        q: "Bagaimana cara pembayarannya?",
        a: "Admin akan menerbitkan tagihan setelah kebutuhan diverifikasi. Anda melakukan pembayaran transfer, lalu admin memverifikasinya. Status pembayaran dapat Anda pantau pada halaman Cek Status.",
      },
      {
        q: "Apakah ada biaya tersembunyi?",
        a: "Tidak. Rincian biaya disampaikan sebelum pelaksanaan. Untuk program institusi, rincian tercantum dalam proposal dan MOU.",
      },
    ],
  },
];

export default function HalamanFaq() {
  return (
    <>
      <section className="border-b border-line bg-paper-2">
        <div className="wadah py-14">
          <Muncul className="max-w-3xl">
            <span className="label-kecil">FAQ</span>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Pertanyaan yang sering diajukan
            </h1>
            <p className="mt-4 text-ink-soft">
              Belum menemukan jawabannya? Hubungi kami di {siteConfig.telepon}.
            </p>
          </Muncul>
        </div>
      </section>

      <div className="wadah max-w-3xl py-12">
        <Muncul>
          <FilterFaq grup={grup} />
        </Muncul>

        <Muncul className="kartu mt-12 flex flex-col items-center justify-between gap-5 bg-brand-600 p-8 text-white sm:flex-row">
          <div>
            <h2 className="text-lg font-bold">Masih ada pertanyaan?</h2>
            <p className="mt-1.5 text-sm text-white/75">
              Tim kami siap membantu pada jam operasional.
            </p>
          </div>
          <Link href="/kontak" className="tombol tombol-sand shrink-0">
            Hubungi Kami
          </Link>
        </Muncul>
      </div>
    </>
  );
}
