import { Footer } from "@/components/publik/Footer";
import { Header } from "@/components/publik/Header";
import { KemajuanGulir, TombolKeAtas } from "@/components/publik/KendaliGulir";
import { sesiSaatIni } from "@/lib/auth/dal";
import { ambilIdentitas } from "@/lib/data-publik";
import { ambilNotifikasi } from "@/lib/notifikasi";

export default async function LayoutPublik({ children }: LayoutProps<"/">) {
  const [identitas, sesi] = await Promise.all([
    ambilIdentitas(),
    sesiSaatIni(),
  ]);

  // Lonceng pemberitahuan tampil di header publik bila pengguna sudah masuk,
  // supaya hal yang menunggu tindakan (mis. tagihan belum dibayar) terlihat
  // sebelum membuka dashboard.
  const notifikasi = sesi?.userId ? await ambilNotifikasi(sesi) : [];

  return (
    <>
      {/* Tanpa JavaScript, konten yang dianimasikan tetap terlihat. */}
      <noscript>
        <style>{`.muncul{opacity:1 !important;transform:none !important}`}</style>
      </noscript>

      <KemajuanGulir />
      <Header
        identitas={identitas}
        sesi={
          sesi?.userId
            ? { nama: sesi.nama, role: sesi.role }
            : null
        }
        notifikasi={notifikasi}
      />
      <main className="flex-1">{children}</main>
      <Footer />
      <TombolKeAtas />
    </>
  );
}
