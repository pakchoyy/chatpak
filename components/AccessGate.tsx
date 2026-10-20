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
      className="space-y-3 rounded-2xl border border-line bg-surface p-4"
    >
      <label htmlFor="code" className="text-sm text-muted">
        Masukkan kode akses
      </label>
      <input
        id="code"
        type="password"
        autoComplete="off"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="w-full rounded-xl border border-line bg-bg p-3 text-base outline-none focus:border-ink"
      />
      {wrong && <p className="text-sm text-danger">Kode salah.</p>}
      <button className="min-h-12 w-full rounded-xl bg-accent font-medium text-accent-ink active:opacity-80">Masuk</button>
    </form>
  );
}
