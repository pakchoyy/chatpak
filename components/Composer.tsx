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
      className="pointer-events-auto flex items-end gap-2 rounded-[28px] border border-line bg-surface py-2 pl-5 pr-2 shadow-[0_4px_24px_rgb(0_0_0/0.06)]"
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
        placeholder="Jelaskan gambarnya…"
        className="max-h-36 min-h-11 flex-1 resize-none bg-transparent py-2.5 text-[17px] leading-6 outline-none placeholder:text-muted"
      />
      <button
        type="submit"
        disabled={!can}
        aria-label="Buat gambar"
        className="grid size-11 shrink-0 place-items-center rounded-full bg-brand text-brand-ink transition active:scale-95 disabled:opacity-35"
      >
        {loading ? <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <ArrowUpIcon />}
      </button>
    </form>
  );
}
