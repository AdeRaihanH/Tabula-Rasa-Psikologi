"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

/** Ikon mata (terbuka) — tampilkan kata sandi. */
function IkonMata() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/** Ikon mata dicoret — sembunyikan kata sandi. */
function IkonMataTertutup() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9.9 4.24A9.1 9.1 0 0112 4c6.5 0 10 7 10 7a17.6 17.6 0 01-2.16 3.19M6.61 6.61A17.6 17.6 0 002 11s3.5 7 10 7a9.1 9.1 0 004.24-1" />
      <path d="M14.12 14.12a3 3 0 11-4.24-4.24" />
      <path d="M2 2l20 20" />
    </svg>
  );
}

/**
 * Input kata sandi dengan tombol mata untuk menampilkan/menyembunyikan isinya.
 *
 * Tombol memakai `type="button"` agar tidak ikut mengirim formulir, dan
 * `aria-label`/`aria-pressed` supaya dapat dipakai pembaca layar.
 */
export function InputSandi({
  id,
  name,
  placeholder = "••••••••",
  autoComplete,
  defaultValue,
  required = true,
  className,
}: {
  id: string;
  name: string;
  placeholder?: string;
  autoComplete?: string;
  defaultValue?: string;
  required?: boolean;
  className?: string;
}) {
  const [terlihat, setTerlihat] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={terlihat ? "text" : "password"}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className={cn("input pr-11", className)}
      />
      <button
        type="button"
        onClick={() => setTerlihat((v) => !v)}
        aria-label={terlihat ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
        aria-pressed={terlihat}
        title={terlihat ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
        className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-muted transition-colors hover:bg-paper-2 hover:text-ink-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-400"
      >
        {terlihat ? <IkonMataTertutup /> : <IkonMata />}
      </button>
    </div>
  );
}
