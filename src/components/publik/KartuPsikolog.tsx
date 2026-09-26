import Image from "next/image";
import Link from "next/link";

import { inisial } from "@/lib/utils";

export type PsikologTampil = {
  userId: string;
  nama: string;
  spesialisasi: string;
  gelar: string | null;
  fotoUrl: string | null;
  bio: string | null;
  pengalaman: number;
  sipp: string | null;
  str: string | null;
};

/**
 * Kartu psikolog: foto bulat berukuran sama di bagian atas, nama di bawahnya.
 */
export function KartuPsikolog({
  p,
  ringkas = false,
}: {
  p: PsikologTampil;
  ringkas?: boolean;
}) {
  return (
    <article className="kartu flex flex-col items-center p-6 text-center">
      <span className="relative block h-32 w-32 shrink-0 overflow-hidden rounded-full ring-4 ring-brand-50">
        {p.fotoUrl ? (
          <Image
            src={p.fotoUrl}
            alt={p.nama}
            width={128}
            height={128}
            sizes="128px"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="grid h-full w-full place-items-center bg-brand-100 text-2xl font-bold text-brand-700">
            {inisial(p.nama)}
          </span>
        )}
      </span>

      <h3 className="mt-5 text-base font-bold leading-snug text-ink">{p.nama}</h3>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-sand-500">
        {p.spesialisasi}
      </p>

      {p.bio && (
        <p
          className={`mt-4 flex-1 text-sm leading-relaxed text-ink-soft ${
            ringkas ? "line-clamp-3" : ""
          }`}
        >
          {p.bio}
        </p>
      )}

      {!ringkas && (
        <dl className="mt-5 w-full space-y-1.5 border-t border-line pt-4 text-xs">
          {p.sipp && (
            <div className="flex justify-between gap-3">
              <dt className="text-muted">SIPP</dt>
              <dd className="text-right font-medium text-ink-soft">{p.sipp}</dd>
            </div>
          )}
          {p.str && (
            <div className="flex justify-between gap-3">
              <dt className="text-muted">STR</dt>
              <dd className="text-right font-medium text-ink-soft">{p.str}</dd>
            </div>
          )}
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Pengalaman</dt>
            <dd className="font-medium text-ink-soft">{p.pengalaman} tahun</dd>
          </div>
        </dl>
      )}

      {ringkas && (
        <p className="mt-4 text-xs text-muted">{p.pengalaman} tahun pengalaman</p>
      )}

      <Link
        href={`/daftar?psikolog=${p.userId}`}
        className="tombol tombol-utama mt-5 w-full !py-2 !text-xs"
      >
        Daftar dengan psikolog ini
      </Link>
    </article>
  );
}
