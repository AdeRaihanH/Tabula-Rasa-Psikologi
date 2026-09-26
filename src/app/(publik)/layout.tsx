import { Footer } from "@/components/publik/Footer";
import { Header } from "@/components/publik/Header";
import { sesiRingkas } from "@/lib/auth/dal";
import { ambilIdentitas } from "@/lib/data-publik";

export default async function LayoutPublik({ children }: LayoutProps<"/">) {
  const [identitas, sesi] = await Promise.all([
    ambilIdentitas(),
    sesiRingkas(),
  ]);

  return (
    <>
      <Header
        identitas={identitas}
        sesi={
          sesi?.userId
            ? { nama: sesi.nama, role: sesi.role }
            : null
        }
      />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
