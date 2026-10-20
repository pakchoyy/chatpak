"use client";

import type { Item } from "@/lib/db";

type Props = {
  items: (Item & { url: string })[];
  activeId?: string;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
};

export default function History({ items, activeId, onOpen, onDelete }: Props) {
  return (
    <section aria-label="Riwayat" className="space-y-3">
      <h2 className="text-sm font-medium text-muted">Riwayat</h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted">Belum ada gambar.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3">
          {items.map((it) => (
            <li key={it.id} className="space-y-2">
              <button
                onClick={() => onOpen(it.id)}
                aria-label={`Buka: ${it.prompt}`}
                className={`block aspect-square w-full overflow-hidden rounded-xl border bg-surface active:opacity-70 ${
                  it.id === activeId ? "border-ink" : "border-line"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.url} alt="" loading="lazy" className="h-full w-full object-cover" />
              </button>
              <div className="flex items-start justify-between gap-2">
                <p className="line-clamp-2 flex-1 text-xs text-muted">{it.prompt}</p>
                <button
                  onClick={() => onDelete(it.id)}
                  aria-label="Hapus"
                  className="-m-2 grid size-9 shrink-0 place-items-center rounded-full text-muted active:opacity-60"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
