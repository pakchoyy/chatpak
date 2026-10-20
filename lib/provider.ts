// Satu-satunya tempat yang bicara dengan penyedia gambar.
// Ganti penyedia cukup lewat env (IMAGE_*). Tanpa IMAGE_API_KEY -> mode demo.

export type GeneratedImage = { b64: string; mime: string };

export class ProviderError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export const isDemoMode = () => !process.env.IMAGE_API_KEY;

export async function generateImage(prompt: string, signal?: AbortSignal): Promise<GeneratedImage> {
  if (isDemoMode()) return demoImage(prompt);

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 55_000);
  const onAbort = () => ctrl.abort();
  signal?.addEventListener("abort", onAbort);
  try {
    const res = await fetch(process.env.IMAGE_API_URL!, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${process.env.IMAGE_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.IMAGE_MODEL,
        prompt,
        n: 1,
        size: process.env.IMAGE_SIZE ?? "1024x1024",
        quality: process.env.IMAGE_QUALITY ?? "low",
      }),
      signal: ctrl.signal,
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("provider error", res.status, detail.slice(0, 500));
      if (res.status === 429) throw new ProviderError("Penyedia sedang membatasi permintaan. Coba lagi sebentar.", 429);
      if (res.status === 400 || res.status === 422)
        throw new ProviderError("Prompt ditolak oleh penyedia. Coba ubah kalimatnya.", 422);
      if (res.status === 401 || res.status === 402 || res.status === 403)
        throw new ProviderError("Akses ke penyedia ditolak. Periksa API key atau saldo.", 502);
      throw new ProviderError("Penyedia gambar gagal merespons.", 502);
    }

    const json = await res.json();
    const item = json?.data?.[0];
    if (item?.b64_json) return { b64: item.b64_json, mime: "image/png" };
    if (item?.url) {
      const img = await fetch(item.url, { signal: ctrl.signal });
      if (!img.ok) throw new ProviderError("Gagal mengunduh gambar dari penyedia.", 502);
      const buf = Buffer.from(await img.arrayBuffer());
      return { b64: buf.toString("base64"), mime: img.headers.get("content-type") ?? "image/png" };
    }
    throw new ProviderError("Respons penyedia tidak berisi gambar.", 502);
  } catch (e) {
    if (e instanceof ProviderError) throw e;
    if ((e as Error).name === "AbortError") throw new ProviderError("Waktu habis saat membuat gambar.", 502);
    console.error("provider fetch failed", e);
    throw new ProviderError("Tidak bisa menghubungi penyedia gambar.", 502);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}

// Gambar tiruan agar tampilan bisa dicoba tanpa API.
async function demoImage(prompt: string): Promise<GeneratedImage> {
  await new Promise((r) => setTimeout(r, 1800));
  let h = 0;
  for (const c of prompt) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const a = h % 360;
  const b = (a + 60 + (h % 80)) % 360;
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
  const lines = prompt.slice(0, 90).match(/.{1,26}(\s|$)/g) ?? [prompt];
  const text = lines
    .slice(0, 4)
    .map((l, i) => `<text x="64" y="${820 + i * 44}" font-size="32" fill="#fff" fill-opacity=".92" font-family="sans-serif">${esc(l.trim())}</text>`)
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${a} 70% 55%)"/><stop offset="1" stop-color="hsl(${b} 70% 35%)"/></linearGradient></defs>
<rect width="1024" height="1024" fill="url(#g)"/>
<circle cx="${300 + (h % 400)}" cy="${280 + (h % 200)}" r="${140 + (h % 80)}" fill="#fff" fill-opacity=".18"/>
<circle cx="${700 - (h % 200)}" cy="${500 + (h % 120)}" r="${90 + (h % 60)}" fill="#fff" fill-opacity=".14"/>
<text x="64" y="96" font-size="28" fill="#fff" fill-opacity=".7" font-family="sans-serif">MODE DEMO</text>
${text}</svg>`;
  return { b64: Buffer.from(svg).toString("base64"), mime: "image/svg+xml" };
}

// ---------- Chat ----------

export type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

const chatKey = () => process.env.CHAT_API_KEY || process.env.IMAGE_API_KEY;
const chatUrl = () =>
  process.env.CHAT_API_URL ||
  (process.env.IMAGE_API_URL ?? "").replace(/\/images\/generations\/?$/, "/chat/completions");

export const isChatDemo = () => !chatKey() || !process.env.CHAT_MODEL || !chatUrl();

const SYSTEM =
  "Kamu asisten yang ringkas dan membantu. Jawab dalam bahasa yang dipakai pengguna. Gunakan markdown bila membantu.";

// Mengembalikan stream teks biasa (potongan jawaban), siap diteruskan ke browser.
export async function chatStream(messages: ChatMessage[], signal: AbortSignal): Promise<ReadableStream<Uint8Array>> {
  if (isChatDemo()) return demoStream(messages.at(-1)?.content ?? "", signal);

  const res = await fetch(chatUrl(), {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${chatKey()}` },
    body: JSON.stringify({
      model: process.env.CHAT_MODEL,
      stream: true,
      messages: [{ role: "system", content: SYSTEM }, ...messages],
    }),
    signal,
  }).catch((e) => {
    if ((e as Error).name === "AbortError") throw e;
    console.error("chat fetch failed", e);
    throw new ProviderError("Tidak bisa menghubungi penyedia chat.", 502);
  });

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    console.error("chat provider error", res.status, detail.slice(0, 500));
    if (res.status === 429) throw new ProviderError("Penyedia sedang membatasi permintaan. Coba lagi sebentar.", 429);
    if (res.status === 401 || res.status === 402 || res.status === 403)
      throw new ProviderError("Akses ke penyedia ditolak. Periksa API key atau saldo.", 502);
    throw new ProviderError("Penyedia chat gagal merespons.", 502);
  }

  // Ubah SSE OpenAI ("data: {...}") menjadi teks polos.
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  let buf = "";
  const handle = (line: string, ctrl: TransformStreamDefaultController<Uint8Array>) => {
    const data = line.replace(/^data:\s*/, "").trim();
    if (!line.startsWith("data:") || !data || data === "[DONE]") return;
    let json;
    try {
      json = JSON.parse(data);
    } catch {
      return; // baris aneh: lewati
    }
    if (json?.error) {
      console.error("chat stream error", JSON.stringify(json.error).slice(0, 500));
      ctrl.error(new Error("provider stream error"));
      return;
    }
    const delta = json?.choices?.[0]?.delta?.content;
    if (delta) ctrl.enqueue(enc.encode(delta));
  };
  return res.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, ctrl) {
        buf += dec.decode(chunk, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) handle(line, ctrl);
      },
      flush(ctrl) {
        handle(buf + dec.decode(), ctrl);
      },
    }),
  );
}

function demoStream(question: string, signal: AbortSignal): ReadableStream<Uint8Array> {
  const text = `Ini **mode demo**, jadi jawabannya belum dari AI sungguhan.

Pertanyaanmu: _${question.slice(0, 120).replace(/[*_`]/g, "")}_

Setelah \`CHAT_MODEL\` dan API key diisi di Vercel, jawaban akan muncul di sini dengan cara yang sama:

1. Teks muncul bertahap.
2. Bisa dihentikan di tengah jalan.
3. Bisa disalin atau diulang.

\`\`\`js
console.log("contoh blok kode");
\`\`\``;
  const enc = new TextEncoder();
  const parts = text.match(/\S+\s*/g) ?? [text];
  let i = 0;
  return new ReadableStream({
    async pull(ctrl) {
      if (signal.aborted || i >= parts.length) return ctrl.close();
      await new Promise((r) => setTimeout(r, 35));
      ctrl.enqueue(enc.encode(parts[i++]));
    },
  });
}
