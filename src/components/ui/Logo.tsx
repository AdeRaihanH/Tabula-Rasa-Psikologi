import Image from "next/image";
import Link from "next/link";

import { siteConfig } from "@/lib/config";

export function Logo({
  terang = false,
  nama = siteConfig.nama,
}: {
  terang?: boolean;
  nama?: string;
}) {
  return (
    <Link href="/" className="group flex items-center">
      <span className="shrink-0 transition-transform duration-200 group-hover:scale-105">
        <Image 
          src="/logo-tabula-rasa.png" 
          alt={nama} 
          width={280} 
          height={100} 
          className="w-48 sm:w-56 object-contain"
          priority
        />
      </span>
    </Link>
  );
}
