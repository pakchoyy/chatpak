const MAX_WIDTH = 768;

// Ubah gambar base64 (png/jpg/svg) menjadi WebP kecil.
export async function toWebP(b64: string, mime: string): Promise<Blob> {
  const img = new Image();
  img.src = `data:${mime};base64,${b64}`;
  await img.decode();
  const w = Math.min(MAX_WIDTH, img.naturalWidth || MAX_WIDTH);
  const h = Math.round(w * ((img.naturalHeight || 1) / (img.naturalWidth || 1)));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Gagal mengonversi gambar."))), "image/webp", 0.8),
  );
}
