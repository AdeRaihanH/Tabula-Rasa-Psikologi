"use client";

import { useActionState, useState } from "react";

import { buatPengguna, type HasilPengguna } from "@/app/actions/pengguna";

export function FormPengguna() {
  const [hasil, aksi, pending] = useActionState<HasilPengguna, FormData>(
    buatPengguna,
    undefined,
  );
  const [role, setRole] = useState("ASISTEN");

  return (
    <form action={aksi} className="kartu p-6">
      <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-ink-soft">
        Tambah pengguna
      </h2>

      {hasil && (
        <div
          className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
            hasil.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {hasil.pesan}
        </div>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="nama">
            Nama lengkap *
          </label>
          <input id="nama" name="nama" className="input" placeholder="Nama beserta gelar" />
        </div>
        <div>
          <label className="label" htmlFor="email">
            Email *
          </label>
          <input id="email" name="email" type="email" className="input" placeholder="nama@tabularasa.id" />
        </div>
        <div>
          <label className="label" htmlFor="telepon">
            Telepon
          </label>
          <input id="telepon" name="telepon" className="input" placeholder="08xxxxxxxxxx" />
        </div>
        <div>
          <label className="label" htmlFor="role">
            Peran *
          </label>
          <select
            id="role"
            name="role"
            className="input"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="ASISTEN">Asisten Psikolog</option>
            <option value="PSIKOLOG">Psikolog</option>
            <option value="ADMIN">Administrator</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="password">
            Kata sandi awal * (min. 8 karakter)
          </label>
          <input id="password" name="password" type="text" className="input" placeholder="Kata sandi sementara" />
        </div>

        {role === "PSIKOLOG" && (
          <>
            <div className="sm:col-span-2">
              <p className="rounded-xl bg-paper-2 px-4 py-2.5 text-xs text-ink-soft">
                Profil psikolog akan tampil di halaman publik{" "}
                <span className="font-semibold">/tim</span>.
              </p>
            </div>
            <div>
              <label className="label" htmlFor="spesialisasi">
                Spesialisasi *
              </label>
              <input
                id="spesialisasi"
                name="spesialisasi"
                className="input"
                placeholder="mis. Psikolog Klinis"
              />
            </div>
            <div>
              <label className="label" htmlFor="gelar">
                Gelar
              </label>
              <input id="gelar" name="gelar" className="input" placeholder="M.Psi., Psikolog" />
            </div>
            <div>
              <label className="label" htmlFor="sipp">
                Nomor SIPP
              </label>
              <input id="sipp" name="sipp" className="input" placeholder="SIPP ..." />
            </div>
            <div>
              <label className="label" htmlFor="str">
                Nomor STR
              </label>
              <input id="str" name="str" className="input" placeholder="STR ..." />
            </div>
          </>
        )}
      </div>

      <button type="submit" disabled={pending} className="tombol tombol-utama mt-6 disabled:opacity-60">
        {pending ? "Menyimpan…" : "Buat akun"}
      </button>
    </form>
  );
}
