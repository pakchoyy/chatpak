"use client";

import { useState } from "react";

export default function AccessGate({ onSubmit, wrong }: { onSubmit: (code: string) => void; wrong: boolean }) {
  const [code, setCode] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (code.trim()) onSubmit(code.trim());
      }}
      className="mx-auto mt-24 w-full max-w-sm space-y-3 text-center"
    >
      <h2 className="text-2xl font-semibold tracking-tight">Masukkan kode akses</h2>
      <label htmlFor="code" className="sr-only">
        Kode akses
      </label>
      <input
        id="code"
        type="password"
        autoComplete="off"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="h-14 w-full rounded-full border border-line bg-surface px-5 text-center text-[17px] outline-none focus:border-ink"
      />
      {wrong && <p className="text-sm text-danger">Kode salah.</p>}
      <button className="h-14 w-full rounded-full bg-brand text-[17px] font-semibold text-brand-ink active:opacity-80">Masuk</button>
    </form>
  );
}
