"use client";

import type { Mode } from "./Composer";
import { ImageIcon } from "./Icons";

const ITEMS: { mode: Mode; text: string }[] = [
  { mode: "chat", text: "Jelaskan cara kerja PWA dengan bahasa sederhana" },
  { mode: "image", text: "Kucing oranye tidur di atas tumpukan buku, gaya cat air" },
  { mode: "chat", text: "Bantu tulis caption jualan kue untuk Instagram" },
  { mode: "image", text: "Poster minimalis kopi pagi dengan warna hangat" },
];

// Mengisi kolom prompt saja, tidak langsung mengirim, supaya saldo tidak terpakai tanpa sengaja.
export default function Suggestions({ onPick }: { onPick: (mode: Mode, text: string) => void }) {
  return (
    <ul className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
      {ITEMS.map((it) => (
        <li key={it.text}>
          <button
            onClick={() => onPick(it.mode, it.text)}
            className="flex min-h-14 w-full items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-left text-[15px] leading-5 active:bg-bubble"
          >
            {it.mode === "image" && <span className="shrink-0 text-muted"><ImageIcon size={18} /></span>}
            {it.text}
          </button>
        </li>
      ))}
    </ul>
  );
}
