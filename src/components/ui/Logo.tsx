import Image from "next/image";
import Link from "next/link";

import { siteConfig } from "@/lib/config";

export function Logo({
  terang = false,
  kotakIkon = false,
  nama = siteConfig.nama,
}: {
  terang?: boolean;
  /** Bungkus ikon dengan kotak putih rounded — untuk background gelap */
  kotakIkon?: boolean;
  nama?: string;
}) {
  const textColor = terang ? "#ffffff" : "#1b4332";
  const subColor = terang ? "rgba(255,255,255,0.6)" : "#52796f";

  return (
    <Link href="/" className="group flex items-center gap-2.5">
      {/* Ikon logo PNG */}
      <span className="shrink-0 transition-transform duration-200 group-hover:scale-105">
        {kotakIkon ? (
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm">
            <Image
              src="/logo-tabula-rasa 2.png"
              alt="Tabula Rasa icon"
              width={36}
              height={36}
              className="h-full w-full object-contain"
              priority
            />
          </span>
        ) : (
          <Image
            src="/logo-tabula-rasa 2.png"
            alt="Tabula Rasa icon"
            width={44}
            height={44}
            className="h-11 w-11 object-contain"
            priority
          />
        )}
      </span>

      {/* Teks diketik manual */}
      <span className="flex flex-col leading-tight">
        <span
          className="text-[0.95rem] font-bold tracking-[0.12em] uppercase"
          style={{ color: textColor }}
        >
          {nama ?? "Tabula Rasa"}
        </span>
        <span
          className="text-[0.6rem] font-medium tracking-[0.18em] uppercase"
          style={{ color: subColor }}
        >
          Biro Psikologi
        </span>
      </span>
    </Link>
  );
}
