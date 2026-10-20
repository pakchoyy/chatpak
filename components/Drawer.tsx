"use client";

import { useEffect } from "react";
import type { Item } from "@/lib/db";
import { NewIcon, TrashIcon } from "./Icons";

type Entry = Item & { url: string };

type Props = {
  open: boolean;
  items: Entry[];
  activeId?: string;
  used: number;
  limit: number;
  demo: boolean;
  onClose: () => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
};

export default function Drawer({ open, items, activeId, used, limit, demo, onClose, onOpen, onDelete, onNew }: Props) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  return (
    <div className={`fixed inset-0 z-40 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`}
      />
      <aside
        inert={!open}
        aria-label="Riwayat"
        className={`absolute inset-y-0 left-0 flex w-[82%] max-w-sm flex-col bg-bg transition-transform duration-200 ${
          open ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        <div className="px-5 pb-3 pt-[max(1.25rem,env(safe-area-inset-top))]">
          <h2 className="text-2xl font-semibold tracking-tight">Gambar</h2>
          <p className="mt-1 text-sm text-muted">
            {demo && "Mode demo · "}
            {used}/{limit} hari ini
          </p>
        </div>

        <p className="px-5 pb-2 pt-4 text-[15px] font-semibold">Riwayat</p>
        <ul className="flex-1 space-y-1 overflow-y-auto px-3 pb-28">
          {items.length === 0 && <li className="px-2 py-3 text-[15px] text-muted">Belum ada gambar.</li>}
          {items.map((it) => (
            <li key={it.id} className="flex items-center gap-1">
              <button
                onClick={() => onOpen(it.id)}
                className={`flex min-h-14 flex-1 items-center gap-3 rounded-2xl px-2 text-left active:opacity-60 ${
                  it.id === activeId ? "bg-bubble" : ""
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.url} alt="" className="size-10 shrink-0 rounded-lg object-cover" />
                <span className="line-clamp-2 text-[16px] leading-5">{it.prompt}</span>
              </button>
              <button
                onClick={() => onDelete(it.id)}
                aria-label="Hapus"
                className="grid size-11 shrink-0 place-items-center rounded-full text-muted active:opacity-60"
              >
                <TrashIcon />
              </button>
            </li>
          ))}
        </ul>

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg via-bg/95 to-transparent px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-8">
          <button
            onClick={onNew}
            className="flex h-14 items-center gap-2.5 rounded-full bg-brand px-6 text-[17px] font-semibold text-brand-ink shadow-lg active:scale-95"
          >
            <NewIcon />
            Gambar baru
          </button>
        </div>
      </aside>
    </div>
  );
}
