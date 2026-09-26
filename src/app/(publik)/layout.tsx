import { Footer } from "@/components/publik/Footer";
import { Header } from "@/components/publik/Header";
import { ambilIdentitas } from "@/lib/data-publik";

export default async function LayoutPublik({ children }: LayoutProps<"/">) {
  const identitas = await ambilIdentitas();

  return (
    <>
      <Header identitas={identitas} />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
