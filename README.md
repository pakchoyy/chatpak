# Chatpak

Aplikasi pribadi untuk ngobrol dan bikin gambar dari teks (PWA). Rancangan: `docs/TECH-DESIGN.md`.

```
npm install
cp .env.local.example .env.local   # kosongkan key = mode demo, tanpa biaya
npm run dev
```

## Environment

| Variabel | Fungsi |
| --- | --- |
| `ACCESS_CODE` | Kode akses agar orang lain tidak memakai saldo. Wajib di produksi. |
| `IMAGE_API_URL`, `IMAGE_API_KEY`, `IMAGE_MODEL`, `IMAGE_SIZE`, `IMAGE_QUALITY` | Penyedia gambar. Tanpa key = gambar demo. |
| `CHAT_MODEL` | Model chat. Kosong = jawaban demo. |
| `CHAT_API_URL` | Opsional. Default: `IMAGE_API_URL` dengan `/images/generations` diganti `/chat/completions`. |
| `CHAT_API_KEY` | Opsional. Default memakai `IMAGE_API_KEY`. |

Penyedia harus kompatibel dengan format OpenAI (Images API dan Chat Completions dengan `stream: true`).
