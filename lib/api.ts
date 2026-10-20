// Panggilan dari browser ke route handler kita sendiri.
import { toWebP } from "./image";

export const CODE_KEY = "access-code";

export const readCode = () => {
  try {
    return localStorage.getItem(CODE_KEY) ?? "";
  } catch {
    return "";
  }
};

export class AuthError extends Error {}

// fetch() gagal total (offline, koneksi putus) melempar TypeError tanpa pesan yang berguna.
async function send(url: string, body: unknown, signal: AbortSignal) {
  try {
    return await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-access-code": readCode() },
      body: JSON.stringify(body),
      signal,
    });
  } catch (e) {
    if (signal.aborted) throw e;
    throw new Error("Tidak bisa terhubung. Periksa koneksi internet, lalu coba lagi.");
  }
}

async function errorOf(res: Response, fallback: string) {
  if (res.status === 401) return new AuthError("Kode akses salah.");
  const j = await res.json().catch(() => ({}));
  return new Error(j.error ?? fallback);
}

export async function streamChat(
  messages: { role: "user" | "assistant"; content: string }[],
  signal: AbortSignal,
  onText: (full: string) => void,
): Promise<string> {
  const res = await send("/api/chat", { messages }, signal);
  if (!res.ok || !res.body) throw await errorOf(res, "Gagal mendapat jawaban.");
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let full = "";
  for (;;) {
    let chunk;
    try {
      chunk = await reader.read();
    } catch (e) {
      if (signal.aborted) throw e;
      throw new Error("Jawaban terputus. Coba lagi.");
    }
    if (chunk.done) break;
    full += dec.decode(chunk.value, { stream: true });
    onText(full);
  }
  return full;
}

export async function makeImage(prompt: string, signal: AbortSignal): Promise<Blob> {
  const res = await send("/api/generate", { prompt }, signal);
  if (!res.ok) throw await errorOf(res, "Gagal membuat gambar.");
  const j = await res.json();
  return toWebP(j.image, j.mime);
}
