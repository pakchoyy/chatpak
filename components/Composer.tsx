"use client";

import { useEffect, useRef } from "react";
import { ArrowUpIcon } from "./Icons";

type Props = { value: string; loading: boolean; onChange: (v: string) => void; onSubmit: () => void };

export default function Composer({ value, loading, onChange, onSubmit }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  }, [value]);

  const can = !loading && value.trim().length > 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (can) onSubmit();
      }}
      className="pointer-events-auto rounded-3xl border border-line bg-surface p-3 shadow-[0_4px_24px_rgb(0_0_0/0.05)]"
    >
      <label htmlFor="prompt" className="sr-only">
        Prompt
      </label>
      <textarea
        id="prompt"
        ref={ref}
        rows={1}
        value={value}
        maxLength={1000}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Mau bikin gambar apa hari ini?"
        className="block max-h-36 min-h-12 w-full resize-none bg-transparent px-2 py-2 text-[17px] leading-6 outline-none placeholder:text-muted"
      />
      <div className="flex justify-end pt-1">
      <button
        type="submit"
        disabled={!can}
        aria-label="Buat gambar"
        className="grid size-11 shrink-0 place-items-center rounded-full bg-brand text-brand-ink transition active:scale-95 disabled:opacity-35"
      >
        {loading ? <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <ArrowUpIcon />}
      </button>
      </div>
    </form>
  );
}
