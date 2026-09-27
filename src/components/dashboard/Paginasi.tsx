import Link from "next/link";

/**
 * Navigasi halaman untuk tabel yang datanya panjang.
 *
 * Berbasis tautan (`?hal=N`) sehingga tetap berfungsi tanpa JavaScript dan
 * dapat di-bookmark. Parameter lain (mis. filter status) dipertahankan.
 */
export function Paginasi({
  jalur,
  hal,
  total,
  ukuran,
  cari,
  namaParam = "hal",
}: {
  /** Jalur dasar, mis. `/dashboard/pendaftaran`. */
  jalur: string;
  /** Halaman aktif (1-based). */
  hal: number;
  /** Jumlah seluruh baris (bukan hanya halaman ini). */
  total: number;
  /** Jumlah baris per halaman. */
  ukuran: number;
  /** Parameter query lain yang perlu dipertahankan (mis. `{ status: "BARU" }`). */
  cari?: Record<string, string | undefined>;
  /** Nama parameter halaman. Dipakai bila ada dua paginasi di satu halaman. */
  namaParam?: string;
}) {
  const halamanTotal = Math.max(1, Math.ceil(total / ukuran));
  const mulai = total === 0 ? 0 : (hal - 1) * ukuran + 1;
  const selesai = Math.min(hal * ukuran, total);

  const tautan = (h: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(cari ?? {})) {
      if (v) q.set(k, v);
    }
    if (h > 1) q.set(namaParam, String(h));
    const s = q.toString();
    return s ? `${jalur}?${s}` : jalur;
  };

  // Deret halaman di sekitar halaman aktif (maksimal 5 nomor).
  const jendela: number[] = [];
  const awal = Math.max(1, Math.min(hal - 2, halamanTotal - 4));
  const akhir = Math.min(halamanTotal, awal + 4);
  for (let i = awal; i <= akhir; i++) jendela.push(i);

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-muted">
        Menampilkan{" "}
        <span className="font-semibold text-ink-soft">
          {mulai}–{selesai}
        </span>{" "}
        dari <span className="font-semibold text-ink-soft">{total}</span> data
      </p>

      {halamanTotal > 1 && (
        <nav className="flex flex-wrap items-center gap-1.5" aria-label="Navigasi halaman">
          <TombolHalaman
            href={tautan(hal - 1)}
            mati={hal <= 1}
            label="← Sebelumnya"
          />

          {awal > 1 && (
            <>
              <NomorHalaman href={tautan(1)} nomor={1} aktif={hal === 1} />
              {awal > 2 && <span className="px-1 text-xs text-muted">…</span>}
            </>
          )}

          {jendela.map((n) => (
            <NomorHalaman
              key={n}
              href={tautan(n)}
              nomor={n}
              aktif={n === hal}
            />
          ))}

          {akhir < halamanTotal && (
            <>
              {akhir < halamanTotal - 1 && (
                <span className="px-1 text-xs text-muted">…</span>
              )}
              <NomorHalaman
                href={tautan(halamanTotal)}
                nomor={halamanTotal}
                aktif={hal === halamanTotal}
              />
            </>
          )}

          <TombolHalaman
            href={tautan(hal + 1)}
            mati={hal >= halamanTotal}
            label="Berikutnya →"
          />
        </nav>
      )}
    </div>
  );
}

function NomorHalaman({
  href,
  nomor,
  aktif,
}: {
  href: string;
  nomor: number;
  aktif: boolean;
}) {
  if (aktif) {
    return (
      <span
        aria-current="page"
        className="grid h-8 min-w-8 place-items-center rounded-lg bg-brand-700 px-2 text-xs font-bold text-white"
      >
        {nomor}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="grid h-8 min-w-8 place-items-center rounded-lg border border-line bg-white px-2 text-xs font-medium text-ink-soft transition hover:border-brand-300 hover:text-brand-700"
    >
      {nomor}
    </Link>
  );
}

function TombolHalaman({
  href,
  mati,
  label,
}: {
  href: string;
  mati: boolean;
  label: string;
}) {
  if (mati) {
    return (
      <span
        aria-disabled="true"
        className="grid h-8 place-items-center rounded-lg border border-line bg-paper-2 px-3 text-xs font-medium text-muted opacity-60"
      >
        {label}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="grid h-8 place-items-center rounded-lg border border-line bg-white px-3 text-xs font-medium text-ink-soft transition hover:border-brand-300 hover:text-brand-700"
    >
      {label}
    </Link>
  );
}
