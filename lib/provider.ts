// Satu-satunya tempat yang bicara dengan penyedia gambar.
// Ganti penyedia cukup lewat env (IMAGE_*). Tanpa IMAGE_API_KEY -> mode demo.

export type GeneratedImage = { b64: string; mime: string };

export class ProviderError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export const isDemoMode = () => !process.env.IMAGE_API_KEY;

export async function generateImage(prompt: string): Promise<GeneratedImage> {
  if (isDemoMode()) return demoImage(prompt);

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 55_000);
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
