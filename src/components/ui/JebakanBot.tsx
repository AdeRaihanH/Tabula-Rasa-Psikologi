"use client";

import { useEffect, useRef } from "react";

import { FIELD_JEBAKAN, FIELD_WAKTU } from "@/lib/keamanan/konstanta";

/**
 * Perlindungan bot untuk formulir publik.
 *
 * Menyisipkan dua hal yang tidak terlihat pengguna:
 *  1. Field jebakan (`situs_web`) — disembunyikan dari layar; hanya bot yang
 *     mengisinya.
 *  2. Penanda waktu render (`_waktu`) — dipakai server untuk menolak pengiriman
 *     yang terlalu cepat.
 */
export function JebakanBot() {
  const inputWaktu = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputWaktu.current) {
      inputWaktu.current.value = String(Date.now());
    }
  }, []);

  return (
    <>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-9999px",
          top: "auto",
          width: 1,
          height: 1,
          overflow: "hidden",
        }}
      >
        <label htmlFor="situs_web">Jangan diisi kolom ini</label>
        <input
          id="situs_web"
          name={FIELD_JEBAKAN}
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <input ref={inputWaktu} type="hidden" name={FIELD_WAKTU} defaultValue="" />
    </>
  );
}
