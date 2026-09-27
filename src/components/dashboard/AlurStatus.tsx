import { TAHAP, nomorTahap } from "@/lib/alur";
import { cn } from "@/lib/utils";

/**
 * Penanda 5 tahap alur layanan. Tahap yang sudah dilewati ditandai centang,
 * tahap aktif disorot, tahap berikutnya ditampilkan pudar.
 */
export function AlurStatus({
  status,
  ringkas = false,
}: {
  status: string;
  ringkas?: boolean;
}) {
  if (status === "DIBATALKAN") {
    return (
      <div className="kartu border-red-200 bg-red-50 p-4">
        <p className="text-sm font-semibold text-red-800">
          Pendaftaran dibatalkan
        </p>
        <p className="mt-1 text-xs text-red-700/80">
          Kasus ini tidak dilanjutkan. Hubungi admin bila ini keliru.
        </p>
      </div>
    );
  }

  const aktif = nomorTahap(status);
  const tahapAktif = TAHAP.find((t) => t.nomor === aktif);

  return (
    <div className="kartu p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-ink-soft">
          Alur Layanan
        </h2>
        {tahapAktif && (
          <span className="pil bg-brand-600 text-white">
            Tahap {aktif} dari {TAHAP.length} — {tahapAktif.judul}
          </span>
        )}
      </div>

      {/* Progres ringkas */}
      <div className="mt-4 flex gap-1.5">
        {TAHAP.map((t) => (
          <span
            key={t.kode}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              t.nomor < aktif
                ? "bg-brand-500"
                : t.nomor === aktif
                  ? "bg-brand-600"
                  : "bg-line",
            )}
            title={`${t.nomor}. ${t.judul}`}
          />
        ))}
      </div>

      {!ringkas && (
        <ol className="mt-5 space-y-3">
          {TAHAP.map((t) => {
            const lewat = t.nomor < aktif;
            const sedang = t.nomor === aktif;
            return (
              <li key={t.kode} className="flex gap-3">
                <span
                  className={cn(
                    "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-[0.7rem] font-bold",
                    lewat && "bg-brand-600 text-white",
                    sedang && "bg-brand-100 text-brand-700 ring-2 ring-brand-400",
                    !lewat && !sedang && "bg-paper-2 text-muted",
                  )}
                >
                  {lewat ? (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M5 13l4 4L19 7"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    t.nomor
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        lewat || sedang ? "text-ink" : "text-muted",
                      )}
                    >
                      {t.judul}
                    </p>
                    {sedang && (
                      <span className="pil bg-brand-50 text-brand-700">
                        Sedang di sini
                      </span>
                    )}
                    {lewat && (
                      <span className="pil bg-sage-50 text-sage-600">Selesai</span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
                    {t.isi}
                  </p>
                  <p className="mt-1 text-[0.68rem] text-muted">
                    Penanggung jawab: {t.aktor}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {ringkas && tahapAktif && (
        <p className="mt-4 text-sm leading-relaxed text-ink-soft">
          {tahapAktif.isi}
        </p>
      )}
    </div>
  );
}
