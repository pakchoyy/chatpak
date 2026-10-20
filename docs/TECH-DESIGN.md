# Rancangan Teknis: Generator Gambar Pribadi (PWA)

Turunan dari PRD. Keputusan yang sudah disepakati: kode akses di server, saldo prabayar sebagai batas keras, IndexedDB untuk riwayat, ukuran dan kualitas tetap, 50 item riwayat, 10 generate per hari (pengingat di browser).

## 1. Struktur proyek

```
app/
  layout.tsx            # metadata, manifest, theme-color, registrasi SW
  page.tsx              # halaman utama (client component)
  api/generate/route.ts # route handler, satu-satunya pemanggil API gambar
components/
  PromptForm.tsx        # textarea + tombol generate
  ResultView.tsx        # gambar hasil + tombol unduh + status
  History.tsx           # daftar riwayat (buka / hapus)
  AccessGate.tsx        # input kode akses (sekali, disimpan lokal)
lib/
  provider.ts           # SATU fungsi generateImage(prompt) -> penyedia bisa diganti
  db.ts                 # wrapper IndexedDB (idb)
  image.ts              # konversi ke WebP + downscale di browser
  quota.ts              # counter harian di localStorage
public/
  manifest.json, sw.js, icons/ (192, 512, maskable)
.env.local.example
```

## 2. Alur data

1. Browser: user isi prompt, tekan Generate. Tombol nonaktif, loading tampil.
2. `POST /api/generate` dengan body `{ prompt }` dan header `x-access-code`.
3. Server: cek kode akses (bandingkan dengan `ACCESS_CODE`, waktu konstan), validasi prompt (tidak kosong, maks 1000 karakter), panggil `generateImage`.
4. `generateImage` memanggil Sekai, menerima `b64_json` atau `url`. Jika `url`, server mengunduhnya lalu mengembalikan base64. Browser tidak perlu bicara dengan penyedia.
5. Server membalas `{ image: "<base64>", mime }`. Tidak ada yang disimpan di server.
6. Browser: ubah ke WebP (lebar maks 768 px, kualitas 0.8), simpan ke IndexedDB, tampilkan, naikkan counter harian.

## 3. Route handler (`app/api/generate/route.ts`)

- `export const runtime = "nodejs"`, `export const maxDuration = 60` (cek batas plan Vercel saat deploy).
- Kode status: 401 kode salah, 400 prompt tidak valid, 422 ditolak kebijakan konten, 429 dari penyedia, 502 gagal/timeout penyedia.
- Pesan error di body dalam bahasa Indonesia dan aman ditampilkan; detail asli hanya ke log server. API key dan isi respons mentah tidak pernah dikirim ke browser.
- Timeout fetch ke penyedia 55 detik dengan `AbortController`. Tidak ada retry otomatis, karena setiap percobaan bisa memotong saldo.

## 4. Lapisan penyedia (`lib/provider.ts`)

```ts
export async function generateImage(prompt: string): Promise<{ b64: string; mime: string }>
```

Konfigurasi dari env, bukan hard-code:

| Env | Contoh |
| --- | --- |
| `IMAGE_API_URL` | `https://api.sekaigateway.xyz/v1/images/generations` |
| `IMAGE_API_KEY` | key Sekai |
| `IMAGE_MODEL` | `pixel/gpt-image-2` |
| `IMAGE_SIZE` | `1024x1024` |
| `IMAGE_QUALITY` | `low` (naikkan jika hasil kurang bagus) |
| `ACCESS_CODE` | string acak panjang |

Request mengikuti format OpenAI Images (`model`, `prompt`, `n: 1`, `size`, `quality`). Parameter yang ditolak model akan ketahuan saat uji pertama; kalau begitu, hapus dari body di satu tempat ini.

## 5. Penyimpanan klien (IndexedDB)

- Database `imggen`, store `history`, key `id` (UUID), index `createdAt`.
- Record: `{ id, prompt, createdAt, blob (WebP) }`. Simpan `Blob`, bukan base64, supaya hemat ruang. Tampilkan lewat `URL.createObjectURL` dan lepas dengan `revokeObjectURL`.
- Setelah tiap simpan: jika lebih dari 50 item, hapus yang paling lama.
- Pakai `navigator.storage.persist()` supaya riwayat tidak dibersihkan otomatis oleh browser.
- Fallback jika IndexedDB gagal (mode privat): hasil tetap tampil dan bisa diunduh, riwayat dilewati, dan user diberi tahu.

## 6. Batas pemakaian

- Batas keras: saldo prabayar Sekai.
- Pengingat: `quota.ts` menyimpan `{ date, count }` di localStorage. Setelah 10 per hari, tombol Generate menampilkan peringatan dan meminta konfirmasi untuk lanjut. Ini pengingat, bukan pengaman, karena bisa dilewati.
- Kode akses mencegah orang lain memakai endpoint. Kode disimpan di localStorage setelah dimasukkan sekali dan dikirim lewat header. Jika server membalas 401, kode dihapus dan form kode muncul lagi.

## 7. PWA

- `manifest.json`: `display: standalone`, `start_url: "/"`, ikon 192/512 plus maskable, `theme_color` dan `background_color` mengikuti mode terang/gelap lewat dua tag `<meta name="theme-color" media=...>`.
- `sw.js` tulis tangan, tanpa library:
  - Precache shell minimal (`/`, ikon).
  - Strategi stale-while-revalidate untuk `/_next/static/*` dan ikon, dengan batas umur 7 hari (cek header `date` atau simpan timestamp).
  - Tidak menyentuh `/api/*` dan respons non-GET. Gambar hasil tidak pernah masuk cache SW (hanya ada di IndexedDB).
  - Versi cache di nama cache; `activate` menghapus cache lama.
- Registrasi SW hanya di production.

## 8. UI

- Tailwind, mobile-first, satu kolom, lebar maks `max-w-xl` di desktop.
- Warna netral lewat `dark:` mengikuti `prefers-color-scheme` (tanpa toggle manual).
- Area hasil di atas, form di bawah; tombol Generate tinggi minimal 48 px, lebar penuh.
- Keadaan: kosong, loading (skeleton + teks "Membuat gambar…"), sukses, error (pesan jelas + tombol coba lagi).
- Unduh: `<a download>` dari object URL, nama berkas `gambar-<timestamp>.webp`.
- Riwayat: grid 2 kolom thumbnail; ketuk untuk membuka kembali di area hasil (menampilkan prompt), tombol hapus dengan konfirmasi.
- Aksesibilitas: label pada textarea, `aria-live` untuk status loading dan error, kontras cukup di kedua mode.

## 9. Keamanan

- Key hanya di env server (`.env.local` dan env Vercel). `.env.local` masuk `.gitignore`.
- Tidak ada `NEXT_PUBLIC_` untuk rahasia.
- Panjang prompt dibatasi; body dibatasi ukurannya.
- Tidak ada log prompt atau gambar di server selain status dan durasi.

## 10. Pengujian

- Unit: `lib/quota.ts`, validasi prompt, pemetaan error di `provider.ts` (fetch dimock).
- Manual di HP: install PWA, mode gelap/terang, mode pesawat (shell tetap terbuka, generate memberi error jelas), riwayat bertahan setelah tutup aplikasi, penghapusan.
- Uji biaya: generate 2-3 gambar dulu dan catat pengurangan saldo, lalu hitung sisa kapasitas dari Rp20.000.

## 11. Urutan kerja

1. Scaffold Next.js + Tailwind, `.env.local.example`, `.gitignore`.
2. `provider.ts` + route handler + kode akses; uji dengan curl sampai satu gambar berhasil.
3. UI utama (form, hasil, loading, error, unduh).
4. IndexedDB + riwayat + konversi WebP.
5. Counter harian.
6. Manifest, ikon, service worker.
7. Deploy ke Vercel, isi env, uji di HP.

## 12. Hal yang masih harus kamu cek sendiri

- Harga per gambar dan kebutuhan paket Pixel di Sekai, serta masa berlaku saldo.
- Format respons dan parameter yang diterima `pixel/gpt-image-2` (ketahuan di langkah 2).
- Batas durasi fungsi di plan Vercel yang kamu pakai.
