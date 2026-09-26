"use client";

export default function GalatDashboard({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="kartu p-10 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-red-50 text-red-600">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 8v5M12 16.5h.01" strokeLinecap="round" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      </span>
      <h1 className="mt-4 text-lg font-bold text-ink">Terjadi kesalahan</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
        Halaman ini gagal dimuat. Silakan coba lagi. Jika masalah berlanjut,
        hubungi administrator.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-[0.68rem] text-muted">
          Kode: {error.digest}
        </p>
      )}
      <button onClick={reset} className="tombol tombol-utama mt-6">
        Coba lagi
      </button>
    </div>
  );
}
