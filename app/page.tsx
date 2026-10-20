"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AccessGate from "@/components/AccessGate";
import Composer, { type Mode } from "@/components/Composer";
import Drawer from "@/components/Drawer";
import { MenuIcon, NewIcon } from "@/components/Icons";
import ImageViewer from "@/components/ImageViewer";
import MessageView, { type ViewMsg } from "@/components/MessageView";
import Suggestions from "@/components/Suggestions";
import { useInstall } from "@/hooks/useInstall";
import { AuthError, CODE_KEY, makeImage, readCode, streamChat } from "@/lib/api";
import { deleteChat, listChats, saveChat, type Chat, type Msg } from "@/lib/db";
import { bump, DAILY_LIMIT, usedToday } from "@/lib/quota";

type Live = Omit<Chat, "messages"> & { messages: ViewMsg[] };

// Satu object URL per Blob, dipakai ulang di riwayat dan percakapan.
const urls = new WeakMap<Blob, string>();
const urlOf = (b?: Blob) => {
  if (!b) return undefined;
  let u = urls.get(b);
  if (!u) urls.set(b, (u = URL.createObjectURL(b)));
  return u;
};
const toLive = (c: Chat): Live => ({ ...c, messages: c.messages.map((m) => ({ ...m, url: urlOf(m.blob) })) });
// Balasan yang terputus disimpan dengan keterangan, supaya tidak tampil "memuat" selamanya.
const toStored = (c: Live): Chat => ({
  ...c,
  messages: c.messages.map(({ id, role, kind, text, blob, error }) => {
    const unfinished = role === "assistant" && !error && (kind === "image" ? !blob : !text);
    return { id, role, kind, text, blob, error: unfinished ? "Dihentikan." : error };
  }),
});

function greeting() {
  const h = new Date().getHours();
  return h < 11 ? "Selamat pagi" : h < 15 ? "Selamat siang" : h < 18 ? "Selamat sore" : "Selamat malam";
}

// Riwayat teks yang dikirim ke model. Gambar diganti keterangan singkat.
function history(msgs: ViewMsg[]) {
  return msgs
    .filter((m) => !m.error && (m.text || m.kind === "image"))
    .map((m) => ({
      role: m.role,
      content:
        m.kind === "image" ? (m.role === "user" ? `Buatkan gambar: ${m.text}` : `[Gambar dibuat: ${m.text}]`) : m.text,
    }));
}

const roundBtn = "grid size-12 place-items-center rounded-full active:bg-bubble";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<Mode>("chat");
  const [chat, setChat] = useState<Live | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [busy, setBusy] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [viewer, setViewer] = useState<{ url: string; alt: string } | null>(null);
  const [needsCode, setNeedsCode] = useState(false);
  const [wrongCode, setWrongCode] = useState(false);
  const [demo, setDemo] = useState(false);
  const [used, setUsed] = useState(0);
  const [hello, setHello] = useState("Halo");
  const chatRef = useRef<Live | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const { mode: installMode, install } = useInstall();

  const commit = useCallback((next: Live | null) => {
    chatRef.current = next;
    setChat(next);
  }, []);

  const patch = useCallback(
    (id: string, p: Partial<ViewMsg>) => {
      const c = chatRef.current;
      if (c) commit({ ...c, messages: c.messages.map((m) => (m.id === id ? { ...m, ...p } : m)) });
    },
    [commit],
  );

  const persist = useCallback(async (c: Live | null = chatRef.current) => {
    if (!c) return;
    const stored = toStored({ ...c, updatedAt: Date.now() });
    setChats((list) => [stored, ...list.filter((x) => x.id !== stored.id)]);
    await saveChat(stored).catch(() => {});
  }, []);

  useEffect(() => {
    setUsed(usedToday());
    setHello(greeting());
    listChats()
      .then(setChats)
      .catch(() => {});
    fetch("/api/generate")
      .then((r) => r.json())
      .then((j) => {
        setDemo(!!j.demo || !!j.chatDemo);
        setNeedsCode(!!j.needsCode && !readCode());
      })
      .catch(() => {});
    navigator.storage?.persist?.().catch(() => {});
  }, []);

  // Ikuti pesan terbaru selama pengguna memang sedang di bawah.
  useEffect(() => {
    const nearBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 200;
    if (nearBottom) endRef.current?.scrollIntoView({ block: "end" });
  }, [chat]);

  const run = useCallback(async (id: string) => {
    const c = chatRef.current;
    const idx = c?.messages.findIndex((m) => m.id === id) ?? -1;
    if (!c || idx < 0) return;
    const target = c.messages[idx];

    if (target.kind === "image") {
      if (usedToday() >= DAILY_LIMIT && !confirm(`Sudah ${DAILY_LIMIT} gambar hari ini. Lanjut?`)) {
        patch(id, { pending: false, error: "Dibatalkan." });
        return persist();
      }
      // Dihitung saat dikirim: penyedia bisa tetap menagih walau dihentikan atau gagal.
      bump();
      setUsed(usedToday());
    }

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setBusy(true);
    patch(id, { pending: true, error: undefined, blob: undefined, url: undefined, ...(target.kind === "text" && { text: "" }) });

    try {
      if (target.kind === "image") {
        const blob = await makeImage(target.text, ctrl.signal);
        patch(id, { blob, url: urlOf(blob) });
      } else {
        const full = await streamChat(history(c.messages.slice(0, idx)), ctrl.signal, (text) => patch(id, { text }));
        if (!full.trim()) patch(id, { error: "Penyedia tidak mengirim jawaban. Coba lagi." });
      }
    } catch (e) {
      if (ctrl.signal.aborted) {
        const cur = chatRef.current?.messages.find((m) => m.id === id);
        if (target.kind === "image" || !cur?.text) patch(id, { error: "Dihentikan." });
      } else if (e instanceof AuthError) {
        try {
          localStorage.removeItem(CODE_KEY);
        } catch {}
        setWrongCode(true);
        setNeedsCode(true);
        patch(id, { error: "Masukkan kode akses, lalu ketuk ulangi." });
      } else {
        patch(id, { error: e instanceof Error ? e.message : "Terjadi kesalahan." });
      }
    } finally {
      patch(id, { pending: false });
      abortRef.current = null;
      setBusy(false);
      // Jika pengguna sudah pindah percakapan, versi terakhir sudah disimpan oleh leave().
      if (chatRef.current?.id === c.id) await persist();
    }
  }, [patch, persist]);

  const openImage = useCallback((url: string, alt: string) => setViewer({ url, alt }), []);

  function submit() {
    const text = prompt.trim();
    if (!text || busy) return;
    const now = Date.now();
    const base: Live = chatRef.current ?? {
      id: crypto.randomUUID(),
      title: text.slice(0, 60),
      createdAt: now,
      updatedAt: now,
      messages: [],
    };
    const kind = mode === "image" ? "image" : "text";
    const reply: ViewMsg = {
      id: crypto.randomUUID(),
      role: "assistant",
      kind,
      text: mode === "image" ? text : "",
      pending: true,
    };
    commit({
      ...base,
      messages: [...base.messages, { id: crypto.randomUUID(), role: "user", kind, text }, reply],
    });
    setPrompt("");
    requestAnimationFrame(() => endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" }));
    run(reply.id);
  }

  // Hentikan balasan yang sedang berjalan dan simpan apa yang sudah ada.
  function leave() {
    if (!abortRef.current) return;
    abortRef.current.abort();
    persist();
  }

  function newChat() {
    leave();
    commit(null);
    setDrawer(false);
  }

  function open(id: string) {
    // Percakapan yang sedang tampil: cukup tutup menu, jangan hentikan balasannya.
    if (chatRef.current?.id === id) return setDrawer(false);
    leave();
    const c = chats.find((x) => x.id === id);
    if (c) commit(toLive(c));
    setDrawer(false);
    requestAnimationFrame(() => endRef.current?.scrollIntoView({ block: "end" }));
  }

  async function remove(id: string) {
    if (!confirm("Hapus percakapan ini?")) return;
    if (chatRef.current?.id === id) {
      abortRef.current?.abort(); // tanpa menyimpan: percakapan ini memang dihapus
      commit(null);
    }
    const gone = chats.find((x) => x.id === id);
    await deleteChat(id).catch(() => {});
    setChats((l) => l.filter((x) => x.id !== id));
    gone?.messages.forEach((m) => {
      const u = m.blob && urls.get(m.blob);
      if (u) URL.revokeObjectURL(u);
    });
  }

  const msgs = chat?.messages ?? [];
  const lastAssistant = msgs.findLast((m: Msg) => m.role === "assistant")?.id;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-bg/85 px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur">
        <button onClick={() => setDrawer(true)} aria-label="Buka riwayat" className={roundBtn}>
          <MenuIcon />
        </button>
        <h1 className="max-w-[60%] truncate px-2 text-[15px] font-medium">
          {chat?.title ?? <span className="text-muted">Obrolan baru</span>}
        </h1>
        <button onClick={newChat} aria-label="Obrolan baru" className={roundBtn}>
          <NewIcon />
        </button>
      </header>

      <main className="flex-1 px-4 pb-48 pt-2">
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
        ) : msgs.length === 0 ? (
          <div className="flex flex-col items-center gap-8 pt-[14vh]">
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="text-ink">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="9" cy="9" r="1.6" />
                  <path d="M4 17l5-5 4 4 3-3 4 4" />
                </svg>
              </span>
              <p className="font-serif text-[28px] tracking-tight">{hello}</p>
              <p className="text-[15px] text-muted">Mau ngobrol atau bikin gambar?</p>
            </div>
            <Suggestions
              onPick={(m, t) => {
                setMode(m);
                setPrompt(t);
                document.getElementById("prompt")?.focus();
              }}
            />
          </div>
        ) : (
          <div className="space-y-6" aria-live="polite">
            {msgs.map((m) => (
              <MessageView
                key={m.id}
                msg={m}
                last={m.id === lastAssistant}
                busy={busy}
                onRetry={run}
                onOpenImage={openImage}
              />
            ))}
          </div>
        )}
        <div ref={endRef} />
      </main>

      {!needsCode && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-10 bg-gradient-to-t from-bg via-bg/90 to-transparent px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-8">
          <div className="mx-auto max-w-2xl">
            <Composer
              value={prompt}
              mode={mode}
              busy={busy}
              onChange={setPrompt}
              onMode={setMode}
              onSubmit={submit}
              onStop={() => abortRef.current?.abort()}
            />
          </div>
        </div>
      )}

      <Drawer
        open={drawer}
        chats={chats}
        activeId={chat?.id}
        used={used}
        limit={DAILY_LIMIT}
        demo={demo}
        install={installMode}
        onInstall={install}
        onClose={() => setDrawer(false)}
        onOpen={open}
        onDelete={remove}
        onNew={newChat}
      />

      {viewer && <ImageViewer url={viewer.url} alt={viewer.alt} onClose={() => setViewer(null)} />}
    </div>
  );
}
