"use client";

import { useEffect, useRef } from "react";
import { ArrowUpIcon, ImageIcon, StopIcon } from "./Icons";

export type Mode = "chat" | "image";

type Props = {
  value: string;
  mode: Mode;
  busy: boolean;
  onChange: (v: string) => void;
  onMode: (m: Mode) => void;
  onSubmit: () => void;
  onStop: () => void;
};

export default function Composer({ value, mode, busy, onChange, onMode, onSubmit, onStop }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [value]);

  const can = !busy && value.trim().length > 0;
  const image = mode === "image";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (can) onSubmit();
      }}
      className="pointer-events-auto rounded-3xl border border-line bg-surface p-2.5 shadow-[0_4px_24px_rgb(0_0_0/0.05)]"
    >
      <label htmlFor="prompt" className="sr-only">
        {image ? "Jelaskan gambar" : "Pesan"}
      </label>
      <textarea
        id="prompt"
        ref={ref}
        rows={1}
        value={value}
        maxLength={image ? 1000 : 8000}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          // Enter mengirim di keyboard fisik; di HP Enter tetap baris baru.
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && matchMedia("(pointer: fine)").matches) {
            e.preventDefault();
            if (can) onSubmit();
          }
        }}
        placeholder={image ? "Jelaskan gambar yang kamu mau" : "Tanya apa saja"}
        className="block max-h-40 min-h-12 w-full resize-none bg-transparent px-2.5 py-2 text-[17px] leading-6 outline-none placeholder:text-muted"
      />
      <div className="flex items-center justify-between gap-2 pt-1">
        <button
          type="button"
          aria-pressed={image}
          onClick={() => onMode(image ? "chat" : "image")}
          className={`flex h-10 items-center gap-1.5 rounded-full border px-3.5 text-[15px] transition-colors ${
            image ? "border-ink bg-ink text-bg" : "border-line text-muted active:bg-bubble"
          }`}
        >
          <ImageIcon size={18} />
          Gambar
        </button>
        {busy ? (
          <button
            type="button"
            onClick={onStop}
            aria-label="Hentikan"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-brand text-brand-ink active:scale-95"
          >
            <StopIcon />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!can}
            aria-label={image ? "Buat gambar" : "Kirim"}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-brand text-brand-ink transition active:scale-95 disabled:opacity-30"
          >
            <ArrowUpIcon />
          </button>
        )}
      </div>
    </form>
  );
}
