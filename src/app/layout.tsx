import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";

import { siteConfig } from "@/lib/config";

import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://tabularasa.id",
  ),
  title: {
    default: siteConfig.nama,
    template: `%s · ${siteConfig.nama}`,
  },
  description: siteConfig.deskripsi,
  keywords: [
    "biro psikologi",
    "psikotes",
    "rekrutmen",
    "asesmen",
    "konseling",
    "training",
    "EAP",
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${jakarta.variable} h-full`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
