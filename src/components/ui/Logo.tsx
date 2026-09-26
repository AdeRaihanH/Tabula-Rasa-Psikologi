import Image from "next/image";
import Link from "next/link";

import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";

/**
 * Logo biro. `terang` dipakai saat logo berada di atas latar gelap
 * (mis. footer): logo dibungkus kotak putih agar tetap terbaca, karena
 * berkas logo berwarna gelap.
 */
export function Logo({
  terang = false,
  nama = siteConfig.nama,
}: {
  terang?: boolean;
  nama?: string;
}) {
  return (
    <Link href="/" className="group flex items-center">
      <span
        className={cn(
          "shrink-0 transition-transform duration-200 group-hover:scale-105",
          terang && "rounded-xl bg-white px-2.5 py-1.5 shadow-sm",
        )}
      >
        <Image
          src="/logo-tabula-rasa.png"
          alt={nama}
          width={280}
          height={100}
          className={cn(
            "object-contain",
            terang ? "w-36 sm:w-40" : "w-48 sm:w-56",
          )}
          priority
        />
      </span>
    </Link>
  );
}
