import type { ReactNode } from "react";
import Link from "next/link";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { LoncengNotifikasi } from "@/components/dashboard/LoncengNotifikasi";
import { keluar } from "@/app/actions/auth";
import { wajibMasuk } from "@/lib/auth/dal";
import { labelRole } from "@/lib/config";
import { navDashboard } from "@/lib/nav-dashboard";
import { ambilNotifikasi } from "@/lib/notifikasi";
import { boleh } from "@/lib/rbac";
import { inisial } from "@/lib/utils";

export default async function LayoutDashboard({
  children,
}: {
  children: ReactNode;
}) {
  const sesi = await wajibMasuk();
  const items = navDashboard[sesi.role];
  const notifikasi = await ambilNotifikasi(sesi);

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar role={sesi.role} nama={sesi.nama} items={items} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="hidden h-16 items-center justify-between border-b border-line bg-white px-8 lg:flex">
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="pil bg-brand-50 text-brand-700">{labelRole[sesi.role]}</span>
            <span>Sesi aktif 8 jam</span>
          </div>

          <div className="flex items-center gap-4">
            <LoncengNotifikasi daftar={notifikasi} />
            <span className="text-sm text-ink-soft">{sesi.nama}</span>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-700 text-[0.7rem] font-bold text-white">
              {inisial(sesi.nama)}
            </span>
            <form action={keluar}>
              <button type="submit" className="tombol tombol-garis !px-3 !py-1.5 !text-xs">
                Keluar
              </button>
            </form>
          </div>
        </header>

        {/* Bar aksi mobile */}
        <div className="flex items-center justify-between border-b border-line bg-white px-4 py-2.5 lg:hidden">
          <span className="text-xs text-muted">{sesi.nama}</span>
          <div className="flex items-center gap-3">
            <LoncengNotifikasi daftar={notifikasi} />
            <form action={keluar}>
              <button type="submit" className="text-xs font-semibold text-brand-700">
                Keluar
              </button>
            </form>
          </div>
        </div>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>

        <footer className="border-t border-line px-8 py-4 text-xs text-muted">
          Data klien dilindungi.{" "}
          {boleh(sesi.role, "audit:lihat") ? (
            <>
              Setiap akses terhadap data sensitif dicatat pada{" "}
              <Link href="/dashboard/audit" className="font-medium text-brand-700 hover:underline">
                log audit
              </Link>
              .
            </>
          ) : (
            "Setiap akses terhadap data sensitif dicatat pada log audit."
          )}
        </footer>
      </div>
    </div>
  );
}
