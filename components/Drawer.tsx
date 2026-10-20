"use client";

import { useEffect, useMemo, useState } from "react";
import type { Chat } from "@/lib/db";
import { ImageIcon, InstallIcon, NewIcon, SearchIcon, ShareIcon, TrashIcon } from "./Icons";

type Props = {
  open: boolean;
  chats: Chat[];
  activeId?: string;
  used: number;
  limit: number;
  demo: boolean;
  install: "native" | "ios" | "manual" | null;
  onInstall: () => void;
  onClose: () => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
};

const DAY = 86_400_000;

function group(t: number) {
  const start = new Date().setHours(0, 0, 0, 0);
  if (t >= start) return "Hari ini";
  if (t >= start - DAY) return "Kemarin";
  if (t >= start - 7 * DAY) return "7 hari terakhir";
  return "Lebih lama";
}

export default function Drawer(p: Props) {
  const { open, onClose } = p;
  const [q, setQ] = useState("");
  const [iosHelp, setIosHelp] = useState(false);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const out: [string, Chat[]][] = [];
    for (const c of p.chats) {
      if (needle && !c.title.toLowerCase().includes(needle)) continue;
      const g = group(c.updatedAt);
      const last = out.at(-1);
      if (last?.[0] === g) last[1].push(c);
      else out.push([g, [c]]);
    }
    return out;
  }, [p.chats, q]);

  return (
    <div className={`fixed inset-0 z-40 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/45 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`}
      />
      <aside
        inert={!open}
        aria-label="Riwayat percakapan"
        className={`absolute inset-y-0 left-0 flex w-[84%] max-w-sm flex-col bg-bg transition-transform duration-200 ${
          open ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        <div className="px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
          <label className="flex h-12 items-center gap-2 rounded-full bg-bubble px-4 text-muted">
            <SearchIcon />
            <span className="sr-only">Cari percakapan</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari"
              className="w-full bg-transparent text-[16px] text-ink outline-none placeholder:text-muted"
            />
          </label>
        </div>

        {p.install && (
          <div className="px-3">
            <button
              onClick={() => (p.install === "native" ? p.onInstall() : setIosHelp((v) => !v))}
              className="flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 text-left text-[16px] active:bg-bubble"
            >
              <InstallIcon />
              Pasang aplikasi
            </button>
            {iosHelp && (
              <p className="mx-3 mb-2 rounded-2xl bg-surface p-3 text-[14px] leading-5 text-muted">
                {p.install === "ios" ? (
                  <>Di Safari, ketuk <ShareIcon size={14} /> Bagikan, lalu pilih <b className="text-ink">Tambah ke Layar Utama</b>.</>
                ) : (
                  <>Di Chrome, ketuk menu <b className="text-ink">⋮</b> di kanan atas, lalu pilih <b className="text-ink">Instal aplikasi</b> atau <b className="text-ink">Tambahkan ke layar utama</b>. Kalau versi lama sudah terpasang, hapus dulu dari layar utama.</>
                )}
              </p>
            )}
          </div>
        )}

        <nav className="flex-1 overflow-y-auto px-3 pb-32">
          {groups.length === 0 && (
            <p className="px-3 py-4 text-[15px] text-muted">{q ? "Tidak ada yang cocok." : "Belum ada percakapan."}</p>
          )}
          {groups.map(([label, list]) => (
            <section key={label} className="pt-3">
              <h3 className="px-3 pb-1 text-[13px] font-medium text-muted">{label}</h3>
              <ul>
                {list.map((c) => {
                  const hasImage = c.messages.some((m) => m.kind === "image");
                  return (
                    <li key={c.id} className="group flex items-center">
                      <button
                        onClick={() => p.onOpen(c.id)}
                        aria-current={c.id === p.activeId ? "page" : undefined}
                        className={`flex min-h-12 flex-1 items-center gap-2.5 truncate rounded-2xl px-3 text-left text-[16px] active:bg-bubble ${
                          c.id === p.activeId ? "bg-bubble" : ""
                        }`}
                      >
                        {hasImage && <span className="shrink-0 text-muted"><ImageIcon size={16} /></span>}
                        <span className="truncate">{c.title}</span>
                      </button>
                      <button
                        onClick={() => p.onDelete(c.id)}
                        aria-label={`Hapus ${c.title}`}
                        className="grid size-11 shrink-0 place-items-center rounded-full text-muted active:bg-bubble"
                      >
                        <TrashIcon />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </nav>

        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-bg via-bg/95 to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-8">
          <button
            onClick={p.onNew}
            className="flex h-13 shrink-0 items-center gap-2.5 whitespace-nowrap rounded-full bg-brand px-5 text-[16px] font-semibold text-brand-ink shadow-lg active:scale-95"
          >
            <NewIcon size={20} />
            Obrolan baru
          </button>
          <p className="text-right text-[13px] leading-[18px] text-muted">
            {p.demo && <>Mode demo<br /></>}
            Gambar {p.used}/{p.limit}
          </p>
        </div>
      </aside>
    </div>
  );
}
