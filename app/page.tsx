"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AccessGate from "@/components/AccessGate";
import Composer from "@/components/Composer";
import Drawer from "@/components/Drawer";
import { MenuIcon, NewIcon } from "@/components/Icons";
import TurnView, { type Turn } from "@/components/TurnView";
import { addItem, listItems, removeItem, type Item } from "@/lib/db";
import { toWebP } from "@/lib/image";
import { bump, DAILY_LIMIT, usedToday } from "@/lib/quota";

type Entry = Item & { url: string };

const CODE_KEY = "access-code";
const read = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};

const roundBtn =
  "grid size-12 place-items-center rounded-full border border-line bg-surface active:scale-95";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [activeId, setActiveId] = useState<string>();
  const [drawer, setDrawer] = useState(false);
  const [needsCode, setNeedsCode] = useState(false);
  const [wrongCode, setWrongCode] = useState(false);
  const [demo, setDemo] = useState(false);
  const [used, setUsed] = useState(0);
  const urls = useRef<string[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  const toEntry = useCallback((it: Item): Entry => {
    const url = URL.createObjectURL(it.blob);
    urls.current.push(url);
    return { ...it, url };
  }, []);

  useEffect(() => {
    setUsed(usedToday());
    listItems()
      .then((l) => setEntries(l.map(toEntry)))
      .catch(() => {});
    fetch("/api/generate")
      .then((r) => r.json())
      .then((j) => {
        setDemo(!!j.demo);
        setNeedsCode(!!j.needsCode && !read(CODE_KEY));
      })
      .catch(() => {});
    navigator.storage?.persist?.().catch(() => {});
    const u = urls.current;
    return () => u.forEach(URL.revokeObjectURL);
  }, [toEntry]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns]);

  const patch = (key: string, p: Partial<Turn>) =>
    setTurns((t) => t.map((x) => (x.key === key ? { ...x, ...p } : x)));

  async function run(text: string, key: string) {
    if (usedToday() >= DAILY_LIMIT && !confirm(`Sudah ${DAILY_LIMIT} gambar hari ini. Lanjut?`)) {
      patch(key, { error: "Dibatalkan." });
      return;
    }
    setBusy(true);
    patch(key, { error: undefined });
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json", "x-access-code": read(CODE_KEY) ?? "" },
        body: JSON.stringify({ prompt: text }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 401) {
        try {
          localStorage.removeItem(CODE_KEY);
        } catch {}
        setTurns((t) => t.filter((x) => x.key !== key));
        setWrongCode(true);
        setNeedsCode(true);
        return;
      }
      if (!res.ok) throw new Error(json.error ?? "Gagal membuat gambar.");

      const blob = await toWebP(json.image, json.mime);
      const item: Item = { id: crypto.randomUUID(), prompt: text, createdAt: Date.now(), blob };
      bump();
      setUsed(usedToday());
      patch(key, { url: toEntry(item).url, createdAt: item.createdAt });
      setActiveId(item.id);
      try {
        await addItem(item);
        setEntries((await listItems()).map(toEntry));
      } catch {
        // riwayat gagal disimpan; gambar tetap tampil dan bisa diunduh
      }
    } catch (e) {
      patch(key, { error: e instanceof Error ? e.message : "Gagal membuat gambar." });
    } finally {
      setBusy(false);
    }
  }

  function submit() {
    const text = prompt.trim();
    if (!text || busy) return;
    const key = crypto.randomUUID();
    setTurns((t) => [...t, { key, prompt: text, createdAt: Date.now() }]);
    setPrompt("");
    run(text, key);
  }

  function reset() {
    setTurns([]);
    setActiveId(undefined);
    setDrawer(false);
  }

  async function remove(id: string) {
    if (!confirm("Hapus gambar ini dari riwayat?")) return;
    await removeItem(id).catch(() => {});
    setEntries((e) => e.filter((x) => x.id !== id));
    if (id === activeId) reset();
  }

  function open(id: string) {
    const it = entries.find((x) => x.id === id);
    if (!it) return;
    setTurns([{ key: id, prompt: it.prompt, createdAt: it.createdAt, url: it.url }]);
    setActiveId(id);
    setDrawer(false);
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button onClick={() => setDrawer(true)} aria-label="Buka riwayat" className={roundBtn}>
          <MenuIcon />
        </button>
        <h1 className="text-[17px] font-semibold">Gambar</h1>
        <button onClick={reset} aria-label="Gambar baru" className={roundBtn}>
          <NewIcon />
        </button>
      </header>

      <main className="flex-1 space-y-8 px-4 pb-40 pt-4">
        {needsCode ? (
          <AccessGate
            wrong={wrongCode}
            onSubmit={(c) => {
              try {
                localStorage.setItem(CODE_KEY, c);
              } catch {}
              setWrongCode(false);
              setNeedsCode(false);
            }}
          />
        ) : turns.length === 0 ? (
          <p className="pt-[22vh] text-center text-3xl font-semibold tracking-tight">Mau bikin gambar apa?</p>
        ) : (
          turns.map((t) => <TurnView key={t.key} turn={t} onRetry={(x) => run(x.prompt, x.key)} />)
        )}
        <div ref={endRef} />
      </main>

      {!needsCode && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-10 bg-gradient-to-t from-bg via-bg/90 to-transparent px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-8">
          <div className="mx-auto max-w-xl">
            <Composer value={prompt} loading={busy} onChange={setPrompt} onSubmit={submit} />
          </div>
        </div>
      )}

      <Drawer
        open={drawer}
        items={entries}
        activeId={activeId}
        used={used}
        limit={DAILY_LIMIT}
        demo={demo}
        onClose={() => setDrawer(false)}
        onOpen={open}
        onDelete={remove}
        onNew={reset}
      />
    </div>
  );
}
