# Terjemah Medis Awam

Web untuk menerjemahkan istilah medis, singkatan resep, dan foto resep menjadi bahasa sehari-hari.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Fuse.js · Gemini API · localStorage · Vercel

## Fitur

| Fase | Fitur | Implementasi |
|---|---|---|
| 1 | Terjemah ketik langsung, saran istilah serupa | `app/page.tsx`, Fuse.js, `/api/terjemah` |
| 2 | Penjelasan awam, kegunaan, peringatan | `components/KartuHasil.tsx`, `data/istilah.json` |
| 2 | Foto resep otomatis | `app/resep/page.tsx`, `/api/resep` (Gemini vision) |
| 2 | Kamus: cari, A–Z, populer | `app/kamus`, halaman detail statis per istilah |
| 3 | Riwayat: daftar, buka ulang, cari | `app/riwayat/page.tsx`, `lib/riwayat.ts` |
| 4 | Bagikan, salin, simpan gambar | Web Share API, Clipboard API, html-to-image |
| 4 | Perbesar teks, kontras tinggi, bacakan | `components/Aksesibilitas.tsx`, Web Speech API |

### Alur terjemah (RAG sederhana)
1. Teks dicocokkan persis dengan kamus (nama atau sinonim) → langsung dijawab tanpa AI.
2. Jika tidak ada, server mengambil 5 entri kamus paling mirip (Fuse.js) sebagai konteks, lalu memanggil Gemini dengan output JSON terstruktur.
3. Istilah hasil AI yang ternyata ada di kamus diganti dengan data kamus terverifikasi.
4. Prompt melarang AI menyebut dosis/frekuensi minum obat; setiap hasil AI diberi label dan tingkat keyakinan.

## Menjalankan di komputer

Butuh **Node.js 20 atau lebih baru** (cek: `node -v`).

```bash
npm install
cp .env.example .env.local      # Windows (CMD): copy .env.example .env.local
# buka .env.local, isi GEMINI_API_KEY
npm run dev
```

Buka http://localhost:3000

API key gratis: https://aistudio.google.com/apikey

## Deploy ke Vercel

1. Push folder ini ke repository GitHub.
2. Di https://vercel.com → **Add New → Project** → pilih repository → **Import**.
3. Buka **Environment Variables**, tambahkan `GEMINI_API_KEY` (dan `GEMINI_MODEL` bila perlu).
4. Klik **Deploy**.

## Menambah istilah

Tambahkan objek baru di `data/istilah.json`. `slug` harus unik dan berupa huruf kecil dengan tanda hubung.

## Catatan

Informasi bersifat edukasi dan bukan pengganti konsultasi dengan dokter atau apoteker.
