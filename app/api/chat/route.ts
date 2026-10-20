import { NextResponse } from "next/server";
import { codeOk } from "@/lib/auth";
import { chatStream, ProviderError, type ChatMessage } from "@/lib/provider";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_MESSAGES = 30;
const MAX_CHARS = 8000;

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function POST(req: Request) {
  if (!codeOk(req)) return fail("Kode akses salah.", 401);

  const body = await req.json().catch(() => null);
  const raw: unknown[] = Array.isArray(body?.messages) ? body.messages : [];
  const messages: ChatMessage[] = raw
    .filter(
      (m): m is ChatMessage =>
        !!m &&
        typeof m === "object" &&
        ((m as ChatMessage).role === "user" || (m as ChatMessage).role === "assistant") &&
        typeof (m as ChatMessage).content === "string",
    )
    .slice(-MAX_MESSAGES)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));

  if (!messages.length || messages.at(-1)!.role !== "user" || !messages.at(-1)!.content.trim())
    return fail("Pesan tidak boleh kosong.", 400);

  try {
    const stream = await chatStream(messages, req.signal);
    // Baca potongan pertama dulu: error di awal jadi respons 502 yang jelas,
    // bukan koneksi yang putus tanpa keterangan.
    const reader = stream.getReader();
    const first = await reader.read().catch((e) => {
      if ((e as Error).name === "AbortError") throw e;
      throw new ProviderError("Penyedia chat gagal merespons.", 502);
    });
    const body = new ReadableStream<Uint8Array>({
      start(ctrl) {
        if (first.done) ctrl.close();
        else ctrl.enqueue(first.value);
      },
      async pull(ctrl) {
        const { done, value } = await reader.read();
        if (done) ctrl.close();
        else ctrl.enqueue(value);
      },
      cancel(reason) {
        return reader.cancel(reason);
      },
    });
    return new Response(body, {
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
    });
  } catch (e) {
    if (e instanceof ProviderError) return fail(e.message, e.status);
    if ((e as Error).name === "AbortError") return new Response(null, { status: 499 });
    console.error(e);
    return fail("Terjadi kesalahan di server.", 500);
  }
}
