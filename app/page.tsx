"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AccessGate from "@/components/AccessGate";
import History from "@/components/History";
import PromptForm from "@/components/PromptForm";
import ResultView, { type Shown } from "@/components/ResultView";
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

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shown, setShown] = useState<Shown | null>(null);
  const [activeId, setActiveId] = useState<string>();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [needsCode, setNeedsCode] = useState(false);
  const [wrongCode, setWrongCode] = useState(false);
  const [demo, setDemo] = useState(false);
  const [used, setUsed] = useState(0);
  const urls = useRef<string[]>([]);

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

  async function generate() {
    const text = prompt.trim();
    if (!text || loading) return;
    if (usedToday() >= DAILY_LIMIT && !confirm(`Sudah ${DAILY_LIMIT} gambar hari ini. Lanjut?`)) return;

    setLoading(true);
    setError(null);
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
        setWrongCode(true);
        setNeedsCode(true);
        return;
      }
      if (!res.ok) throw new Error(json.error ?? "Gagal membuat gambar.");

      const blob = await toWebP(json.image, json.mime);
      const item: Item = { id: crypto.randomUUID(), prompt: text, createdAt: Date.now(), blob };
      bump();
      setUsed(usedToday());
      const entry = toEntry(item);
      setShown(entry);
      setActiveId(item.id);
      try {
        await addItem(item);
        setEntries((await listItems()).map(toEntry));
      } catch {
        setError("Riwayat tidak bisa disimpan di browser ini, tapi gambar tetap bisa diunduh.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal membuat gambar.");
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Hapus gambar ini dari riwayat?")) return;
    await removeItem(id).catch(() => {});
    setEntries((e) => e.filter((x) => x.id !== id));
    if (id === activeId) {
      setShown(null);
      setActiveId(undefined);
    }
  }

  function open(id: string) {
    const it = entries.find((x) => x.id === id);
    if (!it) return;
    setShown({ prompt: it.prompt, url: it.url, createdAt: it.createdAt });
    setActiveId(id);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="mx-auto w-full max-w-xl space-y-6 px-4 pb-16 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <header className="flex items-baseline justify-between">
        <h1 className="text-lg font-semibold tracking-tight">Gambar</h1>
        <p className="text-xs text-muted">
          {demo && "Mode demo · "}
          {used}/{DAILY_LIMIT} hari ini
        </p>
      </header>

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
      ) : (
        <>
          <ResultView loading={loading} error={error} shown={shown} onRetry={generate} />
          <PromptForm value={prompt} loading={loading} onChange={setPrompt} onSubmit={generate} />
        </>
      )}

      <History items={entries} activeId={activeId} onOpen={open} onDelete={remove} />
    </main>
  );
}
