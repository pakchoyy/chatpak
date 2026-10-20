import { NextResponse } from "next/server";
import { codeOk } from "@/lib/auth";
import { generateImage, isChatDemo, isDemoMode, ProviderError } from "@/lib/provider";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_PROMPT = 1000;

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function POST(req: Request) {
  if (!codeOk(req)) return fail("Kode akses salah.", 401);

  const body = await req.json().catch(() => null);
  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) return fail("Prompt tidak boleh kosong.", 400);
  if (prompt.length > MAX_PROMPT) return fail(`Prompt maksimal ${MAX_PROMPT} karakter.`, 400);

  try {
    const { b64, mime } = await generateImage(prompt, req.signal);
    return NextResponse.json({ image: b64, mime, demo: isDemoMode() }, { headers: { "cache-control": "no-store" } });
  } catch (e) {
    if (e instanceof ProviderError) return fail(e.message, e.status);
    console.error(e);
    return fail("Terjadi kesalahan di server.", 500);
  }
}

// Dipakai klien untuk tahu apakah kode akses perlu diminta.
export async function GET() {
  return NextResponse.json({ needsCode: !!process.env.ACCESS_CODE, demo: isDemoMode(), chatDemo: isChatDemo() });
}
