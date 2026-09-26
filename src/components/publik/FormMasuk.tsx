"use client";

import { useActionState } from "react";

import { masuk, type HasilMasuk } from "@/app/actions/auth";
import { JebakanBot } from "@/components/ui/JebakanBot";

export function FormMasuk() {
  const [hasil, aksi, pending] = useActionState<HasilMasuk, FormData>(masuk, undefined);

  return (
    <form action={aksi} className="space-y-5">
      <JebakanBot />
      {hasil && !hasil.ok && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {hasil.pesan}
        </div>
      )}

      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          className="input"
          placeholder="nama@tabularasa.id"
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="password">
          Kata sandi
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          className="input"
          placeholder="••••••••"
          required
        />
      </div>

      <button type="submit" disabled={pending} className="tombol tombol-utama w-full disabled:opacity-60">
        {pending ? "Memproses…" : "Masuk"}
      </button>
    </form>
  );
}
