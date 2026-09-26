export default function MemuatDashboard() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-64 rounded-lg bg-paper-2" />
        <div className="h-4 w-96 max-w-full rounded bg-paper-2" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="kartu h-28 p-5">
            <div className="h-3 w-24 rounded bg-paper-2" />
            <div className="mt-4 h-7 w-16 rounded bg-paper-2" />
          </div>
        ))}
      </div>

      <div className="kartu p-6">
        <div className="h-4 w-40 rounded bg-paper-2" />
        <div className="mt-5 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-9 w-full rounded bg-paper-2" />
          ))}
        </div>
      </div>
    </div>
  );
}
